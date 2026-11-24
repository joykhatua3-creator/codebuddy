import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .trim(),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  role: z.enum(['student', 'teacher']).optional().default('student'),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email')
    .toLowerCase()
    .trim(),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

const SUPPORTED_LANGUAGES = [
  'python', 'javascript', 'typescript', 'java', 'cpp', 'c', 'csharp',
  'go', 'rust', 'sql', 'kotlin', 'swift', 'dart', 'php', 'ruby',
  'r', 'scala', 'julia', 'mojo', 'zig', 'elixir', 'lua', 'perl',
  'matlab', 'assembly', 'bash', 'solidity', 'groovy', 'haskell', 'fsharp'
];

export const reviewSubmitSchema = z.object({
  language: z.enum(SUPPORTED_LANGUAGES, {
    required_error: 'Language is required',
    invalid_type_error: 'Language must be one of the 30 supported languages',
  }),
  code: z
    .string({ required_error: 'Code is required' })
    .min(5, 'Code must be at least 5 characters')
    .max(15000, 'Code cannot exceed 15,000 characters'),
});

export const quizSubmitSchema = z.object({
  answers: z
    .array(
      z.object({
        questionIndex: z.number().int().min(0),
        selectedOption: z.number().int().min(0).max(3).nullable(),
      })
    )
    .min(1, 'At least one answer is required'),
});

export const aiReviewResponseSchema = z.object({
  score: z.number().int().min(0).max(100),
  summary: z.string().min(10),
  bugs: z.array(
    z.object({
      title: z.string(),
      lineNumber: z.number().int().min(0),
      description: z.string(),
      whyItHappens: z.string(),
      hint: z.string(),
      solution: z.string(),
    })
  ),
  codeQuality: z.object({
    readability: z.object({ score: z.number().int().min(0).max(10), comment: z.string() }),
    namingConventions: z.object({ score: z.number().int().min(0).max(10), comment: z.string() }),
    codeStructure: z.object({ score: z.number().int().min(0).max(10), comment: z.string() }),
    bestPractices: z.object({ score: z.number().int().min(0).max(10), comment: z.string() }),
  }),
  complexity: z.object({
    time: z.string(),
    space: z.string(),
    explanation: z.string(),
  }),
  security: z.array(
    z.object({
      issue: z.string(),
      severity: z.enum(['low', 'medium', 'high']),
      recommendation: z.string(),
    })
  ),
  concepts: z.array(
    z.object({
      name: z.string(),
      level: z.enum(['weak', 'ok', 'strong']),
    })
  ),
});

export const aiQuizResponseSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string(),
        options: z.array(z.string()).length(4),
        correctAnswer: z.number().int().min(0).max(3),
        explanation: z.string(),
      })
    )
    .length(5),
});

export const aiRoadmapResponseSchema = z.object({
  steps: z
    .array(
      z.object({
        order: z.number().int().min(1),
        topic: z.string(),
        objective: z.string(),
        explanation: z.string(),
        learningTask: z.string(),
        practiceAssignment: z.string(),
      })
    )
    .min(1),
});
