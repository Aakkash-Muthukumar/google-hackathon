import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Lock, Star, Zap, Flame, Target, BookOpen, MapPin } from 'lucide-react';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/config';
import { useLanguage } from '@/hooks/useLanguage';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: string;
  requirement: Record<string, number>;
  xp_reward: number;
  unlocked: boolean;
}

interface AchievementProgress {
  challenges_completed: number;
  flashcards_learned: number;
  streak_days: number;
  perfect_solutions: number;
  different_topics: number;
  different_difficulties: number;
}

interface AchievementsData {
  unlocked_achievements: Achievement[];
  locked_achievements: Achievement[];
  achievement_progress: AchievementProgress;
  total_achievements: number;
  unlocked_count: number;
}

const Achievements: React.FC = () => {
  const [achievementsData, setAchievementsData] = useState<AchievementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const { t } = useLanguage();

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CHALLENGES}/achievements`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: "default_user" })
      });

      if (response.ok) {
        const data = await response.json();
        setAchievementsData(data);
      } else {
        setError('Failed to load achievements');
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
      setError('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'challenge': return <Target className="w-6 h-6" />;
      case 'streak': return <Flame className="w-6 h-6" />;
      case 'level': return <Star className="w-6 h-6" />;
      case 'topic': return <MapPin className="w-6 h-6" />;
      case 'difficulty': return <Zap className="w-6 h-6" />;
      case 'flashcard': return <BookOpen className="w-6 h-6" />;
      case 'perfect': return <Trophy className="w-6 h-6" />;
      default: return <Trophy className="w-6 h-6" />;
    }
  };

  const getProgressForAchievement = (achievement: Achievement) => {
    if (!achievementsData) return { current: 0, required: 0, percentage: 0 };

    const progress = achievementsData.achievement_progress;
    const requirement = achievement.requirement;
    
    for (const [key, required] of Object.entries(requirement)) {
      const current = progress[key as keyof AchievementProgress] || 0;
      const percentage = Math.min((current / required) * 100, 100);
      return { current, required, percentage };
    }
    
    return { current: 0, required: 0, percentage: 0 };
  };

  const getFilteredAchievements = () => {
    if (!achievementsData) return { unlocked: [], locked: [] };

    const allAchievements = [
      ...achievementsData.unlocked_achievements,
      ...achievementsData.locked_achievements
    ];

    if (selectedFilter === 'all') {
      return {
        unlocked: achievementsData.unlocked_achievements,
        locked: achievementsData.locked_achievements
      };
    }

    const filtered = allAchievements.filter(achievement => achievement.type === selectedFilter);
    return {
      unlocked: filtered.filter(a => a.unlocked),
      locked: filtered.filter(a => !a.unlocked)
    };
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'challenge': return 'Challenges';
      case 'streak': return 'Streaks';
      case 'level': return 'Levels';
      case 'topic': return 'Topics';
      case 'difficulty': return 'Difficulties';
      case 'flashcard': return 'Flashcards';
      case 'perfect': return 'Perfect Solutions';
      default: return type;
    }
  };

  const filters = [
    { id: 'all', label: 'All', icon: Trophy },
    { id: 'challenge', label: 'Challenges', icon: Target },
    { id: 'streak', label: 'Streaks', icon: Flame },
    { id: 'level', label: 'Levels', icon: Star },
    { id: 'topic', label: 'Topics', icon: MapPin },
    { id: 'difficulty', label: 'Difficulties', icon: Zap },
    { id: 'flashcard', label: 'Flashcards', icon: BookOpen },
    { id: 'perfect', label: 'Perfect', icon: Trophy }
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center py-8">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  const { unlocked, locked } = getFilteredAchievements();

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          Achievements
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Track your progress and unlock badges as you master programming concepts
        </p>
        
        {/* Progress Overview */}
        {achievementsData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {achievementsData.unlocked_count}
                </div>
                <div className="text-sm text-muted-foreground">Unlocked</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-success">
                  {achievementsData.total_achievements}
                </div>
                <div className="text-sm text-muted-foreground">Total</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-xp-gold">
                  {Math.round((achievementsData.unlocked_count / achievementsData.total_achievements) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Completion</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 justify-center">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setSelectedFilter(filter.id)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              selectedFilter === filter.id
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <filter.icon className="w-4 h-4" />
            {filter.label}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="space-y-8">
        {/* Unlocked Achievements */}
        {unlocked.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="w-6 h-6 text-success" />
              Unlocked Achievements ({unlocked.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {unlocked.map((achievement) => (
                <Card key={achievement.id} className="bg-gradient-success/10 border-success/20 shadow-card hover:shadow-glow transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-success/20 rounded-lg text-success">
                          {getAchievementIcon(achievement.type)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{achievement.title}</CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {getTypeLabel(achievement.type)}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-2xl">{achievement.icon}</div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        +{achievement.xp_reward} XP
                      </Badge>
                      <div className="flex items-center gap-1 text-success">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-medium">Unlocked</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Locked Achievements */}
        {locked.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Lock className="w-6 h-6 text-muted-foreground" />
              Locked Achievements ({locked.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locked.map((achievement) => {
                const progress = getProgressForAchievement(achievement);
                return (
                  <Card key={achievement.id} className="bg-muted/50 border-muted shadow-card opacity-75">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                            {getAchievementIcon(achievement.type)}
                          </div>
                          <div>
                            <CardTitle className="text-lg text-muted-foreground">{achievement.title}</CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {getTypeLabel(achievement.type)}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-2xl opacity-50">{achievement.icon}</div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{progress.current}/{progress.required}</span>
                        </div>
                        <Progress value={progress.percentage} className="h-2" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          +{achievement.xp_reward} XP
                        </Badge>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Lock className="w-4 h-4" />
                          <span className="text-sm">Locked</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {unlocked.length === 0 && locked.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">
              No achievements found
            </h3>
            <p className="text-muted-foreground">
              Start completing challenges to unlock achievements!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Achievements; 