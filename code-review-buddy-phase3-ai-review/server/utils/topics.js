// Fixed topic list. The AI must pick from these, so Phase 4 (weak-topic tracking)
// can count the same topic across many reviews.
const TOPICS = [
  'Loops',
  'Conditionals',
  'Functions',
  'Recursion',
  'Arrays & Lists',
  'Strings',
  'Objects & Dictionaries',
  'Pointers & Memory',
  'Error Handling',
  'Algorithms & Complexity',
  'Data Structures',
  'OOP',
  'Scope & Variables',
  'Syntax',
  'Input & Output',
  'Naming & Readability',
];

const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp', 'go'];

module.exports = { TOPICS, LANGUAGES };
