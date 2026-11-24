import mongoose from 'mongoose';

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
        options: [{ type: String }],
        correctAnswer: { type: Number, min: 0, max: 3 },
        explanation: { type: String },
      },
    ],
    answers: [
      {
        questionIndex: Number,
        selectedOption: Number,
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

export default mongoose.models.Quiz || mongoose.model('Quiz', quizSchema);
