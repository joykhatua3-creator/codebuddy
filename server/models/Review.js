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
      enum: ['javascript', 'python', 'java', 'cpp'],
    },
    code: {
      type: String,
      required: true,
      maxlength: [10000, 'Code cannot exceed 10,000 characters'],
    },
    codeHash: {
      type: String,
      required: true,
      index: true,
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
  },
  {
    timestamps: true,
  }
);

// Compound index for caching: user + codeHash
reviewSchema.index({ user: 1, codeHash: 1 });

module.exports = mongoose.model('Review', reviewSchema);
