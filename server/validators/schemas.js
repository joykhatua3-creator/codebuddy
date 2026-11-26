const { z } = require('zod');

// ─── Auth Validators ─────────────────────────────────────────────────────────

const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(6, 'Password must be at least 6 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email')
    .toLowerCase()
    .trim(),
  password: passwordSchema,
  role: z.enum(['student', 'teacher']).optional().default('student'),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email')
    .toLowerCase()
    .trim(),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

const demoLoginSchema = z.object({
  role: z.enum(['student', 'teacher']).optional().default('student'),
});

const updateProfileSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters'),
});

const updatePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: 'Current password is required' })
    .min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

// ─── Review Validators ───────────────────────────────────────────────────────

const SUPPORTED_LANGUAGES = [
  'python', 'javascript', 'typescript', 'java', 'cpp', 'c', 'csharp',
  'go', 'rust', 'sql', 'kotlin', 'swift', 'dart', 'php', 'ruby',
  'r', 'scala', 'julia', 'mojo', 'zig', 'elixir', 'lua', 'perl',
  'matlab', 'assembly', 'bash', 'solidity', 'groovy', 'haskell', 'fsharp'
];

const reviewSubmitSchema = z.object({
  language: z.enum(SUPPORTED_LANGUAGES, {
    required_error: 'Language is required',
    invalid_type_error: 'Language must be one of the 30 supported languages',
  }),
  code: z
    .string({ required_error: 'Code is required' })
    .max(15000, 'Code cannot exceed 15,000 characters')
    .refine((val) => val.trim().length >= 5, 'Code must be at least 5 non-whitespace characters'),
  assignmentId: z.string().trim().optional().nullable(),
});

const createAssignmentSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(120, 'Title cannot exceed 120 characters'),
  language: z.enum(SUPPORTED_LANGUAGES, {
    required_error: 'Language is required',
  }),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(4000, 'Description cannot exceed 4,000 characters'),
  starterCode: z.string().max(15000).optional().default(''),
  dueDate: z.string({ required_error: 'Due date is required' }).min(1, 'Due date is required'),
});

const teacherFeedbackSchema = z.object({
  comment: z
    .string({ required_error: 'Feedback comment is required' })
    .trim()
    .min(1, 'Feedback comment cannot be empty')
    .max(2000, 'Feedback cannot exceed 2,000 characters'),
  adjustedScore: z.coerce.number().int().min(0).max(100).optional(),
});

const updateReviewSchema = z.object({
  title: z.string().trim().max(120, 'Title cannot exceed 120 characters').optional(),
  notes: z.string().max(2000, 'Notes cannot exceed 2,000 characters').optional(),
  isBookmarked: z.boolean().optional(),
});

const updateRoadmapStepSchema = z.object({
  completed: z.boolean().optional(),
});

// ─── Quiz Validators ─────────────────────────────────────────────────────────

const quizSubmitSchema = z.object({
  answers: z
    .array(
      z.object({
        questionIndex: z.number().int().min(0),
        selectedOption: z.number().int().min(0).max(3).nullable(),
      })
    )
    .min(1, 'At least one answer is required'),
});

// ─── AI Response Validators ──────────────────────────────────────────────────

const clampInt = (val, min, max, fallback) => {
  if (val === undefined || val === null || val === '') return fallback;
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, Math.round(num)));
};

const normalizeSeverity = (val) => {
  const s = String(val || 'low').trim().toLowerCase();
  if (/(high|critical|severe)/.test(s)) return 'high';
  if (/(med|moderate|warn)/.test(s)) return 'medium';
  return 'low';
};

const normalizeConceptLevel = (val) => {
  const s = String(val || 'ok').trim().toLowerCase();
  if (/(weak|low|poor|begin|needs)/.test(s)) return 'weak';
  if (/(strong|high|good|master|proficien)/.test(s)) return 'strong';
  return 'ok';
};

const normalizeQualityMetric = (metric, defaultScore = 7) => {
  if (metric && typeof metric === 'object') {
    return {
      score: clampInt(metric.score, 0, 10, defaultScore),
      comment: typeof metric.comment === 'string' && metric.comment.trim() ? metric.comment.trim() : 'Reviewed.',
    };
  }
  return {
    score: clampInt(metric, 0, 10, defaultScore),
    comment: 'Reviewed.',
  };
};

