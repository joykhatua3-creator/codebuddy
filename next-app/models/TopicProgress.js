import mongoose from 'mongoose';

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
    level: { type: Number, default: 0, min: 0, max: 100 },
    lastSeen: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

topicProgressSchema.index({ user: 1, topic: 1 }, { unique: true });

topicProgressSchema.pre('save', function (next) {
  const total = this.weakCount + this.okCount + this.strongCount;
  if (total === 0) {
    this.level = 0;
  } else {
    this.level = Math.round((100 * (this.okCount * 0.5 + this.strongCount * 1.0)) / total);
  }
  next();
});

export default mongoose.models.TopicProgress || mongoose.model('TopicProgress', topicProgressSchema);
