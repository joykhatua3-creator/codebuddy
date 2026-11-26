const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    language: {
      type: String,
      required: true,
      enum: [
        'python', 'javascript', 'typescript', 'java', 'cpp', 'c', 'csharp',
        'go', 'rust', 'sql', 'kotlin', 'swift', 'dart', 'php', 'ruby',
        'r', 'scala', 'julia', 'mojo', 'zig', 'elixir', 'lua', 'perl',
        'matlab', 'assembly', 'bash', 'solidity', 'groovy', 'haskell', 'fsharp'
      ],
    },
    code: {
      type: String,
      required: true,
      maxlength: [15000, 'Code cannot exceed 15,000 characters'],
    },
    codeHash: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    notes: {
      type: String,
      maxlength: [2000, 'Notes cannot exceed 2,000 characters'],
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
    },
    summary: {
      type: String,
    },
    bugs: [
      {
        title: String,
        lineNumber: Number,
        description: String,
        whyItHappens: String,
        hint: String,
        solution: String,
      },
    ],
    codeQuality: {
      readability: { score: Number, comment: String },
      namingConventions: { score: Number, comment: String },
      codeStructure: { score: Number, comment: String },
      bestPractices: { score: Number, comment: String },
    },
    complexity: {
      time: String,
      timeReason: String,
      space: String,
      spaceReason: String,
      explanation: String,
    },
    analysisEngine: {
      type: String,
      enum: ['GEMINI_AI', 'STATIC_FALLBACK'],
      default: 'GEMINI_AI',
    },
    codeErrors: [
      {
        line: Number,
        severity: { type: String, enum: ['ERROR', 'WARNING'] },
        title: String,
        explanation: String,
        fix: String,
      },
    ],
    howItWorks: [String],
    callGraph: [
      {
        caller: String,
        callee: String,
        purpose: String,
      },
    ],
    functionBreakdown: [
      {
        name: String,
        parameters: String,
        returns: String,
        explanation: String,
      },
    ],
    security: [
      {
        issue: String,
        severity: { type: String, enum: ['low', 'medium', 'high'] },
        recommendation: String,
      },
    ],
    concepts: [
      {
        name: String,
        level: { type: String, enum: ['weak', 'ok', 'strong'] },
      },
    ],
    isBookmarked: {
      type: Boolean,
      default: false,
    },
    fromCache: {
      type: Boolean,
      default: false,
    },
    isFallback: {
      type: Boolean,
      default: false,
    },
    fallbackReason: {
      type: String,
      default: '',
    },
    analysisVersion: {
      type: Number,
      default: 2,
    },
    improvedCode: {
      type: String,
      default: '',
    },
    improvementNotes: [
      {
        lineNumber: Number,
        explanation: String,
      },
    ],
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      default: null,
      index: true,
    },
    teacherFeedback: {
      comment: { type: String, maxlength: 2000 },
      adjustedScore: { type: Number, min: 0, max: 100 },
      originalScore: { type: Number, min: 0, max: 100 },
      teacherName: String,
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      updatedAt: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        if (!Array.isArray(ret.errors) && Array.isArray(ret.codeErrors)) {
          ret.errors = ret.codeErrors;
        }
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret) => {
        if (!Array.isArray(ret.errors) && Array.isArray(ret.codeErrors)) {
          ret.errors = ret.codeErrors;
        }
        return ret;
      },
    },
  }
);

// Compound index for caching: user + codeHash
reviewSchema.index({ user: 1, codeHash: 1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ user: 1, language: 1, score: -1 });
reviewSchema.index({ user: 1, assignment: 1, createdAt: -1 });
reviewSchema.index({ assignment: 1, user: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
