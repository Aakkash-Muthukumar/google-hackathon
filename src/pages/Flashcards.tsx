import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Check, Clock, Filter, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { storage } from '@/lib/storage';
import { mockFlashCards } from '@/lib/mockData';
import { FlashCard, User } from '@/lib/types';

export default function Flashcards() {
  const [flashcards, setFlashcards] = useState<FlashCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [user, setUser] = useState<User>(storage.getUser());

  useEffect(() => {
    // Load flashcards from storage or use mock data
    let storedCards = storage.getFlashCards();
    if (storedCards.length === 0) {
      storedCards = mockFlashCards;
      storage.saveFlashCards(storedCards);
    }
    setFlashcards(storedCards);
  }, []);

  const filteredCards = flashcards.filter(card => {
    if (filter === 'all') return true;
    if (filter === 'unknown') return !card.known;
    if (filter === 'review') return card.reviewLater;
    if (filter === 'known') return card.known;
    return card.topic === filter || card.difficulty === filter;
  });

  const currentCard = filteredCards[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
  };

  const handleShuffle = () => {
    const shuffled = [...filteredCards].sort(() => Math.random() - 0.5);
    setFlashcards(prev => [
      ...shuffled,
      ...prev.filter(card => !filteredCards.includes(card))
    ]);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const markAsKnown = () => {
    if (!currentCard) return;
    
    const updatedCards = flashcards.map(card =>
      card.id === currentCard.id 
        ? { ...card, known: true, lastReviewed: new Date() }
        : card
    );
    
    setFlashcards(updatedCards);
    storage.saveFlashCards(updatedCards);
    
    // Award XP
    const newXP = user.xp + 10;
    const updatedUser = { ...user, xp: newXP };
    setUser(updatedUser);
    storage.saveUser(updatedUser);
    
    handleNext();
  };

  const markForReview = () => {
    if (!currentCard) return;
    
    const updatedCards = flashcards.map(card =>
      card.id === currentCard.id 
        ? { ...card, reviewLater: true, lastReviewed: new Date() }
        : card
    );
    
    setFlashcards(updatedCards);
    storage.saveFlashCards(updatedCards);
    handleNext();
  };

  if (!currentCard) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h1 className="text-3xl font-bold mb-4">No Flashcards Found</h1>
        <p className="text-muted-foreground mb-8">
          No flashcards match your current filter. Try changing the filter or add some new cards.
        </p>
        <Button onClick={() => setFilter('all')}>
          Show All Cards
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Flashcards</h1>
        <p className="text-lg text-muted-foreground">
          Master programming concepts one card at a time
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter cards" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cards</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
              <SelectItem value="review">Review Later</SelectItem>
              <SelectItem value="known">Known</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
              <SelectItem value="basics">Basics</SelectItem>
              <SelectItem value="control-flow">Control Flow</SelectItem>
              <SelectItem value="oop">OOP</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleShuffle}>
            <Shuffle className="w-4 h-4 mr-2" />
            Shuffle
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          {currentIndex + 1} of {filteredCards.length}
        </div>
      </div>

      {/* Flashcard */}
      <div className="relative perspective-1000 mx-auto max-w-2xl">
        <Card 
          className={`relative h-80 bg-gradient-card shadow-card hover:shadow-primary transition-all duration-300 cursor-pointer transform-style-preserve-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          onClick={handleFlip}
        >
          {/* Front of card */}
          <CardContent className={`absolute inset-0 p-8 flex flex-col items-center justify-center text-center backface-hidden ${
            isFlipped ? 'invisible' : 'visible'
          }`}>
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  currentCard.difficulty === 'easy' ? 'bg-success/20 text-success' :
                  currentCard.difficulty === 'medium' ? 'bg-warning/20 text-warning' :
                  'bg-destructive/20 text-destructive'
                }`}>
                  {currentCard.difficulty}
                </span>
                <span className="px-2 py-1 bg-muted rounded-full text-xs">
                  {currentCard.topic}
                </span>
              </div>
              
              <h2 className="text-3xl font-bold text-primary">
                {currentCard.term}
              </h2>
              
              <p className="text-muted-foreground">
                Click to see definition
              </p>
            </div>
          </CardContent>

          {/* Back of card */}
          <CardContent className={`absolute inset-0 p-8 flex flex-col items-center justify-center text-center rotate-y-180 backface-hidden ${
            isFlipped ? 'visible' : 'invisible'
          }`}>
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-primary mb-4">
                Definition
              </h3>
              <p className="text-lg leading-relaxed">
                {currentCard.definition}
              </p>
              <p className="text-sm text-muted-foreground">
                Click to flip back
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button 
          variant="outline" 
          onClick={handlePrev}
          disabled={filteredCards.length <= 1}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleNext}
          disabled={filteredCards.length <= 1}
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Action Buttons */}
      {isFlipped && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
          <Button 
            variant="success" 
            onClick={markAsKnown}
            className="w-full sm:w-auto"
          >
            <Check className="w-4 h-4 mr-2" />
            I Know This (+10 XP)
          </Button>
          
          <Button 
            variant="outline" 
            onClick={markForReview}
            className="w-full sm:w-auto"
          >
            <Clock className="w-4 h-4 mr-2" />
            Review Later
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => setIsFlipped(false)}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Flip Back
          </Button>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="bg-card p-6 rounded-lg shadow-card">
        <h3 className="font-semibold mb-4">Your Progress</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className="text-2xl font-bold text-success">
              {flashcards.filter(c => c.known).length}
            </div>
            <div className="text-sm text-muted-foreground">Known</div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-warning">
              {flashcards.filter(c => c.reviewLater).length}
            </div>
            <div className="text-sm text-muted-foreground">Review Later</div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-muted-foreground">
              {flashcards.filter(c => !c.known && !c.reviewLater).length}
            </div>
            <div className="text-sm text-muted-foreground">New</div>
          </div>
        </div>
      </div>
    </div>
  );
}