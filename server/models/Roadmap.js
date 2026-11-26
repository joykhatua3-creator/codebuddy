const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    skillName: {
      type: String,
      trim: true,
      default: 'JavaScript Fundamentals',
    },
    skillSlug: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'javascript-fundamentals',
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    language: {
      type: String,
      trim: true,
      default: 'javascript',
    },
    totalHours: {
      type: Number,
      default: 0,
    },
    steps: [
      {
        order: { type: Number, required: true },
        title: { type: String, default: '' },
        topic: { type: String, required: true },
        level: { type: String, default: 'Beginner' },
        estimatedHours: { type: Number, default: 2 },
        objective: { type: String, required: true },
        explanation: { type: String, default: '' },
        keyConcepts: [{ type: String }],
        subTasks: [
          {
            title: { type: String, required: true },
            completed: { type: Boolean, default: false },
          },
        ],
        learningTask: { type: String, default: '' },
        practiceAssignment: { type: String, default: '' },
        starterCode: { type: String, default: '' },
        language: { type: String, default: '' },
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

roadmapSchema.index({ user: 1, updatedAt: -1 });
roadmapSchema.index({ user: 1, skillSlug: 1, level: 1 });

// Auto-compute totalHours & completionPercentage before save
roadmapSchema.pre('save', function (next) {
  if (this.steps && this.steps.length > 0) {
    this.totalHours = this.steps.reduce((sum, s) => sum + (Number(s.estimatedHours) || 2), 0);
    const totalFraction = this.steps.reduce((acc, s) => {
      if (s.completed) return acc + 1;
      if (Array.isArray(s.subTasks) && s.subTasks.length > 0) {
        const doneCount = s.subTasks.filter((t) => t.completed).length;
        return acc + doneCount / s.subTasks.length;
      }
      return acc;
    }, 0);
    this.completionPercentage = Math.round((totalFraction / this.steps.length) * 100);
  } else {
    this.totalHours = 0;
    this.completionPercentage = 0;
  }
  next();
});

module.exports = mongoose.model('Roadmap', roadmapSchema);