const normalizeAiReviewPayload = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;

  // Require at least one genuine AI review signal so unrelated JSON never passes silently
  if (raw.score === undefined && raw.summary === undefined && !Array.isArray(raw.bugs) && !raw.complexity) {
    return raw;
  }

  const score = clampInt(raw.score, 0, 100, undefined);
  const summary =
    typeof raw.summary === 'string' && raw.summary.trim().length > 0
      ? raw.summary.trim()
      : 'Code analysis completed.';

  const rawBugs = Array.isArray(raw.bugs) ? raw.bugs : [];
  const bugs = rawBugs
    .filter((b) => b && typeof b === 'object')
    .map((b) => {
      const title = String(b.title || b.bug || b.name || 'Code Issue').trim();
      const description = String(b.description || b.message || b.details || title).trim();
      const whyItHappens = String(b.whyItHappens || b.reason || b.explanation || description).trim();
      const hint = String(b.hint || b.suggestion || 'Review this logic and its boundary conditions.').trim();
      const solution = String(b.solution || b.fix || '// Fix this issue as described in the hint above').trim();
      return {
        title,
        lineNumber: clampInt(b.lineNumber ?? b.line, 0, 100000, 0),
        description,
        whyItHappens,
        hint,
        solution,
      };
    });

  const qualitySrc =
    (raw.codeQuality && typeof raw.codeQuality === 'object' ? raw.codeQuality : null) ||
    (raw.qualityBreakdown && typeof raw.qualityBreakdown === 'object' ? raw.qualityBreakdown : null) ||
    {};
  const defaultQual = score !== undefined ? Math.max(1, Math.min(10, Math.round(score / 10))) : 7;
  const codeQuality = {
    readability: normalizeQualityMetric(qualitySrc.readability, defaultQual),
    namingConventions: normalizeQualityMetric(qualitySrc.namingConventions, defaultQual),
    codeStructure: normalizeQualityMetric(qualitySrc.codeStructure, defaultQual),
    bestPractices: normalizeQualityMetric(qualitySrc.bestPractices, defaultQual),
  };

  const compSrc = raw.complexity && typeof raw.complexity === 'object' ? raw.complexity : {};
  const complexity = {
    time: String(compSrc.time || compSrc.timeComplexity || raw.timeComplexity || 'O(1)').trim(),
    space: String(compSrc.space || compSrc.spaceComplexity || raw.spaceComplexity || 'O(1)').trim(),
    explanation: String(
      compSrc.explanation || raw.complexityExplanation || 'Time and space complexity estimated from algorithm structure.'
    ).trim(),
  };

  const security = (Array.isArray(raw.security) ? raw.security : [])
    .filter((s) => s && typeof s === 'object')
    .map((s) => ({
      issue: String(s.issue || s.title || s.name || 'Security Consideration').trim(),
      severity: normalizeSeverity(s.severity),
      recommendation: String(s.recommendation || s.description || s.fix || 'Follow secure coding practices.').trim(),
    }));

  const concepts = (Array.isArray(raw.concepts) ? raw.concepts : [])
    .filter((c) => c && (typeof c === 'object' || typeof c === 'string'))
    .map((c) =>
      typeof c === 'string'
        ? { name: c.trim() || 'General Programming', level: 'ok' }
        : {
            name: String(c.name || c.topic || c.concept || 'General Programming').trim(),
            level: normalizeConceptLevel(c.level ?? c.status),
          }
    );

  const improvedCode =
    typeof raw.improvedCode === 'string'
      ? raw.improvedCode
      : typeof raw.refactoredCode === 'string'
        ? raw.refactoredCode
        : '';

  const notesSrc = Array.isArray(raw.improvementNotes)
    ? raw.improvementNotes
    : Array.isArray(raw.suggestions)
      ? raw.suggestions
      : [];
  const improvementNotes = notesSrc
    .map((n) => {
      if (typeof n === 'string' && n.trim()) {
        return { lineNumber: 0, explanation: n.trim() };
      }
      if (n && typeof n === 'object') {
        const exp = String(n.explanation || n.suggestion || n.text || n.message || '').trim();
        if (!exp) return null;
        return {
          lineNumber: clampInt(n.lineNumber ?? n.line, 0, 100000, 0),
          explanation: exp,
        };
      }
      return null;
    })
    .filter(Boolean);

  return {
    score,
    summary,
    bugs,
    codeQuality,
    complexity,
    security,
    concepts,
    improvedCode,
    improvementNotes,
  };
};

const aiReviewResponseSchema = z.preprocess(
  normalizeAiReviewPayload,
  z.object({
    score: z.number().int().min(0).max(100),
    summary: z.string().min(3),
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
    improvedCode: z.string().optional().default(''),
    improvementNotes: z
      .array(
        z.object({
          lineNumber: z.coerce.number().int().min(0),
          explanation: z.string(),
        })
      )
      .optional()
      .default([]),
  })
);

const aiQuizResponseSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string(),
        options: z.array(z.string()).min(2).max(4),
        correctAnswer: z.coerce.number().int().min(0).max(3),
        explanation: z.string().optional().default(''),
      })
    )
    .min(1),
});

const aiRoadmapResponseSchema = z.object({
  steps: z
    .array(
      z.object({
        order: z.number().int().min(1),
        topic: z.string(),
        title: z.string().optional().default(''),
        level: z.string().optional().default('Intermediate'),
        estimatedHours: z.coerce.number().optional().default(2),
        objective: z.string().optional().default('Master this topic'),
        explanation: z.string().optional().default(''),
        keyConcepts: z.array(z.string()).optional().default([]),
        learningTask: z.string().optional().default(''),
        practiceAssignment: z.string().optional().default(''),
        starterCode: z.string().optional().default(''),
      })
    )
    .min(1),
});

/**
 * Validate request body against a Zod schema.
 * Returns { data, error } pattern.
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.errors.map((e) => e.message).join(', ');
    return res.status(400).json({ success: false, message });
  }
  req.validatedData = result.data;
  next();
};

module.exports = {
  SUPPORTED_LANGUAGES,
  registerSchema,
  loginSchema,
  demoLoginSchema,
  updateProfileSchema,
  updatePasswordSchema,
  reviewSubmitSchema,
  updateReviewSchema,
  updateRoadmapStepSchema,
  createAssignmentSchema,
  teacherFeedbackSchema,
  quizSubmitSchema,
  aiReviewResponseSchema,
  aiQuizResponseSchema,
  aiRoadmapResponseSchema,
  validate,
};
