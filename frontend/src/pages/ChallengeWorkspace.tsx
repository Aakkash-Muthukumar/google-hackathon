import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Play, Send, Lightbulb, Eye, Trophy, CheckCircle, XCircle } from 'lucide-react';
import { Challenge } from '@/lib/types';
import { storage } from '@/lib/storage';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/config';

interface TestResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
}

// Interface for backend-generated challenge format
interface BackendChallenge {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  language: string;
  topic: string;
  xpReward: number;
  input_format: string;
  output_format: string;
  template: string;
  examples: Array<{input: string; output: string}>;
  hints: string[];
}

const ChallengeWorkspace: React.FC = () => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [code, setCode] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [solution, setSolution] = useState<string>('');
  const [loadingSolution, setLoadingSolution] = useState(false);
  const [aiHints, setAiHints] = useState<string>('');
  const [loadingHints, setLoadingHints] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    // Load current challenge from localStorage or navigate back if none
    const storedChallenge = localStorage.getItem('currentChallenge');
    if (storedChallenge) {
      try {
        const parsedChallenge: BackendChallenge = JSON.parse(storedChallenge);
        console.log('Loaded challenge from localStorage:', parsedChallenge);
        
        // Convert backend format to frontend format
        const frontendChallenge: Challenge = {
          id: String(parsedChallenge.id),
          title: parsedChallenge.title,
          description: parsedChallenge.description,
          difficulty: parsedChallenge.difficulty as "easy" | "medium" | "hard",
          language: parsedChallenge.language,
          topic: parsedChallenge.topic,
          xpReward: parsedChallenge.xpReward,
          completed: false,
          template: parsedChallenge.template,
          hints: parsedChallenge.hints || [], // These are the pre-generated hints
          testCases: parsedChallenge.examples ? parsedChallenge.examples.map(ex => ({
            input: Array.isArray(ex.input) ? ex.input.join(' ') : String(ex.input),
            expectedOutput: String(ex.output)
          })) : [],
          solution: undefined // Will be loaded separately if needed
        };
        
        setChallenge(frontendChallenge);
        setCode(parsedChallenge.template || '');
      } catch (error) {
        console.error('Error parsing stored challenge:', error);
        toast.error('Error loading challenge', {
          description: 'Please try selecting a challenge again'
        });
        navigate('/challenges');
      }
    } else {
      toast.error('No challenge selected', {
        description: 'Please select a challenge to start'
      });
      navigate('/challenges');
    }
  }, [navigate]);

  const runTests = async () => {
    if (!challenge) return;
    
    setIsRunning(true);
    
    try {
      // Call backend to verify solution
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CHALLENGES}/verify`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge_id: Number(challenge.id),
          user_code: code,
          user_id: "default_user"
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to verify solution');
      }
      
      const result = await response.json();
      console.log('Verification result:', result);
      
      // Convert backend test results to frontend format
      const results: TestResult[] = (result.test_results || []).map((testResult: any) => ({
        input: testResult.input || '',
        expectedOutput: testResult.expected_output || '',
        actualOutput: testResult.actual_output || '',
        passed: testResult.pass || false
      }));
      
      setTestResults(results);
      
      if (result.correct) {
        toast.success('All tests passed!', {
          description: `Earned ${result.xp_earned || challenge.xpReward} XP!`
        });
      } else {
        toast.error('Some tests failed', {
          description: result.feedback || 'Please check your solution'
        });
      }
      
    } catch (error) {
      console.error('Error running tests:', error);
      toast.error('Error running tests', {
        description: 'Please try again'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const submitSolution = async () => {
    if (!challenge) return;
    
    setIsSubmitting(true);
    setSubmitMessage(null); // Clear any previous message
    
    try {
      // Call backend to verify solution
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CHALLENGES}/verify`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge_id: Number(challenge.id),
          user_code: code,
          user_id: "default_user"
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit solution');
      }
      
      const result = await response.json();
      
      if (result.correct) {
        setIsCompleted(true);
        setSubmitMessage({
          type: 'success',
          message: `🎉 Challenge completed! Earned ${result.xp_earned || challenge.xpReward} XP!`
        });
      } else {
        setSubmitMessage({
          type: 'error',
          message: result.feedback || 'Solution incorrect. Please try again.'
        });
      }
      
    } catch (error) {
      console.error('Error submitting solution:', error);
      setSubmitMessage({
        type: 'error',
        message: 'Error submitting solution. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadSolution = async () => {
    if (!challenge || solution) return;
    
    setLoadingSolution(true);
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CHALLENGES}/solution`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: Number(challenge.id) }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to load solution');
      }
      
      const result = await response.json();
      setSolution(result.solution || 'No solution available');
    } catch (error) {
      console.error('Error loading solution:', error);
      setSolution('Error loading solution');
    } finally {
      setLoadingSolution(false);
    }
  };

  const loadAiHints = async () => {
    if (!challenge || aiHints) return;
    
    setLoadingHints(true);
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CHALLENGES}/hints`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: Number(challenge.id) }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to load hints');
      }
      
      const result = await response.json();
      setAiHints(result.hints || 'No hints available');
    } catch (error) {
      console.error('Error loading hints:', error);
      setAiHints('Error loading hints');
    } finally {
      setLoadingHints(false);
    }
  };

  if (!challenge) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-success text-success-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'hard': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/challenges/new')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{challenge.title}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className={getDifficultyColor(challenge.difficulty)}>
                {challenge.difficulty}
              </Badge>
              <Badge variant="outline">{challenge.topic}</Badge>
              <span className="text-sm text-muted-foreground">
                {challenge.xpReward} XP
              </span>
            </div>
          </div>
        </div>
        
        {isCompleted && (
          <div className="flex items-center space-x-2 text-success">
            <Trophy className="h-5 w-5" />
            <span className="font-semibold">{t('common.completed')}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Challenge Description */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('challenges.description')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {challenge.description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('challenges.examples')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {challenge.testCases.slice(0, 3).map((testCase, idx) => (
                  <div key={idx} className="bg-muted rounded-lg p-3">
                    <div className="text-sm">
                      <div className="font-medium mb-1">{t('challenges.input')}:</div>
                      <code className="text-xs bg-background px-2 py-1 rounded">
                        {testCase.input}
                      </code>
                    </div>
                    <div className="text-sm mt-2">
                      <div className="font-medium mb-1">{t('challenges.output')}:</div>
                      <code className="text-xs bg-background px-2 py-1 rounded">
                        {testCase.expectedOutput}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Help Section */}
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!showHints) {
                    loadAiHints();
                  }
                  setShowHints(!showHints);
                }}
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                {showHints ? t('challenges.hideHints') : t('challenges.showHints')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!showSolution) {
                    loadSolution();
                  }
                  setShowSolution(!showSolution);
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showSolution ? t('challenges.hideSolution') : t('challenges.showSolution')}
              </Button>
            </div>

            {/* Pre-generated hints from challenge */}
            {showHints && challenge.hints && challenge.hints.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Hints</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {challenge.hints.map((hint, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">
                        {idx + 1}. {hint}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* AI-generated hints */}
            {showHints && aiHints && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">AI Hints</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingHints ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Generating hints...</p>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {aiHints}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {showSolution && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('challenges.solution')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingSolution ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Generating solution...</p>
                    </div>
                  ) : (
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{solution}</code>
                    </pre>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Code Editor and Results */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('challenges.codeEditor')}</CardTitle>
              <CardDescription>
                {t('challenges.writeYourSolution')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t('challenges.codePlaceholder')}
                className="min-h-[300px] font-mono text-sm"
              />
              <div className="flex space-x-2 mt-4">
                <Button
                  onClick={runTests}
                  disabled={isRunning || !code.trim()}
                  variant="outline"
                >
                  {isRunning ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {t('challenges.runTests')}
                </Button>
                <Button
                  onClick={submitSolution}
                  disabled={isSubmitting || !code.trim()}
                  className="shadow-glow"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {t('challenges.submit')}
                </Button>
              </div>
              
              {/* Persistent Submit Message */}
              {submitMessage && (
                <div className={`mt-4 p-4 rounded-lg border ${
                  submitMessage.type === 'success' 
                    ? 'bg-success/10 border-success/20 text-success-foreground' 
                    : 'bg-destructive/10 border-destructive/20 text-destructive-foreground'
                }`}>
                  <div className="flex items-center">
                    {submitMessage.type === 'success' ? (
                      <CheckCircle className="h-5 w-5 mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 mr-2" />
                    )}
                    <span className="font-medium">{submitMessage.message}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Results */}
          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('challenges.testResults')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testResults.map((result, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-lg border ${
                        result.passed 
                          ? 'bg-success/10 border-success/20' 
                          : 'bg-destructive/10 border-destructive/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">
                          {t('challenges.testCase')} {idx + 1}
                        </span>
                        {result.passed ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <div className="text-xs space-y-1">
                        <div>
                          <span className="font-medium">{t('challenges.input')}:</span>{' '}
                          <code className="bg-background px-1 py-0.5 rounded">
                            {result.input}
                          </code>
                        </div>
                        <div>
                          <span className="font-medium">{t('challenges.expected')}:</span>{' '}
                          <code className="bg-background px-1 py-0.5 rounded">
                            {result.expectedOutput}
                          </code>
                        </div>
                        <div>
                          <span className="font-medium">{t('challenges.actual')}:</span>{' '}
                          <code className="bg-background px-1 py-0.5 rounded">
                            {result.actualOutput}
                          </code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChallengeWorkspace; 