const Roadmap = require('../models/Roadmap');
const TopicProgress = require('../models/TopicProgress');
const { generateRoadmap: aiGenerateRoadmap } = require('../services/aiService');
const { asyncHandler } = require('../utils/helpers');

/**
 * @route   POST /api/roadmap/generate
 * @desc    Generate (or regenerate) a personalized learning roadmap
 * @access  Private (student)
 */
const generateRoadmap = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get weakest topics (up to 5)
  const weakTopics = await TopicProgress.find({ user: userId })
    .sort({ level: 1 })
    .limit(5)
    .select('topic level');

  if (weakTopics.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No programming topics found yet. Submit at least one code review first.',
    });
  }

  const topicNames = weakTopics.map((t) => t.topic);
  const studentName = req.user.name.split(' ')[0];

  // Call AI
  const aiResult = await aiGenerateRoadmap(topicNames, studentName);

  // Upsert roadmap (replace if already exists)
  const roadmap = await Roadmap.findOneAndUpdate(
    { user: userId },
    {
      user: userId,
      steps: aiResult.steps.map((s) => ({ ...s, completed: false, completedAt: null })),
      weakTopicsSnapshot: topicNames,
      generatedAt: new Date(),
    },
    { upsert: true, new: true, runValidators: true }
  );

  res.json({ success: true, data: roadmap });
});

/**
 * @route   GET /api/roadmap
 * @desc    Get the student's current roadmap
 * @access  Private (student)
 */
const getRoadmap = asyncHandler(async (req, res) => {
  const roadmap = await Roadmap.findOne({ user: req.user._id });

  if (!roadmap) {
    return res.status(404).json({
      success: false,
      message: 'No roadmap found. Generate one first.',
    });
  }

  res.json({ success: true, data: roadmap });
});

/**
 * @route   PATCH /api/roadmap/steps/:stepId
 * @desc    Toggle a roadmap step's completion status
 * @access  Private (student, owner)
 */
const updateStep = asyncHandler(async (req, res) => {
  const { stepId } = req.params;
  const { completed } = req.body;

  const roadmap = await Roadmap.findOne({ user: req.user._id });

  if (!roadmap) {
    return res.status(404).json({ success: false, message: 'Roadmap not found' });
  }

  const step = roadmap.steps.id(stepId);
  if (!step) {
    return res.status(404).json({ success: false, message: 'Step not found' });
  }

  step.completed = completed !== undefined ? completed : !step.completed;
  step.completedAt = step.completed ? new Date() : null;

  await roadmap.save(); // triggers pre-save to recalc completionPercentage

  res.json({
    success: true,
    data: {
      stepId: step._id,
      completed: step.completed,
      completionPercentage: roadmap.completionPercentage,
    },
  });
});

module.exports = { generateRoadmap, getRoadmap, updateStep };
