import mongoose from 'mongoose';

const roadmapSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    steps: [
      {
        order: { type: Number, required: true },
        topic: { type: String, required: true },
        objective: { type: String, required: true },
        explanation: { type: String },
        learningTask: { type: String },
        practiceAssignment: { type: String },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date, default: null },
      },
    ],
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    weakTopicsSnapshot: [{ type: String }],
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

roadmapSchema.pre('save', function (next) {
  if (this.steps && this.steps.length > 0) {
    const completed = this.steps.filter((s) => s.completed).length;
    this.completionPercentage = Math.round((completed / this.steps.length) * 100);
  } else {
    this.completionPercentage = 0;
  }
  next();
});

export default mongoose.models.Roadmap || mongoose.model('Roadmap', roadmapSchema);
