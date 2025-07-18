import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SearchResult {
  id: string;
  title: string;
  type: 'flashcard' | 'challenge' | 'chat';
  content: string;
  match: string;
}

interface SearchBarProps {
  onResultSelect: (result: SearchResult) => void;
}

export function SearchBar({ onResultSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    
    if (searchQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    // Simulate fuzzy search through local data
    const mockResults: SearchResult[] = [
      {
        id: '1',
        title: 'Python Variables',
        type: 'flashcard' as const,
        content: 'Variables in Python are containers for storing data values',
        match: 'python variables'
      },
      {
        id: '2', 
        title: 'Two Sum Problem',
        type: 'challenge' as const,
        content: 'Given an array of integers, return indices of the two numbers...',
        match: 'array sum'
      },
      {
        id: '3',
        title: 'How to optimize code?',
        type: 'chat' as const,
        content: 'Previous AI conversation about code optimization techniques',
        match: 'optimization performance'
      }
    ].filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.match.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setResults(mockResults);
    setIsOpen(true);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'flashcard': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'challenge': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'chat': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search flashcards, challenges, chats..."
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 shadow-card z-50 max-h-80 overflow-y-auto">
          <CardContent className="p-2">
            <div className="space-y-1">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => {
                    onResultSelect(result);
                    setIsOpen(false);
                  }}
                  className="w-full text-left p-3 hover:bg-muted rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{result.title}</span>
                    <Badge className={getTypeColor(result.type)} variant="secondary">
                      {result.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {result.content}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}