const Roadmap = require('../models/Roadmap');
const TopicProgress = require('../models/TopicProgress');
const { generateRoadmap: aiGenerateRoadmap } = require('../services/aiService');
const { asyncHandler } = require('../utils/helpers');

const toSkillSlug = (name = '') =>
  String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'custom-skill';

const dropLegacyUniqueUserIndexIfNeeded = async () => {
  try {
    const indexes = await Roadmap.collection.indexes();
    const legacy = indexes.find((idx) => idx.name === 'user_1' && idx.unique);
    if (legacy) {
      await Roadmap.collection.dropIndex('user_1');
      console.log('ℹ️ Dropped legacy unique user_1 index on roadmaps collection');
    }
  } catch {
    // Ignore if index does not exist or collection not yet created
  }
};

/**
 * @route   POST /api/roadmap/generate
 * @desc    Generate (or regenerate) a personalized skill learning roadmap
 * @access  Private (student)
 */
const generateRoadmap = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { skillName: rawSkillName = '', level = 'Beginner', roadmapId } = req.validatedData || {};

  // Get weakest topics (up to 5) to inform default/tailored study context
  const weakTopics = await TopicProgress.find({ user: userId })
    .sort({ level: 1 })
    .limit(5)
    .select('topic level')
    .lean();

  let topicNames = weakTopics.map((t) => t.topic);
  if (topicNames.length === 0) {
    topicNames = [
      'Variables and Data Types',
      'Control Flow and Loops',
      'Functions and Scope',
      'Arrays and Data Structures',
      'Asynchronous JavaScript',
    ];
  }

  const chosenSkillName = rawSkillName.trim() || 'JavaScript & React';
  const studentName = req.user.name.split(' ')[0];

  const aiResult = await aiGenerateRoadmap(topicNames, studentName, {
    skillName: chosenSkillName,
    level,
  });

  const finalSkillName = aiResult.skillName || chosenSkillName;
  const finalLevel = ['Beginner', 'Intermediate', 'Advanced'].includes(aiResult.level)
    ? aiResult.level
    : level;
  const skillSlug = toSkillSlug(finalSkillName);

  const normalizedSteps = (aiResult.steps || []).map((s, idx) => ({
    order: s.order || idx + 1,
    title: s.title || s.topic,
    topic: s.topic,
    level: s.level || finalLevel,
    estimatedHours: Number(s.estimatedHours) || 2,
    objective: s.objective,
    explanation: s.explanation || '',
    keyConcepts: Array.isArray(s.keyConcepts) ? s.keyConcepts : [],
    subTasks: Array.isArray(s.subTasks)
      ? s.subTasks.map((st) => ({ title: st.title, completed: false }))
      : [],
    learningTask: s.learningTask || '',
    practiceAssignment: s.practiceAssignment || '',
    starterCode: s.starterCode || '',
    language: s.language || aiResult.language || 'javascript',
    completed: false,
    completedAt: null,
  }));

  const totalHours = normalizedSteps.reduce((sum, s) => sum + (s.estimatedHours || 2), 0);

  await dropLegacyUniqueUserIndexIfNeeded();

  let roadmap = null;
  if (roadmapId) {
    roadmap = await Roadmap.findOne({ _id: roadmapId, user: userId });
  }
  if (!roadmap) {
    roadmap = await Roadmap.findOne({ user: userId, skillSlug, level: finalLevel });
  }

  if (roadmap) {
    roadmap.skillName = finalSkillName;
    roadmap.skillSlug = skillSlug;
    roadmap.level = finalLevel;
    roadmap.language = aiResult.language || 'javascript';
    roadmap.totalHours = totalHours;
    roadmap.steps = normalizedSteps;
    roadmap.weakTopicsSnapshot = rawSkillName.trim() ? [finalSkillName] : topicNames;
    roadmap.generatedAt = new Date();
    await roadmap.save();
  } else {
    roadmap = await Roadmap.create({
      user: userId,
      skillName: finalSkillName,
      skillSlug,
      level: finalLevel,
      language: aiResult.language || 'javascript',
      totalHours,
      steps: normalizedSteps,
      weakTopicsSnapshot: rawSkillName.trim() ? [finalSkillName] : topicNames,
      generatedAt: new Date(),
    });
  }

  const roadmaps = await Roadmap.find({ user: userId }).sort({ updatedAt: -1 }).lean();

  res.json({ success: true, data: roadmap, roadmaps });
});

