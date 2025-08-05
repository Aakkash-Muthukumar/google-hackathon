import { useState, useRef } from 'react';
import { Share2, Download, Copy, X, Trophy, Flame, Star, Zap, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Challenge } from '@/lib/types';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface ShareStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name: string;
    avatar: string;
    streak: number;
    achievements: string[];
  };
  backendProgress: {
    total_xp?: number;
    level?: number;
    completed_challenges?: number[];
  } | null;
  challenges: Challenge[];
}

export function ShareStatsModal({ isOpen, onClose, user, backendProgress, challenges }: ShareStatsModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  const completedChallenges = challenges.filter(c => c.completed);
  const totalChallenges = challenges.length;
  const completionRate = totalChallenges > 0 ? Math.round((completedChallenges.length / totalChallenges) * 100) : 0;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-success/20 text-success border-success/30';
      case 'medium': return 'bg-warning/20 text-warning border-warning/30';
      case 'hard': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  const generateImage = async () => {
    if (!statsRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(statsRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        width: 800,
        height: 1000,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Create download link
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${user.name.replace(/\s+/g, '_')}_coding_progress.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast.success('Stats image downloaded! Ready to share on social media.');
        }
      }, 'image/png', 1.0);

    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyAsImage = async () => {
    if (!statsRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(statsRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        width: 800,
        height: 1000,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            toast.success('Stats image copied to clipboard! Ready to paste on social media.');
          } catch (error) {
            console.error('Failed to copy image:', error);
            toast.error('Failed to copy image. Try downloading instead.');
          }
        }
      }, 'image/png', 1.0);

    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Your Coding Progress
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex gap-2 justify-center">
            <Button 
              onClick={copyAsImage} 
              disabled={isGenerating}
              className="gap-2"
            >
              <Copy className="w-4 h-4" />
              {isGenerating ? 'Generating...' : 'Copy Image'}
            </Button>
            <Button 
              onClick={generateImage} 
              disabled={isGenerating}
              variant="outline"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? 'Generating...' : 'Download Image'}
            </Button>
          </div>

          {/* Stats Card for Image Generation */}
          <div 
            ref={statsRef}
            className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-lg"
            style={{ width: '800px', minHeight: '1000px', margin: '0 auto' }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">{user.avatar}</div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                {user.name}'s Coding Journey
              </h1>
              <p className="text-xl text-gray-600">Programming Progress Report</p>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mt-4"></div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* Level */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-800">
                      Level {backendProgress?.level || 1}
                    </div>
                    <div className="text-sm text-gray-600">Current Level</div>
                  </div>
                </div>
              </div>

              {/* Streak */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl">
                    <Flame className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-800">
                      {user.streak}
                    </div>
                    <div className="text-sm text-gray-600">Day Streak</div>
                  </div>
                </div>
              </div>

              {/* Total XP */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-800">
                      {backendProgress?.total_xp || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total XP</div>
                  </div>
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-gradient-to-r from-green-400 to-green-500 rounded-xl">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-800">
                      {user.achievements.length}
                    </div>
                    <div className="text-sm text-gray-600">Achievements</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Challenge Progress */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                Challenge Progress
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {completedChallenges.length}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-800 mb-1">
                    {totalChallenges}
                  </div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {completionRate}%
                  </div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
            </div>

            {/* Recent Completed Challenges */}
            {completedChallenges.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Recent Achievements
                </h3>
                <div className="space-y-3">
                  {completedChallenges.slice(0, 5).map((challenge) => (
                    <div key={challenge.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 text-sm">
                          {challenge.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                            {challenge.difficulty}
                          </span>
                          <span className="text-xs text-gray-600">
                            +{challenge.xpReward} XP
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-6 border-t border-gray-200">
              <p className="text-gray-600 text-lg mb-2">
                Keep coding, keep growing! 🚀
              </p>
              <p className="text-gray-500 text-sm">
                Generated from Programming Learning Platform
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}