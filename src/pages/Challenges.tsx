import { useState, useEffect } from 'react';
import { Play, Eye, Lightbulb, Trophy, Code, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Challenge } from '@/lib/types';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
async function verifyChallenge(challengeId: number | string, userCode: string) {
  const response = await fetch(`${apiUrl}/challenge/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challenge_id: Number(challengeId),
      user_code: userCode,
      method: 'model',
    }),
  });
  if (!response.ok) throw new Error('Verification failed');
  return response.json();
}

async function fetchChallenges() {
  const response = await fetch(`${apiUrl}/challenge/all`);
  if (!response.ok) throw new Error('Failed to fetch challenges');
  return response.json();
}

async function fetchSolution(challengeId: number | string) {
  const response = await fetch(`${apiUrl}/challenge/solution`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challenge_id: Number(challengeId) }),
  });
  if (!response.ok) throw new Error('Failed to fetch solution');
  return response.json();
}

async function fetchHints(challengeId: number | string) {
  const response = await fetch(`${apiUrl}/challenge/hints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challenge_id: Number(challengeId) }),
  });
  if (!response.ok) throw new Error('Failed to fetch hints');
  return response.json();
}

export default function Challenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [code, setCode] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [solution, setSolution] = useState<string>('');
  const [hints, setHints] = useState<string>('');
  const [loadingSolution, setLoadingSolution] = useState(false);
  const [loadingHints, setLoadingHints] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    fetchChallenges()
      .then((data) => {
        const mapped = data.map((c: any) => ({
          id: c.id.toString(),
          title: c.title,
          description: c.description,
          difficulty: c.difficulty,
          language: c.language || 'python',
          topic: c.topic || '',
          xpReward: c.xpReward || 50,
          completed: false,
          template: c.template || '',
          testCases: (c.examples || []).map((ex: any) => ({
            input: JSON.stringify(ex.input),
            expectedOutput: JSON.stringify(ex.output)
          })),
        }));
        setChallenges(mapped);
      })
      .catch(() => setChallenges([]));
  }, []);

  useEffect(() => {
    if (selectedChallenge) {
      setCode(selectedChallenge.template);
      setShowSolution(false);
      setShowHints(false);
      setSolution('');
      setHints('');
      setTestResults([]);
    }
  }, [selectedChallenge]);

  const runTests = async () => {
    if (!selectedChallenge) return;
    setIsRunning(true);
    setTestResults(["⏳ Running tests with AI model..."]);
    try {
      const data = await verifyChallenge(selectedChallenge.id, code);
      // data: { correct: boolean, feedback: string }
      setTestResults([
        (data.correct ? '✅ Correct! ' : '❌ Incorrect. ') + (data.feedback || '')
      ]);
    } catch (err) {
      setTestResults(["❌ Error running tests. Please try again."]);
    }
    setIsRunning(false);
  };

  const submitSolution = async () => {
    if (!selectedChallenge) return;
    setIsRunning(true);
    setTestResults(["⏳ Submitting solution for review..."]);
    try {
      const data = await verifyChallenge(selectedChallenge.id, code);
      setTestResults([
        (data.correct ? '🎉 Challenge completed! ' : '❌ Not correct. ') + (data.feedback || '')
      ]);
      if (data.correct) {
        setChallenges((prev) =>
          prev.map((c) =>
            c.id === selectedChallenge.id ? { ...c, completed: true } : c
          )
        );
      }
    } catch {
      setTestResults(["❌ Error submitting solution."]);
    }
    setIsRunning(false);
  };

  const handleShowSolution = async () => {
    if (!selectedChallenge) return;
    if (showSolution) {
      setShowSolution(false);
      return;
    }
    setLoadingSolution(true);
    setShowSolution(true);
    try {
      const data = await fetchSolution(selectedChallenge.id);
      setSolution(data.solution);
    } catch {
      setSolution('❌ Error fetching solution.');
    }
    setLoadingSolution(false);
  };

  const handleShowHints = async () => {
    if (!selectedChallenge) return;
    if (showHints) {
      setShowHints(false);
      return;
    }
    setLoadingHints(true);
    setShowHints(true);
    try {
      const data = await fetchHints(selectedChallenge.id);
      setHints(data.hints);
    } catch {
      setHints('❌ Error fetching hints.');
    }
    setLoadingHints(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-success/20 text-success border-success/30';
      case 'medium': return 'bg-warning/20 text-warning border-warning/30';
      case 'hard': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  if (selectedChallenge) {
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
                    <div key={index} className="bg-muted p-3 rounded-lg text-sm">
                      <div><strong>Input:</strong> {testCase.input}</div>
                      <div><strong>Output:</strong> {testCase.expectedOutput}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            {/* Hints */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <Lightbulb className="w-5 h-5 text-warning" />
                    Hints
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleShowHints}
                    disabled={loadingHints}
                  >
                    {showHints ? 'Hide' : 'Show'} Hints
                  </Button>
                </div>
              </CardHeader>
              {showHints && (
                <CardContent>
                  <div className="space-y-3">
                    {loadingHints ? (
                      <div className="text-sm text-muted-foreground">Loading hints...</div>
                    ) : (
                      <pre className="text-sm whitespace-pre-wrap">{hints}</pre>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
            {/* Test Results */}
            {testResults.length > 0 && (
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-primary" />
                    Test Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {testResults.map((result, index) => (
                      <div key={index} className="font-mono text-sm">
                        {result}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          {/* Code Editor */}
          <div className="space-y-4">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle>Code Editor</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Write your solution here..."
                  className="min-h-96 font-mono text-sm resize-none"
                  disabled={isRunning}
                />
              </CardContent>
            </Card>
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={runTests} variant="outline" disabled={isRunning}>
                <Play className="w-4 h-4 mr-2" />
                {isRunning ? 'Running...' : 'Run Tests'}
              </Button>
              <Button onClick={submitSolution} variant="success" disabled={isRunning}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Solution
              </Button>
              <Button 
                variant="outline" 
                onClick={handleShowSolution}
                disabled={isRunning || loadingSolution}
              >
                <Eye className="w-4 h-4 mr-2" />
                {showSolution ? 'Hide' : 'Show'} Solution
              </Button>
            </div>
            {/* Solution */}
            {showSolution && (
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg">Solution</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingSolution ? (
                    <div className="text-sm text-muted-foreground">Loading solution...</div>
                  ) : (
                    <pre className="bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                      {solution}
                    </pre>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Coding Challenges</h1>
        <p className="text-lg text-muted-foreground">
          Solve problems and level up your programming skills
        </p>
      </div>
      {/* Challenge Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map((challenge) => (
          <Card 
            key={challenge.id}
            className="group bg-gradient-card shadow-card hover:shadow-primary hover:scale-105 transition-all duration-300 cursor-pointer"
            onClick={() => setSelectedChallenge(challenge)}
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {challenge.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getDifficultyColor(challenge.difficulty)}>
                      {challenge.difficulty}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {challenge.topic}
                    </span>
                  </div>
                </div>
                {challenge.completed && (
                  <Trophy className="w-6 h-6 text-xp-gold ml-2" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm leading-relaxed">
                {challenge.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{challenge.language}</span>
                </div>
                <div className="text-sm font-medium text-xp-gold">
                  +{challenge.xpReward} XP
                </div>
              </div>
              <Button 
                variant={challenge.completed ? "success" : "default"}
                className="w-full group-hover:scale-105 transition-transform"
              >
                {challenge.completed ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Completed
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Challenge
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Progress Summary */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-xp-gold" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-success">
                {challenges.filter(c => c.completed).length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-warning">
                {challenges.filter(c => !c.completed).length}
              </div>
              <div className="text-sm text-muted-foreground">Remaining</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-xp-gold">
                {challenges.filter(c => c.completed).reduce((sum, c) => sum + c.xpReward, 0)}
              </div>
              <div className="text-sm text-muted-foreground">XP Earned</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}