const mongoose = require('mongoose');

const bugSchema = new mongoose.Schema(
  {
    line: { type: Number, default: 0 }, // 0 = not tied to one line
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    title: String,
    hint: String, // shown first: nudges the student without giving the answer
    explanation: String, // shown on request: what is wrong and why
    fix: String, // shown last: guided solution
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    language: { type: String, required: true },
    code: { type: String, required: true },
    codeHash: { type: String, required: true },
    result: {
      summary: String,
      score: Number, // 0-100
      complexity: String,
      positives: [String],
      bugs: [bugSchema],
      suggestions: [String],
      weakTopics: [String],
    },
    fromCache: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ codeHash: 1, language: 1 });

module.exports = mongoose.model('Review', reviewSchema);
