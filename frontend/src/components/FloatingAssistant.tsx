import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Trash2, Minimize2, Maximize2, Bot, User, Loader, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/hooks/useLanguage';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/config';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const autoScrollEnabledRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const { t } = useLanguage();

  // Auto-scroll to bottom function
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  }, []);

  // Check if user is near bottom of chat
  const isNearBottom = useCallback(() => {
    if (!scrollRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const threshold = 100; // pixels from bottom
    return scrollHeight - scrollTop - clientHeight < threshold;
  }, []);

  // Auto-scroll when new messages are added
  useEffect(() => {
    if (messages.length > 0 && autoScrollEnabledRef.current) {
      console.log('Auto-scrolling for new message, enabled:', autoScrollEnabledRef.current);
      scrollToBottom('smooth');
    }
  }, [messages, scrollToBottom]);

  // Auto-scroll during streaming responses
  useEffect(() => {
    if (isLoading && autoScrollEnabledRef.current) {
      console.log('Auto-scrolling during streaming, enabled:', autoScrollEnabledRef.current);
      scrollToBottom('auto');
    }
  }, [isLoading, scrollToBottom]);

  // Auto-scroll during content updates (for streaming)
  useEffect(() => {
    if (messages.length > 0 && autoScrollEnabledRef.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'assistant' && lastMessage.content.length > 0) {
        // Auto-scroll during streaming content updates
        scrollToBottom('auto');
      }
    }
  }, [messages]);

  // Check online status
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

  // Handle scroll events to show/hide scroll button and manage auto-scroll
  useEffect(() => {
    let lastScrollTop = 0;
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
        const isUserScrolling = Math.abs(scrollTop - lastScrollTop) > 5; // Detect significant scroll movement
        
        // Scroll event detected
        
        setShowScrollButton(!isAtBottom);
        
        // If user is scrolling up, disable auto-scroll
        if (isUserScrolling && scrollTop < lastScrollTop && !isAtBottom) {
          autoScrollEnabledRef.current = false;
          setAutoScrollEnabled(false);
        }
        
        // Re-enable auto-scroll when user scrolls to bottom
        if (isAtBottom && !autoScrollEnabledRef.current) {
          autoScrollEnabledRef.current = true;
          setAutoScrollEnabled(true);
        }
        
        lastScrollTop = scrollTop;
        
        // Clear previous timeout and set new one
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          // After scroll stops, check if we're at bottom
          if (scrollRef.current) {
            const { scrollTop: currentScrollTop, scrollHeight, clientHeight } = scrollRef.current;
            const currentIsAtBottom = scrollHeight - currentScrollTop - clientHeight < 50;
            if (currentIsAtBottom && !autoScrollEnabledRef.current) {
              autoScrollEnabledRef.current = true;
              setAutoScrollEnabled(true);
            }
          }
        }, 150);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      // Disable auto-scroll when user manually scrolls with mouse
      if (e.deltaY !== 0) {
        autoScrollEnabledRef.current = false;
        setAutoScrollEnabled(false);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Disable auto-scroll when user manually scrolls with trackpad/touch
      if (e.touches.length === 1) {
        autoScrollEnabledRef.current = false;
        setAutoScrollEnabled(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable auto-scroll when user manually scrolls with arrow keys, Page Up/Down, Home/End
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) {
        autoScrollEnabledRef.current = false;
        setAutoScrollEnabled(false);
      }
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      // Add event listeners to the scroll container
      scrollElement.addEventListener('scroll', handleScroll, { passive: true });
      scrollElement.addEventListener('wheel', handleWheel, { passive: false });
      scrollElement.addEventListener('touchmove', handleTouchMove, { passive: false });
      scrollElement.addEventListener('keydown', handleKeyDown);
      
      return () => {
        scrollElement.removeEventListener('scroll', handleScroll);
        scrollElement.removeEventListener('wheel', handleWheel);
        scrollElement.removeEventListener('touchmove', handleTouchMove);
        scrollElement.removeEventListener('keydown', handleKeyDown);
        clearTimeout(scrollTimeout);
      };
    }
  }, []);

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message.trim(),
      sender: 'user',
      timestamp: new Date()
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setMessage('');
    setIsLoading(true);
    
    // Create assistant message for streaming
    let assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      content: '',
      sender: 'assistant',
      timestamp: new Date()
    };
    
         setMessages([...updatedMessages, assistantMessage]);
     
     // Auto-scroll to show the new assistant message
     setTimeout(() => scrollToBottom('smooth'), 100);
     
          try {
       console.log('Sending message to:', buildApiUrl(API_ENDPOINTS.ASK));
       const response = await fetch(buildApiUrl(API_ENDPOINTS.ASK), {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({ prompt: userMessage.content }),
       });
       
       console.log('Response status:', response.status);
       if (!response.ok || !response.body) {
         throw new Error(`Failed to get response from assistant: ${response.status}`);
       }
       
       const reader = response.body.getReader();
       const decoder = new TextDecoder();
       let done = false;
       let fullText = '';
       
       while (!done) {
         const { value, done: doneReading } = await reader.read();
         done = doneReading;
         if (value) {
           const chunk = decoder.decode(value);
           fullText += chunk;
           assistantMessage = {
             ...assistantMessage,
             content: fullText
           };
           setMessages([...updatedMessages, assistantMessage]);
           
           // Auto-scroll during streaming to keep up with new content
           if (isNearBottom() && autoScrollEnabledRef.current) {
             scrollToBottom('auto');
           }
         }
       }
     } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: isOnline 
          ? "I'm sorry, but I'm having trouble connecting right now. Please try again later."
          : "I'm currently offline, but I'd love to help when you're back online!",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages([...updatedMessages, errorMessage]);
    }
    
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat?')) {
      setMessages([]);
    }
  };

  // Chat floating button when closed
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className="fixed bottom-6 right-6 rounded-full w-16 h-16 shadow-glow z-40 bg-gradient-primary hover:scale-110 transition-all duration-300"
      >
        <MessageCircle className="w-7 h-7" />
      </Button>
    );
  }

  return (
    <>
      <Card className={`floating-chat fixed transition-all duration-300 z-40 ${
        isMinimized 
          ? 'bottom-6 right-6 w-80 h-12 shadow-card' 
          : 'bottom-6 right-6 w-96 max-h-[70vh] shadow-glow'
      } animate-scale-in bg-gradient-card border-primary/20`}>
        
        {/* Header */}
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              <span className="text-primary font-bold">
                AI Assistant
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-6 w-6 p-0 hover:bg-primary/10"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsOpen(false)} 
                className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                title="Close"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        {/* Content - only show when not minimized */}
        {!isMinimized && (
          <CardContent className="pt-0 flex flex-col gap-4 flex-1 min-h-0">
            
            {/* Chat Messages */}
            <div 
              className="flex-1 min-h-0 max-h-64 overflow-y-auto scroll-smooth" 
              ref={scrollRef}
              style={{ scrollBehavior: 'smooth' }}
            >
              <div className="space-y-3 pb-4 px-2 relative">
                {/* Scroll to bottom button */}
                {showScrollButton && (
                  <Button
                    onClick={() => {
                      scrollToBottom('smooth');
                      autoScrollEnabledRef.current = true;
                      setAutoScrollEnabled(true);
                    }}
                    size="sm"
                    className="fixed bottom-20 right-8 z-10 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all duration-200 animate-bounce"
                    title="Scroll to bottom and resume auto-scroll"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                )}
                
                {/* Auto-scroll status indicator */}
                {!autoScrollEnabled && (
                  <div className="fixed bottom-20 right-20 z-10 bg-muted/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-muted-foreground border shadow-sm">
                    Auto-scroll paused
                  </div>
                )}
                {messages.length === 0 && (
                  <div className="text-center py-4 space-y-2">
                    <div className="text-2xl">🤖</div>
                    <p className="text-xs text-muted-foreground">
                      Ask me anything about programming!
                    </p>
                  </div>
                )}
                
                                 {messages.map((msg) => {
                   try {
                     return (
                       <div
                         key={msg.id}
                         className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                       >
                         {msg.sender === 'assistant' && (
                           <div className="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                             <Bot className="w-4 h-4 text-white" />
                           </div>
                         )}
                         
                         <div className={`max-w-[80%] ${msg.sender === 'user' ? 'order-2' : ''}`}>
                           <div
                             className={`p-3 rounded-lg text-sm ${
                               msg.sender === 'user'
                                 ? 'bg-gradient-primary text-primary-foreground ml-auto'
                                 : 'bg-muted'
                             }`}
                           >
                             {msg.sender === 'assistant' ? (
                               <div className="text-sm prose prose-sm max-w-none">
                                 <ReactMarkdown>{msg.content}</ReactMarkdown>
                               </div>
                             ) : (
                               <p className="whitespace-pre-wrap">{msg.content}</p>
                             )}
                           </div>
                         </div>
                         
                         {msg.sender === 'user' && (
                           <div className="w-6 h-6 bg-gradient-success rounded-full flex items-center justify-center flex-shrink-0 mt-1 order-3">
                             <User className="w-4 h-4 text-white" />
                           </div>
                         )}
                       </div>
                     );
                   } catch (error) {
                     console.error('Error rendering message:', error);
                     return (
                       <div key={msg.id} className="text-red-500 text-xs p-2">
                         Error rendering message
                       </div>
                     );
                   }
                 })}
                
                {isLoading && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Loader className="w-3 h-3 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Invisible element for auto-scroll target */}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a programming question..."
                  className="min-h-16 text-sm resize-none"
                  disabled={isLoading}
                />
                <Button 
                  onClick={sendMessage} 
                  size="sm"
                  className="self-end bg-gradient-primary hover:opacity-90 transition-opacity" 
                  disabled={!message.trim() || isLoading}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearChat}
                  className="h-6 px-2 text-xs text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear Chat
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </>
  );
}