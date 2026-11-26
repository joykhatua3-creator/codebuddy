const Assignment = require('../models/Assignment');
const Review = require('../models/Review');
const User = require('../models/User');
const { asyncHandler } = require('../utils/helpers');

const isDemoUser = (user) =>
  Boolean(user?.isDemo || user?.email === 'teacher@crbuddy.com' || user?.email === 'student@crbuddy.com');

/**
 * @route   POST /api/assignments
 * @desc    Create a coding assignment (teacher only, cohort isolated)
 * @access  Private (teacher)
 */
const createAssignment = asyncHandler(async (req, res) => {
  const { title, language, description, starterCode, dueDate } = req.validatedData;
  const parsedDueDate = new Date(dueDate);
  if (Number.isNaN(parsedDueDate.getTime())) {
    return res.status(400).json({ success: false, message: 'Invalid due date' });
  }

  const assignment = await Assignment.create({
    teacher: req.user._id,
    title,
    language,
    description,
    starterCode: starterCode || '',
    dueDate: parsedDueDate,
    isDemo: isDemoUser(req.user),
  });

  res.status(201).json({ success: true, data: assignment });
});

/**
 * @route   GET /api/assignments
 * @desc    Get assignments for student or teacher (strictly cohort-isolated)
 * @access  Private (student | teacher)
 */
const getAssignments = asyncHandler(async (req, res) => {
  const demoMode = isDemoUser(req.user);
  const filter = demoMode ? { isDemo: true } : { isDemo: { $ne: true } };

  const assignments = await Assignment.find(filter)
    .populate('teacher', 'name email')
    .sort({ dueDate: 1, createdAt: -1 })
    .lean();

  if (assignments.length === 0) {
    return res.json({ success: true, data: [] });
  }

  const assignmentIds = assignments.map((a) => a._id);

  if (req.user.role === 'teacher') {
    const cohortStudentIds = await User.find(
      demoMode
        ? { role: 'student', $or: [{ isDemo: true }, { email: 'student@crbuddy.com' }] }
        : { role: 'student', isDemo: { $ne: true }, email: { $ne: 'student@crbuddy.com' } }
    ).distinct('_id');

    const stats = await Review.aggregate([
      {
        $match: {
          assignment: { $in: assignmentIds },
          user: { $in: cohortStudentIds },
        },
      },
      {
        $group: {
          _id: '$assignment',
          submissionCount: { $sum: 1 },
          avgScore: { $avg: '$score' },
        },
      },
    ]);

    const statMap = new Map(stats.map((s) => [s._id.toString(), s]));
    const enriched = assignments.map((a) => {
      const st = statMap.get(a._id.toString());
      return {
        ...a,
        submissionCount: st?.submissionCount || 0,
        avgScore: st?.avgScore != null ? Math.round(st.avgScore) : null,
      };
    });

    return res.json({ success: true, data: enriched });
  }

  // Student view: attach this student's latest submission per assignment
  const mySubmissions = await Review.find({
    user: req.user._id,
    assignment: { $in: assignmentIds },
  })
    .select('assignment score createdAt teacherFeedback')
    .sort('-createdAt')
    .lean();

  const subMap = new Map();
  for (const sub of mySubmissions) {
    const key = sub.assignment.toString();
    if (!subMap.has(key)) subMap.set(key, sub);
  }

  const enriched = assignments.map((a) => ({
    ...a,
    mySubmission: subMap.get(a._id.toString()) || null,
  }));

  res.json({ success: true, data: enriched });
});

/**
 * @route   GET /api/assignments/:id/submissions
 * @desc    View all student submissions for an assignment (teacher only, cohort-isolated)
 * @access  Private (teacher)
 */
const getAssignmentSubmissions = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id).lean();
  if (!assignment) {
    return res.status(404).json({ success: false, message: 'Assignment not found' });
  }

  const demoMode = isDemoUser(req.user);
  if (Boolean(assignment.isDemo) !== demoMode) {
    return res.status(404).json({ success: false, message: 'Assignment not found' });
  }

  const cohortStudentIds = await User.find(
    demoMode
      ? { role: 'student', $or: [{ isDemo: true }, { email: 'student@crbuddy.com' }] }
      : { role: 'student', isDemo: { $ne: true }, email: { $ne: 'student@crbuddy.com' } }
  ).distinct('_id');

  const submissions = await Review.find({
    assignment: assignment._id,
    user: { $in: cohortStudentIds },
  })
    .populate('user', 'name email')
    .select('user score language bugs teacherFeedback createdAt')
    .sort('-createdAt')
    .lean();

  res.json({
    success: true,
    data: {
      assignment,
      submissions: submissions.map((s) => ({
        _id: s._id,
        student: s.user,
        score: s.score,
        language: s.language,
        bugCount: s.bugs?.length || 0,
        teacherFeedback: s.teacherFeedback || null,
        submittedAt: s.createdAt,
      })),
    },
  });
});

/**
 * @route   DELETE /api/assignments/:id
 * @desc    Delete an assignment (teacher owner or cohort teacher)
 * @access  Private (teacher)
 */
const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    return res.status(404).json({ success: false, message: 'Assignment not found' });
  }

  const demoMode = isDemoUser(req.user);
  if (Boolean(assignment.isDemo) !== demoMode || (!demoMode && assignment.teacher.toString() !== req.user._id.toString())) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this assignment' });
  }

  await assignment.deleteOne();
  res.json({ success: true, message: 'Assignment deleted successfully' });
});

module.exports = {
  createAssignment,
  getAssignments,
  getAssignmentSubmissions,
  deleteAssignment,
};
