const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one active roadmap per student
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
        learningTask: { type: String, default: '' },
        practiceAssignment: { type: String, default: '' },
        starterCode: { type: String, default: '' },
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
    weakTopicsSnapshot: [{ type: String }], // topics used to generate this roadmap
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-compute completion percentage before save
roadmapSchema.pre('save', function (next) {
  if (this.steps && this.steps.length > 0) {
    const completed = this.steps.filter((s) => s.completed).length;
    this.completionPercentage = Math.round((completed / this.steps.length) * 100);
  } else {
    this.completionPercentage = 0;
  }
  next();
});

module.exports = mongoose.model('Roadmap', roadmapSchema);
