import { FlashCard } from './types';

export const mockFlashCards: FlashCard[] = [
  {
    id: '1',
    term: 'Variable',
    definition: 'A storage location with an associated name that contains data which can be modified during program execution.',
    language: 'python',
    topic: 'basics',
    difficulty: 'easy',
    known: false,
    reviewLater: false
  },
  {
    id: '2',
    term: 'Function',
    definition: 'A reusable block of code that performs a specific task and can accept inputs (parameters) and return outputs.',
    language: 'python',
    topic: 'basics',
    difficulty: 'easy',
    known: false,
    reviewLater: false
  },
  {
    id: '3',
    term: 'Loop',
    definition: 'A programming construct that repeats a block of code until a certain condition is met.',
    language: 'python',
    topic: 'control-flow',
    difficulty: 'medium',
    known: false,
    reviewLater: false
  },
  {
    id: '4',
    term: 'List Comprehension',
    definition: 'A concise way to create lists in Python using a single line of code with optional conditions.',
    language: 'python',
    topic: 'advanced',
    difficulty: 'hard',
    known: false,
    reviewLater: false
  },
  {
    id: '5',
    term: 'Class',
    definition: 'A blueprint for creating objects (instances) that encapsulates data and methods that operate on that data.',
    language: 'python',
    topic: 'oop',
    difficulty: 'medium',
    known: false,
    reviewLater: false
  }
];

export const motivationalQuotes = [
  "Code is like humor. When you have to explain it, it's bad. – Cory House",
  "The best error message is the one that never shows up. – Thomas Fuchs",
  "Programming isn't about what you know; it's about what you can figure out. – Chris Pine",
  "Experience is the name everyone gives to their mistakes. – Oscar Wilde",
  "The only way to learn a new programming language is by writing programs in it. – Dennis Ritchie",
  "Code never lies, comments sometimes do. – Ron Jeffries",
  "Simplicity is the ultimate sophistication. – Leonardo da Vinci",
  "First, solve the problem. Then, write the code. – John Johnson"
];