/**
 * @route   GET /api/roadmap
 * @desc    Get student's active roadmap plus all saved skill roadmaps
 * @access  Private (student)
 */
const getRoadmap = asyncHandler(async (req, res) => {
  const { roadmapId } = req.query;
  const roadmaps = await Roadmap.find({ user: req.user._id }).sort({ updatedAt: -1 }).lean();

  if (roadmaps.length === 0) {
    return res.json({ success: true, data: null, roadmaps: [] });
  }

  const active = roadmapId
    ? roadmaps.find((r) => r._id.toString() === String(roadmapId)) || roadmaps[0]
    : roadmaps[0];

  res.json({ success: true, data: active, roadmaps });
});

/**
 * @route   PATCH /api/roadmap/steps/:stepId
 * @desc    Toggle a milestone step or sub-task completion status
 * @access  Private (student, owner)
 */
const updateStep = asyncHandler(async (req, res) => {
  const { stepId } = req.params;
  const { completed, roadmapId, subTaskId, subTaskCompleted } = req.validatedData || req.body || {};

  const query = roadmapId
    ? { _id: roadmapId, user: req.user._id }
    : { user: req.user._id, 'steps._id': stepId };

  const roadmap = await Roadmap.findOne(query);
  if (!roadmap) {
    return res.status(404).json({ success: false, message: 'Roadmap not found' });
  }

  const step = roadmap.steps.id(stepId);
  if (!step) {
    return res.status(404).json({ success: false, message: 'Step not found' });
  }

  if (subTaskId) {
    const subTask = step.subTasks?.id(subTaskId);
    if (!subTask) {
      return res.status(404).json({ success: false, message: 'Sub-task not found' });
    }
    subTask.completed = subTaskCompleted !== undefined ? subTaskCompleted : !subTask.completed;

    if (step.subTasks.length > 0) {
      const allDone = step.subTasks.every((st) => st.completed);
      step.completed = allDone;
      step.completedAt = allDone ? step.completedAt || new Date() : null;
    }
  } else {
    const nextCompleted = completed !== undefined ? completed : !step.completed;
    step.completed = nextCompleted;
    step.completedAt = nextCompleted ? new Date() : null;
    if (Array.isArray(step.subTasks) && step.subTasks.length > 0) {
      step.subTasks.forEach((st) => {
        st.completed = nextCompleted;
      });
    }
  }

  await roadmap.save();

  res.json({
    success: true,
    data: {
      roadmap,
      stepId: step._id,
      step,
      completed: step.completed,
      completionPercentage: roadmap.completionPercentage,
    },
  });
});

/**
 * @route   PATCH /api/roadmap/:id/reset
 * @desc    Reset all milestones & sub-tasks progress to 0% without deleting the roadmap
 * @access  Private (student, owner)
 */
const resetRoadmapProgress = asyncHandler(async (req, res) => {
  const roadmap = await Roadmap.findOne({ _id: req.params.id, user: req.user._id });
  if (!roadmap) {
    return res.status(404).json({ success: false, message: 'Roadmap not found' });
  }

  roadmap.steps.forEach((step) => {
    step.completed = false;
    step.completedAt = null;
    if (Array.isArray(step.subTasks)) {
      step.subTasks.forEach((st) => {
        st.completed = false;
      });
    }
  });

  await roadmap.save();

  res.json({ success: true, data: roadmap });
});

/**
 * @route   DELETE /api/roadmap/:id?
 * @desc    Delete a specific roadmap (or latest if no id given)
 * @access  Private (student, owner)
 */
const deleteRoadmap = asyncHandler(async (req, res) => {
  const query = req.params.id
    ? { _id: req.params.id, user: req.user._id }
    : { user: req.user._id };

  const roadmap = await Roadmap.findOneAndDelete(query);
  if (!roadmap) {
    return res.status(404).json({ success: false, message: 'No roadmap found to delete' });
  }

  const remaining = await Roadmap.find({ user: req.user._id }).sort({ updatedAt: -1 }).lean();
  res.json({
    success: true,
    message: 'Roadmap deleted successfully',
    data: remaining[0] || null,
    roadmaps: remaining,
  });
});

module.exports = {
  generateRoadmap,
  getRoadmap,
  updateStep,
  resetRoadmapProgress,
  deleteRoadmap,
};
