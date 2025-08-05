import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, User, MessageCircle, Loader, AlertCircle, Menu, Pencil, Plus, Trash2, ChevronLeft, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { storage } from '@/lib/storage';
import { ChatMessage as ChatMessageType, ChatSession } from '@/lib/types';
import { buildApiUrl, API_ENDPOINTS, API_CONFIG } from '@/lib/config';
import ReactMarkdown from 'react-markdown';

export default function Tutor() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [showChatsSidebar, setShowChatsSidebar] = useState(false);
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('chatSidebarCollapsed');
    return saved === 'true';
  });
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const autoScrollEnabledRef = useRef(true);


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
      // Always scroll to bottom for new messages, but use smooth animation
      scrollToBottom('smooth');
    }
  }, [messages, scrollToBottom]);

  // Auto-scroll during streaming responses
  useEffect(() => {
    if (isLoading && autoScrollEnabledRef.current) {
      // Use instant scroll during loading to keep up with streaming
      scrollToBottom('auto');
    }
  }, [isLoading, scrollToBottom]);

  // Handle scroll events to show/hide scroll button and manage auto-scroll
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
        setShowScrollButton(!isAtBottom);
        
        // Re-enable auto-scroll when user scrolls to bottom
        if (isAtBottom && !autoScrollEnabledRef.current) {
          autoScrollEnabledRef.current = true;
          setAutoScrollEnabled(true);
        }
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
      scrollElement.addEventListener('scroll', handleScroll);
      scrollElement.addEventListener('wheel', handleWheel, { passive: true });
      scrollElement.addEventListener('touchmove', handleTouchMove, { passive: true });
      scrollElement.addEventListener('keydown', handleKeyDown);
      
      return () => {
        scrollElement.removeEventListener('scroll', handleScroll);
        scrollElement.removeEventListener('wheel', handleWheel);
        scrollElement.removeEventListener('touchmove', handleTouchMove);
        scrollElement.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, []);

  // Helper to create a new chat session
  const createNewChatSession = () => {
    const id = Date.now().toString();
    const newSession: ChatSession = {
      id,
      name: 'Untitled Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updatedChats = [newSession, ...chats];
    storage.saveChatsSync(updatedChats);
    storage.setCurrentChatId(id);
    setChats(updatedChats);
    setCurrentChatId(id);
    setMessages([]);
    return newSession;
  };

  // Helper function to send message with content (defined before useEffect)
  const sendMessageWithContent = async (content: string) => {
    if (!content.trim() || isLoading || !currentChatId) return;
    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      content: content,
      sender: 'user',
      timestamp: new Date()
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    const tutorMessageId = (Date.now() + 1).toString();
    let tutorMessage: ChatMessageType = {
      id: tutorMessageId,
      content: '',
      sender: 'tutor',
      timestamp: new Date()
    };
    setMessages([...updatedMessages, tutorMessage]);
    
    // Auto-scroll to show the new tutor message
    setTimeout(() => scrollToBottom('smooth'), 100);
    
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.ASK), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: content }),
      });
      if (!response.ok || !response.body) {
        throw new Error('Failed to get response from tutor');
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
          tutorMessage = {
            ...tutorMessage,
            content: fullText
          };
          setMessages([...updatedMessages, { ...tutorMessage }]);
          
          // Auto-scroll during streaming to keep up with new content
          if (isNearBottom() && autoScrollEnabledRef.current) {
            scrollToBottom('auto');
          }
        }
      }
      // Save to current chat session
      const chats = storage.getChatsSync();
      const idx = chats.findIndex(c => c.id === currentChatId);
      if (idx !== -1) {
        chats[idx] = {
          ...chats[idx],
          messages: [...updatedMessages, { ...tutorMessage }],
          updatedAt: new Date(),
        };
        storage.saveChatsSync(chats);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const fallbackMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        content: isOnline 
          ? `I'm sorry, but I'm having trouble connecting to the tutoring service right now. Please make sure the local server is running on ${API_CONFIG.BASE_URL}. In the meantime, try reviewing your flashcards or working on coding challenges!`
          : "I'm currently offline, but I'd love to help when you're back online! In the meantime, you can practice with flashcards and coding challenges that work offline.",
        sender: 'tutor',
        timestamp: new Date()
      };
      const finalMessages = [...updatedMessages, fallbackMessage];
      setMessages(finalMessages);
      // Save to current chat session
      const chats = storage.getChatsSync();
      const idx = chats.findIndex(c => c.id === currentChatId);
      if (idx !== -1) {
        chats[idx] = {
          ...chats[idx],
          messages: finalMessages,
          updatedAt: new Date(),
        };
        storage.saveChatsSync(chats);
      }
    }
    setIsLoading(false);
  };

  // Load or create chat session on mount
  useEffect(() => {
    const loadChats = async () => {
      try {
        // Check for URL parameters first
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');
        
        let loadedChats = await storage.getChats();
        let currentChatId = storage.getCurrentChatId();
        let session: ChatSession | undefined;
        
        if (currentChatId) {
          session = loadedChats.find(c => c.id === currentChatId);
        }
        if (!session) {
          session = createNewChatSession();
          loadedChats = await storage.getChats();
          currentChatId = session.id;
        }
        
        setCurrentChatId(currentChatId);
        setMessages(session.messages);
        setChats(loadedChats);
        
        // If there's a query parameter, pre-fill the input and clear the URL
        if (query) {
          setInputMessage(query);
          // Clear the URL parameters to prevent issues on subsequent uses
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (error) {
        console.error('Failed to load chats:', error);
        // Fallback to creating a new session
        const session = createNewChatSession();
        setCurrentChatId(session.id);
        setMessages([]);
        setChats([session]);
      }
    };

    loadChats();
  }, []);



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

  // Auto-expand sidebar when returning to tutor page
  useEffect(() => {
    const handlePageFocus = () => {
      setSidebarCollapsed(false);
      localStorage.setItem('chatSidebarCollapsed', 'false');
    };
    
    window.addEventListener('focus', handlePageFocus);
    return () => window.removeEventListener('focus', handlePageFocus);
  }, []);

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('chatSidebarCollapsed', sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  // Select a chat session
  const selectChat = (id: string) => {
    const session = chats.find(c => c.id === id);
    if (session) {
      setCurrentChatId(id);
      setMessages(session.messages);
      storage.setCurrentChatId(id);
    }
    setShowChatsSidebar(false);
  };

  // Start renaming a chat
  const startRenaming = (id: string, currentName: string) => {
    setRenamingChatId(id);
    setRenameValue(currentName);
  };

  // Save chat name
  const saveRename = (id: string) => {
    const updatedChats = chats.map(chat =>
      chat.id === id ? { ...chat, name: renameValue, updatedAt: new Date() } : chat
    );
    setChats(updatedChats);
    storage.saveChatsSync(updatedChats);
    setRenamingChatId(null);
    setRenameValue('');
  };

  // Toggle chat collapse state


  // Delete a chat with confirmation
  const confirmDeleteChat = (chatId: string) => {
    const updatedChats = chats.filter(chat => chat.id !== chatId);
    setChats(updatedChats);
    storage.saveChatsSync(updatedChats);
    
    // If the deleted chat was current, switch to next or create new
    if (currentChatId === chatId) {
      if (updatedChats.length > 0) {
        const nextChat = updatedChats[0];
        setCurrentChatId(nextChat.id);
        setMessages(nextChat.messages);
        storage.setCurrentChatId(nextChat.id);
      } else {
        const newSession = createNewChatSession();
        setCurrentChatId(newSession.id);
        setMessages([]);
        storage.setCurrentChatId(newSession.id);
      }
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !currentChatId) return;
    await sendMessageWithContent(inputMessage);
    setInputMessage('');
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
    <div className="w-full h-screen flex animate-fade-in overflow-hidden">
      {/* Sidebar with smooth transition */}
      <div
        className={`transition-all duration-300 bg-gradient-card shadow-glow border-r flex flex-col h-full ${sidebarCollapsed ? 'w-12' : 'w-80'}`}
      >
        {/* Toggle Button - always visible at top */}
        <div className="flex justify-center p-2 border-b border-border flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-background/90 backdrop-blur-sm border hover:bg-primary/10 shadow-md transition-all duration-200 hover:scale-110"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
          >
            {sidebarCollapsed ? (
              <Menu className="w-5 h-5 text-primary" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-primary" />
            )}
          </Button>
        </div>
        {/* Sidebar content only when expanded */}
        {!sidebarCollapsed && (
          <>
            <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
              <span className="font-bold text-lg text-foreground">Chats</span>
              <div className="flex items-center gap-2">
                <Button className="gap-2 shadow-card hover:shadow-glow transition-all" variant="outline" onClick={createNewChatSession}>
                  <Plus className="w-4 h-4" /> New Chat
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {chats.length === 0 && (
                <div className="p-6 text-center text-muted-foreground space-y-3">
                  <MessageCircle className="w-8 h-8 mx-auto opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-xs">Start your first chat to begin learning!</p>
                </div>
              )}
              {chats.map(chat => (
                <div
                  key={chat.id}
                  className={`group transition-all duration-300 hover:shadow-card rounded-lg m-2 ${
                    chat.id === currentChatId
                      ? 'bg-gradient-primary/10 border-l-4 border-primary shadow-inner animate-scale-in'
                      : 'hover:bg-accent/30'
                  }`}
                >
                  <div
                    className="flex items-center px-4 py-3 cursor-pointer"
                    onClick={() => selectChat(chat.id)}
                  >
                    <div className="flex-1 min-w-0">
                      {renamingChatId === chat.id ? (
                        <form onSubmit={e => { e.preventDefault(); saveRename(chat.id); }}>
                          <input
                            className="w-full bg-transparent border-b border-primary focus:outline-none text-foreground"
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            autoFocus
                            onBlur={() => saveRename(chat.id)}
                          />
                        </form>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`font-medium truncate flex-1 ${
                            chat.id === currentChatId ? 'text-primary font-semibold' : 'text-foreground'
                          }`}>
                            {chat.name}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0 hover:bg-primary/10 hover:scale-110 transition-all duration-200"
                              onClick={e => { e.stopPropagation(); startRenaming(chat.id, chat.name); }}
                              title="Rename conversation"
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 p-0 hover:bg-destructive/10 hover:scale-110 transition-all duration-200"
                                  onClick={e => { e.stopPropagation(); }}
                                  title="Delete conversation"
                                >
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. Are you sure you want to delete this chat?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => confirmDeleteChat(chat.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

             {/* Chat Area - Independent scrolling */}
       <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                 {/* Header */}
         <div className="text-center space-y-4 mb-6 relative flex-shrink-0 p-4">
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
         <Card className="flex-1 flex flex-col bg-gradient-card shadow-glow hover:shadow-primary transition-all duration-300 overflow-hidden mx-4 mb-4">
          <CardHeader className="pb-4 flex-shrink-0">
            <CardTitle className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-primary" />
              Chat with your AI Tutor
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Messages */}
            <ScrollArea className="flex-1 px-6 overflow-y-auto" ref={scrollRef}>
              <div className="space-y-4 pb-4 relative">
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
                    
                    <div className={`max-w-[80%] break-words ${message.sender === 'user' ? 'order-2' : ''}`}>
                      <div
                        className={`p-4 rounded-2xl ${
                          message.sender === 'user'
                            ? 'bg-gradient-primary text-primary-foreground ml-auto'
                            : 'bg-muted'
                        }`}
                        >
                         <div className="whitespace-pre-wrap leading-relaxed break-words overflow-wrap-anywhere">{message.sender === 'tutor' ? <ReactMarkdown>{message.content}</ReactMarkdown> : message.content}</div>
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
                
                {/* Invisible element for auto-scroll target */}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            {/* Input Area */}
            <div className="border-t p-6 flex-shrink-0">
              <div className="flex gap-3 min-w-0">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask your programming question here... (Press Enter to send)"
                  className="flex-1 min-h-[60px] max-h-32 resize-none min-w-0"
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
    </div>
  );
}