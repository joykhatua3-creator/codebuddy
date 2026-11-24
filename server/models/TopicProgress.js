const mongoose = require('mongoose');

const topicProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    topic: {
      type: String,
      required: true,
      enum: [
        'Variables and Data Types',
        'Loops',
        'Functions',
        'Recursion',
        'Arrays',
        'Objects',
        'OOP',
        'Inheritance',
        'Polymorphism',
        'Exception Handling',
        'File Handling',
        'Async/Await',
        'Promises',
        'API Handling',
        'Data Structures',
        'Algorithms',
      ],
    },
    weakCount: { type: Number, default: 0 },
    okCount: { type: Number, default: 0 },
    strongCount: { type: Number, default: 0 },
    // Level = round(100 * (okCount * 0.5 + strongCount) / total)
    level: { type: Number, default: 0, min: 0, max: 100 },
    lastSeen: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Compound index: one record per user per topic
topicProgressSchema.index({ user: 1, topic: 1 }, { unique: true });
topicProgressSchema.index({ user: 1, level: 1 });

// Auto-calculate level before save
topicProgressSchema.pre('save', function (next) {
  const total = this.weakCount + this.okCount + this.strongCount;
  if (total === 0) {
    this.level = 0;
  } else {
    this.level = Math.round((100 * (this.okCount * 0.5 + this.strongCount)) / total);
  }
  next();
});

module.exports = mongoose.model('TopicProgress', topicProgressSchema);
