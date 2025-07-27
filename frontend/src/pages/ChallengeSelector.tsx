import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shuffle, Target, ArrowLeft, Zap } from 'lucide-react';
import { mockChallenges } from '@/lib/mockData';
import { storage } from '@/lib/storage';
import { useLanguage } from '@/hooks/useLanguage';

const topics = [
  'arrays', 'strings', 'linked-list', 'math', 'recursion', 'dynamic-programming', 'trees', 'graphs'
];
const difficulties = ['easy', 'medium', 'hard'];

const ChallengeSelector: React.FC = () => {
  const [difficulty, setDifficulty] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const generateChallenge = (selectedDifficulty?: string, selectedTopic?: string) => {
    // Treat "any" as no filter
    const effectiveDifficulty = selectedDifficulty === "any" ? "" : selectedDifficulty;
    const effectiveTopic = selectedTopic === "any" ? "" : selectedTopic;
    // For now, use mock data. In the future, this will call backend API
    const filteredChallenges = mockChallenges.filter(challenge => {
      const difficultyMatch = !effectiveDifficulty || challenge.difficulty === effectiveDifficulty;
      const topicMatch = !effectiveTopic || challenge.topic === effectiveTopic;
      return difficultyMatch && topicMatch;
    });

    const randomChallenge = filteredChallenges[Math.floor(Math.random() * filteredChallenges.length)] || mockChallenges[0];
    
    // Store the current challenge for the workspace
    localStorage.setItem('currentChallenge', JSON.stringify(randomChallenge));
    
    return randomChallenge;
  };

  const handleGetChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const challenge = generateChallenge(difficulty, topic);
    console.log('Generated challenge:', challenge);
    
    setIsGenerating(false);
    navigate('/challenges/workspace');
  };

  const handleSurpriseMe = async () => {
    setIsGenerating(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const challenge = generateChallenge(); // Random challenge
    console.log('Surprise challenge:', challenge);
    
    setIsGenerating(false);
    navigate('/challenges/workspace');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/challenges')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t('challenges.chooseChallenge')}</h1>
          <p className="text-muted-foreground">{t('challenges.selectPreferences')}</p>
        </div>
      </div>

      {isGenerating ? (
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">{t('challenges.generating')}</h3>
            <p className="text-muted-foreground">{t('challenges.generatingDescription')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Custom Challenge Form */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-primary" />
                {t('challenges.customChallenge')}
              </CardTitle>
              <CardDescription>
                {t('challenges.customDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGetChallenge} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('challenges.difficulty')} ({t('common.optional')})</label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('challenges.anyDifficulty')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">{t('challenges.anyDifficulty')}</SelectItem>
                      {difficulties.map(d => (
                        <SelectItem key={d} value={d}>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant="outline" 
                              className={
                                d === 'easy' ? 'border-success text-success' :
                                d === 'medium' ? 'border-warning text-warning' :
                                'border-destructive text-destructive'
                              }
                            >
                              {d.charAt(0).toUpperCase() + d.slice(1)}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('challenges.topic')} ({t('common.optional')})</label>
                  <Select value={topic} onValueChange={setTopic}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('challenges.anyTopic')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">{t('challenges.anyTopic')}</SelectItem>
                      {topics.map(t => (
                        <SelectItem key={t} value={t}>
                          {t.charAt(0).toUpperCase() + t.slice(1).replace('-', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full shadow-glow">
                  <Target className="mr-2 h-4 w-4" />
                  {t('challenges.getChallenge')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Surprise Me Card */}
          <Card className="glass-effect border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shuffle className="h-5 w-5 mr-2 text-primary" />
                {t('challenges.surpriseMe')}
              </CardTitle>
              <CardDescription>
                {t('challenges.surpriseDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="text-6xl">🎲</div>
              <p className="text-muted-foreground">
                {t('challenges.randomChallenge')}
              </p>
              <Button 
                onClick={handleSurpriseMe}
                size="lg"
                className="w-full bg-gradient-primary shadow-glow"
              >
                <Zap className="mr-2 h-5 w-5" />
                {t('challenges.surpriseMe')}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ChallengeSelector; 