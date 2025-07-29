import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Eye, Lightbulb, Trophy, Code, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Challenge } from '@/lib/types';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/config';

async function verifyChallenge(challengeId: number | string, userCode: string, userId: string = "default_user") {
  const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CHALLENGES}/verify`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challenge_id: Number(challengeId),
      user_code: userCode,
      user_id: userId,
    }),
  });
  if (!response.ok) throw new Error('Verification failed');
  return response.json();
}

async function fetchChallenges() {
  try {
    const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CHALLENGES}/all`));
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch challenges: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Fetch challenges response:', data);
    return data.challenges || [];
  } catch (error) {
    console.error('Error in fetchChallenges:', error);
    throw error;
  }
}

async function fetchSolution(challengeId: number | string) {
  const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CHALLENGES}/solution`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challenge_id: Number(challengeId) }),
  });
  if (!response.ok) throw new Error('Failed to fetch solution');
  return response.json();
}

async function fetchHints(challengeId: number | string) {
  const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CHALLENGES}/hints`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challenge_id: Number(challengeId) }),
  });
  if (!response.ok) throw new Error('Failed to fetch hints');
  return response.json();
}

async function fetchUserProgress(userId: string = "default_user") {
  const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CHALLENGES}/progress`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!response.ok) throw new Error('Failed to fetch progress');
  return response.json();
}

export default function Challenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [userCode, setUserCode] = useState('');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [solution, setSolution] = useState('');
  const [hints, setHints] = useState('');
  const [loadingSolution, setLoadingSolution] = useState(false);
  const [loadingHints, setLoadingHints] = useState(false);
  const [userProgress, setUserProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [generalMessage, setGeneralMessage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadChallenges();
    loadUserProgress();
  }, []);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      console.log('Loading challenges...');
      const data = await fetchChallenges();
      console.log('Raw challenges data:', data);
      
      if (!Array.isArray(data)) {
        console.error('Challenges data is not an array:', data);
        setChallenges([]);
        return;
      }
      
      const mappedChallenges: Challenge[] = data.map((challenge: any) => ({
        id: String(challenge.id || 'unknown'),
        title: challenge.title || 'Untitled Challenge',
        description: challenge.description || 'No description available',
        difficulty: (challenge.difficulty || 'easy') as "easy" | "medium" | "hard",
        language: challenge.language || 'python',
        topic: challenge.topic || 'algorithms',
        xpReward: challenge.xpReward || 50,
        completed: false, // Will be updated based on user progress
        template: challenge.template || '',
        hints: challenge.hints || [],
        testCases: challenge.examples ? challenge.examples.map((ex: any) => ({
          input: ex.input || '',
          expectedOutput: ex.output || ''
        })) : [],
        solution: undefined
      }));
      
      console.log('Mapped challenges:', mappedChallenges);
      setChallenges(mappedChallenges);
      
    } catch (error) {
      console.error('Error loading challenges:', error);
      setError('Failed to load challenges');
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProgress = async () => {
    try {
      const progress = await fetchUserProgress();
      setUserProgress(progress);
      
      // Update completed status for challenges
      setChallenges(prevChallenges => 
        prevChallenges.map(challenge => ({
          ...challenge,
          completed: progress.completed_challenges?.includes(Number(challenge.id)) || false
        }))
      );
    } catch (error) {
      console.error('Error loading user progress:', error);
    }
  };

  const runTests = async () => {
    if (!selectedChallenge || !userCode.trim()) return;
    
    setIsRunning(true);
    setTestResults([]);
    
    try {
      const result = await verifyChallenge(selectedChallenge.id, userCode);
      console.log('Test results:', result);
      
      setTestResults(result.test_results || []);
      
      if (result.correct) {
        setGeneralMessage(`✅ All tests passed! Earned ${result.xp_earned || selectedChallenge.xpReward} XP!`);
        // Update user progress
        setUserProgress(result.user_progress);
        // Mark challenge as completed
        setChallenges(prev => prev.map(c => 
          c.id === selectedChallenge.id ? { ...c, completed: true } : c
        ));
      } else {
        setGeneralMessage(`❌ Some tests failed. ${result.feedback || 'Please check your solution.'}`);
      }
      
      // Clear message after 5 seconds
      setTimeout(() => setGeneralMessage(''), 5000);
      
    } catch (error) {
      console.error('Error running tests:', error);
      setGeneralMessage('❌ Error running tests. Please try again.');
      setTimeout(() => setGeneralMessage(''), 5000);
    } finally {
      setIsRunning(false);
    }
  };

  const submitSolution = async () => {
    if (!selectedChallenge || !userCode.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const result = await verifyChallenge(selectedChallenge.id, userCode);
      
      if (result.correct) {
        setGeneralMessage(`🎉 Challenge completed! Earned ${result.xp_earned || selectedChallenge.xpReward} XP!`);
        // Update user progress
        setUserProgress(result.user_progress);
        // Mark challenge as completed
        setChallenges(prev => prev.map(c => 
          c.id === selectedChallenge.id ? { ...c, completed: true } : c
        ));
      } else {
        setGeneralMessage(`❌ Solution incorrect. ${result.feedback || 'Please try again.'}`);
      }
      
      // Clear message after 5 seconds
      setTimeout(() => setGeneralMessage(''), 5000);
      
    } catch (error) {
      console.error('Error submitting solution:', error);
      setGeneralMessage('❌ Error submitting solution. Please try again.');
      setTimeout(() => setGeneralMessage(''), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShowSolution = async () => {
    if (!selectedChallenge || solution) return;
    
    setLoadingSolution(true);
    try {
      const result = await fetchSolution(selectedChallenge.id);
      setSolution(result.solution || 'No solution available');
      setShowSolution(true);
    } catch (error) {
      console.error('Error fetching solution:', error);
      setSolution('Error loading solution');
      setShowSolution(true);
    } finally {
      setLoadingSolution(false);
    }
  };

  const handleShowHints = async () => {
    if (!selectedChallenge || hints) return;
    
    setLoadingHints(true);
    try {
      const result = await fetchHints(selectedChallenge.id);
      setHints(result.hints || 'No hints available');
      setShowHints(true);
    } catch (error) {
      console.error('Error fetching hints:', error);
      setHints('Error loading hints');
      setShowHints(true);
    } finally {
      setLoadingHints(false);
    }
  };

  const handleGenerateChallenge = () => {
    // Navigate to the challenge selection page instead of generating immediately
    navigate('/challenges/new');
  };

  const handleStartChallenge = (challenge: Challenge) => {
    // Store the selected challenge in localStorage for the workspace
    localStorage.setItem('currentChallenge', JSON.stringify({
      id: Number(challenge.id),
      title: challenge.title,
      description: challenge.description,
      difficulty: challenge.difficulty,
      language: challenge.language,
      topic: challenge.topic,
      xpReward: challenge.xpReward,
      template: challenge.template,
      hints: challenge.hints,
      examples: challenge.testCases.map(tc => ({
        input: tc.input,
        output: tc.expectedOutput
      }))
    }));
    
    // Navigate to the workspace
    navigate('/challenges/workspace');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-success/20 text-success border-success/30';
      case 'medium': return 'bg-warning/20 text-warning border-warning/30';
      case 'hard': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  async function fetchCongratsFeedback(challengeTitle: string, userCode: string) {
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CHALLENGES}/congrats`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: challengeTitle,
          user_code: userCode,
        }),
      });
      if (!response.ok) return 'Great job!';
      const data = await response.json();
      return data.feedback || 'Great job!';
    } catch (error) {
      return 'Great job solving this challenge!';
    }
  }

  if (selectedChallenge) {
    try {
      return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setSelectedChallenge(null)}>
              ← Back to Challenges
            </Button>
            <div className="flex items-center gap-3">
              <Badge className={getDifficultyColor(selectedChallenge.difficulty)}>
                {selectedChallenge.difficulty}
              </Badge>
              <span className="text-sm text-muted-foreground">
                +{selectedChallenge.xpReward} XP
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Problem Description */}
            <div className="space-y-6">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Code className="w-6 h-6 text-primary" />
                    {selectedChallenge.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedChallenge.description}
                  </p>
                  <div className="space-y-3">
                    <h4 className="font-semibold">Test Cases:</h4>
                    {selectedChallenge.testCases.map((testCase, index) => (
                      <div key={index} className="bg-muted rounded-lg p-3">
                        <div className="text-sm">
                          <div className="font-medium mb-1">Input:</div>
                          <code className="text-xs bg-background px-2 py-1 rounded">
                            {testCase.input}
                          </code>
                        </div>
                        <div className="text-sm mt-2">
                          <div className="font-medium mb-1">Expected Output:</div>
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
                    onClick={handleShowHints}
                    disabled={loadingHints}
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    {loadingHints ? 'Loading...' : 'Generate Hint'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShowSolution}
                    disabled={loadingSolution}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {loadingSolution ? 'Loading...' : 'Generate Solution'}
                  </Button>
                </div>

                {showHints && hints && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Hints</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {hints}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {showSolution && solution && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Solution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                        <code>{solution}</code>
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Code Editor and Results */}
            <div className="space-y-6">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Code className="w-6 h-6 text-primary" />
                    Your Solution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={userCode}
                    onChange={(e) => setUserCode(e.target.value)}
                    placeholder="Write your solution here..."
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <div className="flex space-x-2">
                    <Button
                      onClick={runTests}
                      disabled={isRunning || !userCode.trim()}
                      variant="outline"
                    >
                      {isRunning ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Check Test Results
                    </Button>
                    <Button
                      onClick={submitSolution}
                      disabled={isSubmitting || !userCode.trim()}
                      className="shadow-glow"
                    >
                      {isSubmitting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      ) : (
                        <Trophy className="h-4 w-4 mr-2" />
                      )}
                      Submit Solution
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Test Results */}
              {testResults.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Test Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {testResults.map((result, index) => (
                        <div 
                          key={index} 
                          className={`p-3 rounded-lg border ${
                            result.pass 
                              ? 'bg-success/10 border-success/20' 
                              : 'bg-destructive/10 border-destructive/20'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">
                              Test Case {index + 1}
                            </span>
                            {result.pass ? (
                              <CheckCircle className="h-4 w-4 text-success" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                          <div className="text-xs space-y-1">
                            <div>
                              <span className="font-medium">Input:</span>{' '}
                              <code className="bg-background px-1 py-0.5 rounded">
                                {result.input}
                              </code>
                            </div>
                            <div>
                              <span className="font-medium">Expected:</span>{' '}
                              <code className="bg-background px-1 py-0.5 rounded">
                                {result.expected_output}
                              </code>
                            </div>
                            <div>
                              <span className="font-medium">Actual:</span>{' '}
                              <code className="bg-background px-1 py-0.5 rounded">
                                {result.actual_output}
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
    } catch (error) {
      console.error('Error rendering challenge detail:', error);
      return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-destructive">Something went wrong</h1>
            <p className="text-lg text-muted-foreground">
              Error rendering challenge detail
            </p>
            <Button
              onClick={() => {
                setSelectedChallenge(null);
                setError('');
              }}
              className="mx-auto"
            >
              Back to Challenges
            </Button>
          </div>
        </div>
      );
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-lg text-muted-foreground">Loading challenges...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-destructive">Something went wrong</h1>
          <p className="text-lg text-muted-foreground">
            {error}
          </p>
          <Button
            onClick={() => {
              setError('');
              loadChallenges();
            }}
            className="mx-auto"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Coding Challenges
        </h1>
        <p className="text-lg text-muted-foreground">
          Solve problems and level up your programming skills
        </p>
        <div className="flex justify-center space-x-4">
          <Button 
            size="lg" 
            className="shadow-glow"
            onClick={handleGenerateChallenge}
            disabled={isGenerating}
          >
            <Plus className="mr-2 h-5 w-5" />
            Generate New Challenge
          </Button>
        </div>
      </div>

      {/* Progress Summary */}
      {userProgress && (
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="font-mono text-sm">
                Total XP: {userProgress.total_xp || 0} | Level: {userProgress.level || 1} | Completed: {userProgress.completed_challenges?.length || 0}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* General Message */}
      {generalMessage && (
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="font-mono text-sm">
                {generalMessage}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Challenges Grid */}
      {challenges.length === 0 ? (
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">No challenges yet!</h3>
            <p className="text-muted-foreground mb-6">
              Generate your first challenge to get started on your coding journey.
            </p>
            <Button 
              size="lg" 
              className="shadow-glow"
              onClick={handleGenerateChallenge}
            >
              <Plus className="mr-2 h-5 w-5" />
              Generate Your First Challenge
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => (
            <Card 
              key={challenge.id} 
              className="bg-gradient-card shadow-card hover:shadow-glow hover:scale-105 transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedChallenge(challenge)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg leading-tight">
                    {challenge.title}
                  </CardTitle>
                  <Badge className={getDifficultyColor(challenge.difficulty)}>
                    {challenge.difficulty}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Code className="h-4 w-4" />
                  {challenge.language}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {challenge.description}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {challenge.topic}
                  </Badge>
                  <span className="text-sm font-semibold text-primary">
                    +{challenge.xpReward} XP
                  </span>
                </div>
                <Button 
                  className="w-full shadow-glow"
                  onClick={() => handleStartChallenge(challenge)}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start Challenge
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}