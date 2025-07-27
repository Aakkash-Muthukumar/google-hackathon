import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Globe, Palette, RotateCcw, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { storage } from '@/lib/storage';
import { User as UserType } from '@/lib/types';

export default function Settings() {
  const [user, setUser] = useState<UserType>(storage.getUser());
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    // Apply theme changes
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save theme preference
    const updatedUser = { ...user, theme: isDarkMode ? 'dark' as const : 'light' as const };
    setUser(updatedUser);
    storage.saveUser(updatedUser);
  }, [isDarkMode]);

  const handleUserUpdate = (updates: Partial<UserType>) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    storage.saveUser(updatedUser);
  };

  const resetProgress = () => {
    if (confirm('Are you sure you want to reset all your progress? This action cannot be undone.')) {
      storage.clearAllData();
      // Reload the page to reset the app state
      window.location.reload();
    }
  };

  const exportData = () => {
    const data = {
      user: storage.getUser(),
      flashcards: storage.getFlashCards(),
      challenges: storage.getChallenges(),
      chatMessages: storage.getChatMessages(),
      progress: storage.getProgress(),
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `programming-tutor-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const languageOptions = [
    { value: 'python', label: 'Python' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'cpp', label: 'C++' },
    { value: 'java', label: 'Java' }
  ];

  const uiLanguageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' }
  ];

  const avatarOptions = ['🧑‍💻', '👩‍💻', '👨‍💻', '🚀', '⭐', '🎯', '🔥', '💎'];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
          <SettingsIcon className="w-10 h-10 text-primary" />
          Settings
        </h1>
        <p className="text-lg text-muted-foreground">
          Customize your learning experience
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Settings */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <User className="w-5 h-5 text-primary" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                value={user.name}
                onChange={(e) => handleUserUpdate({ name: e.target.value })}
                placeholder="Enter your name"
              />
            </div>

            <div className="space-y-2">
              <Label>Avatar</Label>
              <div className="grid grid-cols-4 gap-3">
                {avatarOptions.map((avatar) => (
                  <Button
                    key={avatar}
                    variant={user.avatar === avatar ? "default" : "outline"}
                    className="h-12 text-2xl"
                    onClick={() => handleUserUpdate({ avatar })}
                  >
                    {avatar}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Programming Language Focus</Label>
              <Select
                value={user.language}
                onValueChange={(value) => handleUserUpdate({ language: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-primary" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark themes
                </p>
              </div>
              <Switch
                checked={isDarkMode}
                onCheckedChange={setIsDarkMode}
              />
            </div>

            <div className="space-y-2">
              <Label>Interface Language</Label>
              <Select
                value={user.uiLanguage}
                onValueChange={(value) => handleUserUpdate({ uiLanguage: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {uiLanguageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Learning Preferences */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-primary" />
              Learning Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Current Level</h4>
                <div className="bg-gradient-primary text-primary-foreground px-4 py-2 rounded-lg text-center">
                  Level {user.level} - {user.xp}/{user.xpToNextLevel} XP
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Achievements</h4>
                <div className="text-center">
                  <div className="text-2xl font-bold text-xp-gold">
                    {user.achievements.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Unlocked
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Download className="w-5 h-5 text-primary" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={exportData}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Learning Data
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start text-warning hover:text-warning"
                onClick={resetProgress}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset All Progress
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              💡 Your data is stored locally on your device. Export regularly to keep backups.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>Learning Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-primary">{user.level}</div>
              <div className="text-sm text-muted-foreground">Current Level</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-success">{user.streak}</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-xp-gold">{user.xp}</div>
              <div className="text-sm text-muted-foreground">Total XP</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-achievement">{user.achievements.length}</div>
              <div className="text-sm text-muted-foreground">Achievements</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>About Programming Tutor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Version:</strong> 1.0.0
            </p>
            <p>
              <strong>Offline-First:</strong> All your data is stored locally on your device
            </p>
            <p>
              <strong>AI Tutor:</strong> Powered by local LLM for privacy and offline access
            </p>
            <p>
              <strong>Languages Supported:</strong> Python, JavaScript, C++, Java
            </p>
          </div>
          
          <div className="mt-6 p-4 bg-primary/10 rounded-lg">
            <p className="text-sm">
              🎯 <strong>Mission:</strong> Making programming education accessible to students in low-resource areas through offline-first learning tools.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}