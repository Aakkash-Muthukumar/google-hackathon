import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/hooks/useLanguage';

export function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const { t } = useLanguage();

  const sendQuickQuestion = () => {
    if (!message.trim()) return;
    // Navigate to tutor page with pre-filled message
    window.location.href = `/tutor?q=${encodeURIComponent(message)}`;
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-elegant z-50 bg-gradient-primary hover:scale-110 transition-transform"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-80 shadow-card z-50 animate-scale-in bg-gradient-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Quick Question</span>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-6 w-6 p-0">
            <X className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Quick programming question..."
            className="min-h-20 text-sm"
          />
          <Button onClick={sendQuickQuestion} size="sm" className="w-full" disabled={!message.trim()}>
            <Send className="w-4 h-4 mr-2" />
            Ask Tutor
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}