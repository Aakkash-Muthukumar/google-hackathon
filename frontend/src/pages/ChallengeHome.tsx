import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Clock, Star } from 'lucide-react';
import { storage } from '@/lib/storage';
import { useLanguage } from '@/hooks/useLanguage';

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
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    // Load from localStorage instead of API for offline-first approach
    const storedProgress = storage.getProgress();
    const storedChallenges = storage.getChallenges();
    const user = storage.getUser();
    
    const completedChallenges = storedChallenges
      .filter(challenge => challenge.completed)
      .map(challenge => ({
        id: challenge.id,
        title: challenge.title,
        difficulty: challenge.difficulty,
        topic: challenge.topic,
        xp: challenge.xpReward,
        completed: challenge.completed,
        date: new Date().toISOString().split('T')[0], // Mock date
        completedAt: new Date().toLocaleString()
      }));

    setProgress({
      challenges: completedChallenges,
      totalXP: user.xp,
      level: user.level,
      xpToNextLevel: user.xpToNextLevel,
      streak: user.streak
    });
    setLoading(false);
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
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
              <Card className="glass-effect">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Trophy className="h-4 w-4 mr-2 text-primary" />
                    {t('progress.level')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{progress.level}</div>
                  <div className="flex items-center space-x-2 mt-2">
                    <ProgressBar value={progressPercentage} className="flex-1" />
                    <span className="text-xs text-muted-foreground">
                      {progress.totalXP % progress.xpToNextLevel}/{progress.xpToNextLevel}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Star className="h-4 w-4 mr-2 text-primary" />
                    {t('progress.totalXP')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{progress.totalXP}</div>
                </CardContent>
              </Card>

              <Card className="glass-effect">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Target className="h-4 w-4 mr-2 text-primary" />
                    {t('progress.completed')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{progress.challenges.length}</div>
                </CardContent>
              </Card>

              <Card className="glass-effect">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-primary" />
                    {t('progress.streak')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{progress.streak}</div>
                  <div className="text-xs text-muted-foreground">{t('progress.days')}</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Challenges */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>{t('challenges.recent')}</CardTitle>
                <CardDescription>
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
                            <h3 className="font-semibold">{challenge.title}</h3>
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