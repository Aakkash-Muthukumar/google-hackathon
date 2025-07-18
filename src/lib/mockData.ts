import { FlashCard, Challenge } from './types';

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

export const mockChallenges: Challenge[] = [
  {
    id: '1',
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    difficulty: 'easy',
    language: 'python',
    topic: 'arrays',
    xpReward: 50,
    completed: false,
    template: `def two_sum(nums, target):
    # Write your solution here
    pass

# Test your solution
nums = [2, 7, 11, 15]
target = 9
print(two_sum(nums, target))`,
    testCases: [
      { input: '[2, 7, 11, 15], 9', expectedOutput: '[0, 1]' },
      { input: '[3, 2, 4], 6', expectedOutput: '[1, 2]' },
      { input: '[3, 3], 6', expectedOutput: '[0, 1]' }
    ],
    hints: [
      'Think about using a hash map to store numbers you\'ve seen.',
      'For each number, check if target - number exists in your hash map.',
      'Return the indices when you find a match.'
    ],
    solution: `def two_sum(nums, target):
    num_map = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in num_map:
            return [num_map[complement], i]
        num_map[num] = i
    return []`
  },
  {
    id: '2',
    title: 'Palindrome Check',
    description: 'Write a function to check if a given string is a palindrome (reads the same forwards and backwards).',
    difficulty: 'easy',
    language: 'python',
    topic: 'strings',
    xpReward: 40,
    completed: false,
    template: `def is_palindrome(s):
    # Write your solution here
    pass

# Test your solution
test_string = "racecar"
print(is_palindrome(test_string))`,
    testCases: [
      { input: '"racecar"', expectedOutput: 'True' },
      { input: '"hello"', expectedOutput: 'False' },
      { input: '"A man a plan a canal Panama"', expectedOutput: 'True' }
    ],
    hints: [
      'Consider removing spaces and converting to lowercase.',
      'Compare the string with its reverse.',
      'You can use slicing with [::-1] to reverse a string.'
    ],
    solution: `def is_palindrome(s):
    clean = ''.join(char.lower() for char in s if char.isalnum())
    return clean == clean[::-1]`
  },
  {
    id: '3',
    title: 'FizzBuzz',
    description: 'Print numbers 1 to 100, but replace multiples of 3 with "Fizz", multiples of 5 with "Buzz", and multiples of both with "FizzBuzz".',
    difficulty: 'easy',
    language: 'python',
    topic: 'basics',
    xpReward: 30,
    completed: false,
    template: `def fizz_buzz():
    # Write your solution here
    pass

fizz_buzz()`,
    testCases: [
      { input: 'n=15', expectedOutput: '1, 2, Fizz, 4, Buzz, Fizz, 7, 8, Fizz, Buzz, 11, Fizz, 13, 14, FizzBuzz' }
    ],
    hints: [
      'Use the modulo operator (%) to check divisibility.',
      'Check for multiples of both 3 and 5 first.',
      'Use elif statements for the other conditions.'
    ],
    solution: `def fizz_buzz():
    for i in range(1, 101):
        if i % 15 == 0:
            print("FizzBuzz")
        elif i % 3 == 0:
            print("Fizz")
        elif i % 5 == 0:
            print("Buzz")
        else:
            print(i)`
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