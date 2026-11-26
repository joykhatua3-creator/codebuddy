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
      space: String,
      explanation: String,
    },
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
    analysisVersion: {
      type: Number,
      default: 2,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for caching: user + codeHash
reviewSchema.index({ user: 1, codeHash: 1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ user: 1, language: 1, score: -1 });

module.exports = mongoose.model('Review', reviewSchema);
