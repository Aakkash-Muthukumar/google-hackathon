import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Code, MessageCircle, Trophy, Flame, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { storage } from '@/lib/storage';
import { motivationalQuotes } from '@/lib/mockData';
import { User, Progress as ProgressType } from '@/lib/types';

export default function Dashboard() {
  const [user, setUser] = useState<User>(storage.getUser());
  const [progress, setProgress] = useState<ProgressType>(storage.getProgress());
  const [dailyQuote] = useState(() => 
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
  );

  useEffect(() => {
    // Update daily streak if it's a new day
    const now = new Date();
    const lastActive = new Date(progress.lastActiveDate);
    const isNewDay = now.toDateString() !== lastActive.toDateString();
    
    if (isNewDay) {
      const timeDiff = now.getTime() - lastActive.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
      
      if (daysDiff === 1) {
        // Consecutive day - increase streak
        const newStreak = user.streak + 1;
        const updatedUser = { ...user, streak: newStreak };
        setUser(updatedUser);
        storage.saveUser(updatedUser);
      } else if (daysDiff > 1) {
        // Missed days - reset streak
        const updatedUser = { ...user, streak: 0 };
        setUser(updatedUser);
        storage.saveUser(updatedUser);
      }
      
      // Update last active date
      const updatedProgress = { ...progress, lastActiveDate: now };
      setProgress(updatedProgress);
      storage.saveProgress(updatedProgress);
    }
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getXPPercentage = () => {
    return (user.xp / user.xpToNextLevel) * 100;
  };

  const quickAccessCards = [
    {
      title: 'Flashcards',
      description: 'Review programming concepts',
      icon: BookOpen,
      link: '/flashcards',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      learned: progress.flashcardsLearned
    },
    {
      title: 'Challenges',
      description: 'Solve coding problems',
      icon: Code,
      link: '/challenges',
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      completed: progress.challengesCompleted
    },
    {
      title: 'Ask Tutor',
      description: 'Get programming help',
      icon: MessageCircle,
      link: '/tutor',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600'
    }
  ];

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
                <CardTitle className="text-lg">Level {user.level}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {user.xp}/{user.xpToNextLevel} XP
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
                  {user.streak} Day Streak
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
                <CardTitle className="text-lg">{progress.totalXP} XP</CardTitle>
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
                <CardTitle className="text-lg">{user.achievements.length}</CardTitle>
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

      {/* Today's Challenge Preview */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Code className="w-6 h-6 text-primary" />
            Today's Challenge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Two Sum Problem</h3>
              <p className="text-muted-foreground">
                A classic algorithm problem perfect for practicing array manipulation and hash maps.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="bg-success/20 text-success px-3 py-1 rounded-full text-sm font-medium">
                Easy
              </span>
              <span className="text-sm text-muted-foreground">+50 XP</span>
            </div>
            <Link to="/challenges">
              <Button variant="success" className="w-full sm:w-auto">
                Start Challenge
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}