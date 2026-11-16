const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    topics: [{ type: String }],
    questions: [
      {
        question: { type: String, required: true },
        options: [{ type: String }], // exactly 4
        correctAnswer: { type: Number, min: 0, max: 3 }, // index 0-3
        explanation: { type: String },
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

module.exports = mongoose.model('Quiz', quizSchema);
