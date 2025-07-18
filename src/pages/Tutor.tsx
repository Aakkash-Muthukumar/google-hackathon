import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, MessageCircle, Loader, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { storage } from '@/lib/storage';
import { ChatMessage as ChatMessageType } from '@/lib/types';

export default function Tutor() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load chat messages from storage
    const storedMessages = storage.getChatMessages();
    setMessages(storedMessages);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Send to local Flask API
      const response = await fetch('http://localhost:5000/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: inputMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from tutor');
      }

      const data = await response.json();
      
      const tutorMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: 'tutor',
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, tutorMessage];
      setMessages(finalMessages);
      storage.saveChatMessages(finalMessages);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Fallback response when offline or API unavailable
      const fallbackMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        content: isOnline 
          ? "I'm sorry, but I'm having trouble connecting to the tutoring service right now. Please make sure the local server is running on http://localhost:5000. In the meantime, try reviewing your flashcards or working on coding challenges!"
          : "I'm currently offline, but I'd love to help when you're back online! In the meantime, you can practice with flashcards and coding challenges that work offline.",
        sender: 'tutor',
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, fallbackMessage];
      setMessages(finalMessages);
      storage.saveChatMessages(finalMessages);
    }
    
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewThread = (messageContent: string) => {
    setInputMessage(`I have a follow-up question about: "${messageContent.substring(0, 50)}..."`);
  };

  const suggestedQuestions = [
    "What's the difference between a list and a tuple in Python?",
    "How do I optimize my code for better performance?",
    "Can you explain object-oriented programming concepts?",
    "What are some common Python design patterns?",
    "How do I handle errors and exceptions properly?"
  ];

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4 mb-6">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
          <Bot className="w-10 h-10 text-primary" />
          AI Programming Tutor
        </h1>
        <p className="text-lg text-muted-foreground">
          Ask questions about programming concepts, debugging, or best practices
        </p>
        {!isOnline && (
          <div className="bg-warning/20 text-warning px-4 py-2 rounded-lg inline-block">
            <AlertCircle className="w-4 h-4 inline mr-2" />
            You're offline - Limited tutoring available
          </div>
        )}
      </div>

      {/* Chat Container */}
      <Card className="flex-1 flex flex-col bg-gradient-card shadow-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-primary" />
            Chat with your AI Tutor
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <ScrollArea className="flex-1 px-6" ref={scrollRef}>
            <div className="space-y-4 pb-4">
              {messages.length === 0 && (
                <div className="text-center py-8 space-y-6">
                  <div className="text-6xl">🤖</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Welcome to your AI Programming Tutor!</h3>
                    <p className="text-muted-foreground mb-6">
                      I'm here to help you learn programming. Ask me anything!
                    </p>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium">Try asking:</h4>
                      <div className="grid gap-2">
                        {suggestedQuestions.map((question, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            className="text-left justify-start h-auto p-3 text-sm"
                            onClick={() => setInputMessage(question)}
                          >
                            {question}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.sender === 'tutor' && (
                    <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-2' : ''}`}>
                    <div
                      className={`p-4 rounded-2xl ${
                        message.sender === 'user'
                          ? 'bg-gradient-primary text-primary-foreground ml-auto'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                      {message.sender === 'tutor' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => startNewThread(message.content)}
                        >
                          Ask follow-up
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {message.sender === 'user' && (
                    <div className="w-8 h-8 bg-gradient-success rounded-full flex items-center justify-center flex-shrink-0 mt-1 order-3">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-muted p-4 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Tutor is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* Input Area */}
          <div className="border-t p-6">
            <div className="flex gap-3">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask your programming question here... (Press Enter to send)"
                className="flex-1 min-h-[60px] max-h-32 resize-none"
                disabled={isLoading}
              />
              <Button 
                onClick={sendMessage} 
                disabled={!inputMessage.trim() || isLoading}
                className="self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="mt-3 text-xs text-muted-foreground text-center">
              💡 Tip: Be specific about your programming language and the problem you're facing for better help!
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}