const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    language: {
      type: String,
      required: true,
      enum: [
        'python', 'javascript', 'typescript', 'java', 'cpp', 'c', 'csharp',
        'go', 'rust', 'sql', 'kotlin', 'swift', 'dart', 'php', 'ruby',
        'r', 'scala', 'julia', 'mojo', 'zig', 'elixir', 'lua', 'perl',
        'matlab', 'assembly', 'bash', 'solidity', 'groovy', 'haskell', 'fsharp',
      ],
    },
    description: {
      type: String,
      required: [true, 'Problem description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [4000, 'Description cannot exceed 4,000 characters'],
    },
    starterCode: {
      type: String,
      default: '',
      maxlength: [15000, 'Starter code cannot exceed 15,000 characters'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    isDemo: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

assignmentSchema.index({ isDemo: 1, createdAt: -1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
