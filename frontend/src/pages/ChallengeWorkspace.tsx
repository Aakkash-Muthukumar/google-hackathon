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

interface TestResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
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
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    // Load current challenge from localStorage or navigate back if none
    const storedChallenge = localStorage.getItem('currentChallenge');
    if (storedChallenge) {
      const parsedChallenge = JSON.parse(storedChallenge);
      setChallenge(parsedChallenge);
      setCode(parsedChallenge.template || '');
    } else {
      navigate('/challenges/new');
    }
  }, [navigate]);

  const runTests = async () => {
    if (!challenge) return;
    
    setIsRunning(true);
    
    // Simulate test execution (in real app, this would call backend)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const results: TestResult[] = challenge.testCases.map(testCase => ({
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput: testCase.expectedOutput, // Mock: assume correct for demo
      passed: true // Mock: assume all pass for demo
    }));
    
    setTestResults(results);
    setIsRunning(false);
  };

  const submitSolution = async () => {
    if (!challenge) return;
    
    setIsSubmitting(true);
    
    // Simulate submission (in real app, this would call backend)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const allTestsPassed = testResults.length > 0 && testResults.every(result => result.passed);
    
    if (allTestsPassed) {
      // Update user progress
      const user = storage.getUser();
      const updatedUser = {
        ...user,
        xp: user.xp + challenge.xpReward,
        level: Math.floor((user.xp + challenge.xpReward) / 100) + 1,
      };
      storage.saveUser(updatedUser);
      
      // Mark challenge as completed
      const challenges = storage.getChallenges();
      const updatedChallenges = challenges.map(c => 
        c.id === challenge.id ? { ...c, completed: true } : c
      );
      storage.saveChallenges(updatedChallenges);
      
      setIsCompleted(true);
      toast.success(t('challenges.success'), {
        description: `${t('challenges.earned')} ${challenge.xpReward} XP!`
      });
    } else {
      toast.error(t('challenges.failed'), {
        description: t('challenges.tryAgain')
      });
    }
    
    setIsSubmitting(false);
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
                onClick={() => setShowHints(!showHints)}
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                {showHints ? t('challenges.hideHints') : t('challenges.showHints')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSolution(!showSolution)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showSolution ? t('challenges.hideSolution') : t('challenges.showSolution')}
              </Button>
            </div>

            {showHints && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('challenges.hints')}</CardTitle>
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

            {showSolution && challenge.solution && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('challenges.solution')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{challenge.solution}</code>
                  </pre>
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
                  disabled={isSubmitting || testResults.length === 0 || !code.trim()}
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