import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Code, MessageCircle, Trophy, Flame, Star, Zap, CheckCircle, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { storage } from '@/lib/storage';
import { motivationalQuotes } from '@/lib/mockData';
import { User, Progress as ProgressType, Challenge } from '@/lib/types';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/config';
import { ShareStatsModal } from '@/components/ShareStatsModal';

export default function Dashboard() {
  const [user, setUser] = useState<User>(storage.getUser());
  const [progress, setProgress] = useState<ProgressType>(storage.getProgress());
  const [backendProgress, setBackendProgress] = useState<{ total_xp?: number; level?: number; completed_challenges?: number[] } | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [dailyQuote] = useState(() => 
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
  );

  // Load progress from backend
  const loadBackendProgress = async () => {
    try {
      const response = await fetch(buildApiUrl('/xp/progress'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: "default_user" })
      });
      
      if (response.ok) {
        const data = await response.json();
        setBackendProgress(data.progress || data);
      }
    } catch (error) {
      console.error('Error loading backend progress:', error);
    }
  };

  // Load challenges with completion status
  const loadChallenges = async () => {
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CHALLENGES}/all-with-progress`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: "default_user" })
      });
      
      if (response.ok) {
        const data = await response.json();
        const challengesData = data.challenges || [];
        
        // Map to Challenge type with completion status
        const mappedChallenges: Challenge[] = challengesData.map((challenge: any) => ({
          id: String(challenge.id || 'unknown'),
          title: challenge.title || 'Untitled Challenge',
          description: challenge.description || 'No description available',
          difficulty: (challenge.difficulty || 'easy') as "easy" | "medium" | "hard",
          language: challenge.language || 'python',
          topic: challenge.topic || 'algorithms',
          xpReward: challenge.xpReward || 50,
          template: challenge.template || '',
          hints: challenge.hints || [],
          testCases: challenge.examples ? challenge.examples.map((ex: any) => ({
            input: Array.isArray(ex.input) ? JSON.stringify(ex.input) : String(ex.input || ''),
            expectedOutput: String(ex.output || '')
          })) : [],
          solution: undefined,
          completed: Boolean(challenge.completed)
        }));
        
        setChallenges(mappedChallenges);
      }
    } catch (error) {
      console.error('Error loading challenges:', error);
    }
  };

  useEffect(() => {
    loadBackendProgress();
    loadChallenges();
  }, []);

  // Refresh progress when component becomes visible (e.g., when navigating back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadBackendProgress();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getXPPercentage = () => {
    const currentXP = backendProgress?.total_xp || 0;
    const currentLevel = backendProgress?.level || 1;
    
    // Calculate XP needed for current level
    let xpForCurrentLevel = 0;
    for (let i = 1; i < currentLevel; i++) {
      xpForCurrentLevel += i * 100;
    }
    
    // Calculate XP needed for next level
    let xpForNextLevel = 0;
    for (let i = 1; i <= currentLevel; i++) {
      xpForNextLevel += i * 100;
    }
    
    const xpInCurrentLevel = currentXP - xpForCurrentLevel;
    const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
    
    return (xpInCurrentLevel / xpNeededForNextLevel) * 100;
  };

  const quickAccessCards = [
    {
      title: 'Flashcards',
      description: 'Review programming concepts',
      icon: BookOpen,
      link: '/flashcards',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      learned: backendProgress?.achievement_progress?.flashcards_learned || 0
    },
    {
      title: 'Challenges',
      description: 'Solve coding problems',
      icon: Code,
      link: '/challenges',
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      completed: backendProgress?.completed_challenges?.length || 0
    },
    {
      title: 'Ask Tutor',
      description: 'Get programming help',
      icon: MessageCircle,
      link: '/tutor',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600'
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-success/20 text-success border-success/30';
      case 'medium': return 'bg-warning/20 text-warning border-warning/30';
      case 'hard': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          {getGreeting()}, {user.name}! 
          <span className="ml-2 text-3xl">{user.avatar}</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Ready to level up your programming skills? Let's continue your coding journey!
        </p>
        <Button 
          onClick={() => setShowShareModal(true)}
          variant="outline" 
          className="shadow-card hover:shadow-glow transition-all gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share Your Progress
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Level Progress */}
        <Card className="bg-gradient-card shadow-card hover:shadow-primary transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Level {backendProgress?.level || 1}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {backendProgress?.total_xp || 0} XP
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={getXPPercentage()} variant="xp" className="h-3" />
          </CardContent>
        </Card>

        {/* Streak */}
        <Card className="bg-gradient-card shadow-card hover:shadow-success transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-success rounded-lg">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-streak-fire">
                  {backendProgress?.streak || 0} Day Streak
                </CardTitle>
                <p className="text-sm text-muted-foreground">Keep it going!</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Total XP */}
        <Card className="bg-gradient-card shadow-card hover:shadow-primary transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">{backendProgress?.total_xp || 0} XP</CardTitle>
                <p className="text-sm text-muted-foreground">Total earned</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Achievements */}
        <Card className="bg-gradient-card shadow-card hover:shadow-success transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-success rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">{backendProgress?.achievements?.length || 0}</CardTitle>
                <p className="text-sm text-muted-foreground">Achievements</p>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Quick Access Cards */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <Zap className="w-7 h-7 text-primary" />
          Quick Access
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickAccessCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.title} to={card.link}>
                <Card className="group bg-gradient-card shadow-card hover:shadow-primary hover:scale-105 transition-all duration-300 cursor-pointer">
                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 ${card.color} rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-xl">{card.title}</CardTitle>
                    <p className="text-muted-foreground">{card.description}</p>
                  </CardHeader>
                  <CardContent className="text-center">
                    {card.learned !== undefined && (
                      <p className="text-sm text-success font-medium">
                        {card.learned} cards learned
                      </p>
                    )}
                    {card.completed !== undefined && (
                      <p className="text-sm text-success font-medium">
                        {card.completed} challenges completed
                      </p>
                    )}
                    {card.title === 'Ask Tutor' && (
                      <p className="text-sm text-success font-medium">
                        Ask your first question
                      </p>
                    )}
                    <Button 
                      variant="outline" 
                      className="mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    >
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Challenges Section */}
      {challenges.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Code className="w-7 h-7 text-primary" />
            Recent Challenges
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.slice(0, 6).map((challenge) => (
              <Link key={challenge.id} to="/challenges">
                <Card                  className={`group bg-gradient-card shadow-card hover:shadow-primary hover:scale-105 transition-all duration-300 cursor-pointer ${
                   Boolean(challenge.completed) ? 'border-success/30 bg-success/5' : ''
                 }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-semibold line-clamp-1">
                          {challenge.title}
                        </CardTitle>
                                                 {Boolean(challenge.completed) && (
                           <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                         )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={`${getDifficultyColor(challenge.difficulty)} text-xs`}>
                        {challenge.difficulty}
                      </Badge>
                                             {Boolean(challenge.completed) && (
                         <Badge variant="outline" className="text-success border-success text-xs">
                           Completed
                         </Badge>
                       )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {challenge.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {challenge.topic}
                      </Badge>
                      <span className="text-xs font-semibold text-primary">
                        +{challenge.xpReward} XP
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link to="/challenges">
              <Button variant="outline" className="shadow-card hover:shadow-glow transition-all">
                View All Challenges
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Daily Quote */}
      <Card className="bg-gradient-primary text-primary-foreground shadow-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Star className="w-6 h-6" />
            Daily Inspiration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <blockquote className="text-lg italic leading-relaxed">
            "{dailyQuote}"
          </blockquote>
        </CardContent>
      </Card>

      {/* Share Stats Modal */}
      <ShareStatsModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        user={user}
        backendProgress={backendProgress}
        challenges={challenges}
      />
    </div>
  );
}