import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Clock, Star, CheckCircle } from 'lucide-react';
import { storage } from '@/lib/storage';
import { useLanguage } from '@/hooks/useLanguage';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/config';

type PastChallenge = {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  xp: number;
  completed: boolean;
  date: string;
  completedAt?: string;
};

type ChallengeProgress = {
  challenges: PastChallenge[];
  totalXP: number;
  level: number;
  xpToNextLevel: number;
  streak: number;
};

const ChallengeHome: React.FC = () => {
  const [progress, setProgress] = useState<ChallengeProgress>({
    challenges: [],
    totalXP: 0,
    level: 1,
    xpToNextLevel: 100,
    streak: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load user progress from backend
        const progressResponse = await fetch(buildApiUrl(`${API_ENDPOINTS.CHALLENGES}/progress`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: "default_user" }),
        });
        
        let userProgress = null;
        if (progressResponse.ok) {
          userProgress = await progressResponse.json();
        }
        
        // Load challenges from backend
        const challengesResponse = await fetch(buildApiUrl(`${API_ENDPOINTS.CHALLENGES}/all`));
        let challenges = [];
        if (challengesResponse.ok) {
          const data = await challengesResponse.json();
          challenges = data.challenges || [];
        }
        
        // Get user data from storage as fallback
        const user = storage.getUser();
        
        // Map completed challenges
        const completedChallenges = challenges
          .filter((challenge: { id: number }) => userProgress?.completed_challenges?.includes(challenge.id))
          .map((challenge: { id: number; title: string; difficulty?: string; topic?: string; xpReward?: number }) => ({
            id: String(challenge.id),
            title: challenge.title,
            difficulty: challenge.difficulty?.toLowerCase() as 'easy' | 'medium' | 'hard',
            topic: challenge.topic || '',
            xp: challenge.xpReward || 50,
            completed: true,
            date: new Date().toISOString().split('T')[0],
            completedAt: new Date().toLocaleString()
          }));

        setProgress({
          challenges: completedChallenges,
          totalXP: userProgress?.total_xp || user.xp || 0,
          level: userProgress?.level || user.level || 1,
          xpToNextLevel: 100, // Fixed value for now
          streak: user.streak || 0
        });
        
      } catch (error) {
        console.error('Error loading challenge data:', error);
        setError('Failed to load challenge data');
        
        // Fallback to storage data
        const user = storage.getUser();
        setProgress({
          challenges: [],
          totalXP: user.xp || 0,
          level: user.level || 1,
          xpToNextLevel: 100,
          streak: user.streak || 0
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-success text-success-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'hard': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const progressPercentage = progress.totalXP > 0 ? 
    ((progress.totalXP % progress.xpToNextLevel) / progress.xpToNextLevel) * 100 : 0;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-destructive">Error Loading Challenges</h1>
          <p className="text-lg text-muted-foreground mb-6">{error}</p>
          <Button 
            size="lg" 
            className="shadow-glow"
            onClick={() => navigate('/challenges/new')}
          >
            <Target className="mr-2 h-5 w-5" />
            Start New Challenge
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-primary">
          {t('challenges.title')}
        </h1>
        <p className="text-lg text-muted-foreground mb-6">
          {t('challenges.subtitle')}
        </p>
        <Button 
          size="lg" 
          className="shadow-glow"
          onClick={() => navigate('/challenges/new')}
        >
          <Target className="mr-2 h-5 w-5" />
          {t('challenges.newChallenge')}
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Progress Overview */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gradient-card shadow-card hover:shadow-glow hover:scale-105 transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center text-foreground">
                    <Trophy className="h-4 w-4 mr-2 text-primary" />
                    {t('progress.level')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{progress.level}</div>
                  <div className="flex items-center space-x-2 mt-2">
                    <ProgressBar value={progressPercentage} className="flex-1" />
                    <span className="text-xs text-muted-foreground">
                      {progress.totalXP % progress.xpToNextLevel}/{progress.xpToNextLevel}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card shadow-card hover:shadow-glow hover:scale-105 transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center text-foreground">
                    <Star className="h-4 w-4 mr-2 text-primary" />
                    {t('progress.totalXP')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{progress.totalXP}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card shadow-card hover:shadow-glow hover:scale-105 transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center text-foreground">
                    <Target className="h-4 w-4 mr-2 text-primary" />
                    {t('progress.completed')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">{progress.challenges.length}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card shadow-card hover:shadow-glow hover:scale-105 transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center text-foreground">
                    <Clock className="h-4 w-4 mr-2 text-primary" />
                    {t('progress.streak')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">{progress.streak}</div>
                  <div className="text-xs text-muted-foreground">{t('progress.days')}</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Challenges */}
          <div className="lg:col-span-3">
            <Card className="bg-gradient-card shadow-card hover:shadow-glow transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Clock className="h-5 w-5 text-primary" />
                  {t('challenges.recent')}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {progress.challenges.length === 0 
                    ? t('challenges.noRecent') 
                    : t('challenges.recentDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {progress.challenges.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">{t('challenges.getStarted')}</p>
                    <Button variant="outline" onClick={() => navigate('/challenges/new')}>
                      {t('challenges.firstChallenge')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {progress.challenges.slice(0, 5).map((challenge) => (
                      <div 
                        key={challenge.id} 
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{challenge.title}</h3>
                              {Boolean(challenge.completed) && (
                                <CheckCircle className="h-4 w-4 text-success" />
                              )}
                            </div>
                            <Badge className={getDifficultyColor(challenge.difficulty)}>
                              {challenge.difficulty}
                            </Badge>
                            <Badge variant="outline">
                              {challenge.topic}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t('challenges.completedOn')}: {challenge.completedAt || challenge.date}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">+{challenge.xp} XP</div>
                          <div className="text-sm text-muted-foreground">{t('common.completed')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengeHome; 