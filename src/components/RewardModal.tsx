import { useEffect, useState } from 'react';
import { Trophy, Star, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: {
    type: 'level_up' | 'streak' | 'badge';
    title: string;
    description: string;
    xpGained?: number;
    badgeIcon?: string;
  };
}

export function RewardModal({ isOpen, onClose, reward }: RewardModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const getIcon = () => {
    switch (reward.type) {
      case 'level_up': return <Zap className="w-8 h-8 text-yellow-500" />;
      case 'streak': return <Star className="w-8 h-8 text-orange-500" />;
      case 'badge': return <Trophy className="w-8 h-8 text-purple-500" />;
    }
  };

  const getGradient = () => {
    switch (reward.type) {
      case 'level_up': return 'from-yellow-400 to-orange-500';
      case 'streak': return 'from-orange-400 to-red-500';
      case 'badge': return 'from-purple-400 to-pink-500';
    }
  };

  return (
    <>
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          <div className="absolute inset-0 animate-[confetti_3s_ease-out_forwards]">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-red-500 rounded"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-10px`,
                  animationDelay: `${Math.random() * 3}s`,
                  transform: `rotate(${Math.random() * 360}deg)`
                }}
              />
            ))}
          </div>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="sr-only">Reward Earned</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            <div className={`mx-auto w-20 h-20 rounded-full bg-gradient-to-r ${getGradient()} flex items-center justify-center animate-scale-in`}>
              {reward.badgeIcon ? (
                <span className="text-3xl">{reward.badgeIcon}</span>
              ) : (
                getIcon()
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground">{reward.title}</h3>
              <p className="text-muted-foreground">{reward.description}</p>
              
              {reward.xpGained && (
                <Badge variant="secondary" className="mt-2">
                  +{reward.xpGained} XP
                </Badge>
              )}
            </div>
            
            <Button onClick={onClose} className="w-full">
              Continue Learning
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
}