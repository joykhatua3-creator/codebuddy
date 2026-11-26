const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    topic: {
      type: String,
      default: 'Mixed / Overall Coding Quiz',
    },
    topics: [{ type: String }],
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    language: {
      type: String,
      default: 'general',
    },
    questions: [
      {
        id: { type: String },
        question: { type: String, required: true },
        codeSnippet: { type: String, default: '' },
        subTopic: { type: String, default: '' },
        options: [{ type: String }], // exactly 4
        correctAnswer: { type: Number, min: 0, max: 3 }, // index 0-3
        explanation: { type: String, default: '' },
      },
    ],
    answers: [
      {
        questionIndex: Number,
        selectedOption: Number, // index 0-3, null if not answered
      },
    ],
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    correctCount: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 5 },
    xpEarned: { type: Number, default: 0 },
    subTopicBreakdown: { type: mongoose.Schema.Types.Mixed, default: null },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

quizSchema.index({ user: 1, completed: 1, createdAt: -1 });

module.exports = mongoose.model('Quiz', quizSchema);
