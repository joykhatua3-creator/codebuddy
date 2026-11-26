const User = require('../models/User');
const Review = require('../models/Review');
const TopicProgress = require('../models/TopicProgress');
const Quiz = require('../models/Quiz');
const { asyncHandler } = require('../utils/helpers');

const isDemoTeacherUser = (user) =>
  Boolean(user?.isDemo || user?.email === 'teacher@crbuddy.com');

const isDemoStudentUser = (student) =>
  Boolean(student?.isDemo || student?.email === 'student@crbuddy.com');

const fetchCohortStudentSummaries = async (requestingUser) => {
  const studentFilter = isDemoTeacherUser(requestingUser)
    ? { role: 'student', $or: [{ isDemo: true }, { email: 'student@crbuddy.com' }] }
    : { role: 'student', isDemo: { $ne: true }, email: { $ne: 'student@crbuddy.com' } };

  const students = await User.find(studentFilter)
    .select('name email streak lastActiveDate createdAt')
    .sort({ createdAt: -1 })
    .lean();

  if (students.length === 0) {
    return [];
  }

  const studentIds = students.map((s) => s._id);

  // Run 3 single-pass aggregations instead of 3*N queries
  const [reviewStats, weakestTopics, quizStats] = await Promise.all([
    Review.aggregate([
      { $match: { user: { $in: studentIds } } },
      {
        $group: {
          _id: '$user',
          totalReviews: { $sum: 1 },
          avgScore: { $avg: '$score' },
          latestReviewAt: { $max: '$createdAt' },
        },
      },
    ]),
    TopicProgress.aggregate([
      { $match: { user: { $in: studentIds } } },
      { $sort: { level: 1 } },
      {
        $group: {
          _id: '$user',
          topic: { $first: '$topic' },
          level: { $first: '$level' },
        },
      },
    ]),
    Quiz.aggregate([
      { $match: { user: { $in: studentIds }, completed: true } },
      {
        $group: {
          _id: '$user',
          totalQuizzes: { $sum: 1 },
          avgQuizScore: { $avg: '$score' },
        },
      },
    ]),
  ]);

  const reviewMap = new Map(reviewStats.map((r) => [r._id.toString(), r]));
  const topicMap = new Map(weakestTopics.map((t) => [t._id.toString(), t]));
  const quizMap = new Map(quizStats.map((q) => [q._id.toString(), q]));

  return students.map((student) => {
    const idStr = student._id.toString();
    const rev = reviewMap.get(idStr);
    const top = topicMap.get(idStr);
    const qz = quizMap.get(idStr);
    const lastActive =
      rev?.latestReviewAt && student.lastActiveDate
        ? new Date(Math.max(new Date(rev.latestReviewAt), new Date(student.lastActiveDate)))
        : rev?.latestReviewAt || student.lastActiveDate || student.createdAt;

    return {
      _id: student._id,
      name: student.name,
      email: student.email,
      streak: student.streak || 0,
      totalReviews: rev?.totalReviews || 0,
      avgScore: rev?.avgScore != null ? Math.round(rev.avgScore) : 0,
      weakestTopic: top?.topic || 'N/A',
      weakestTopicLevel: top?.level ?? null,
      totalQuizzes: qz?.totalQuizzes || 0,
      avgQuizScore: qz?.avgQuizScore != null ? Math.round(qz.avgQuizScore) : 0,
      lastActiveDate: lastActive,
      joinedAt: student.createdAt,
    };
  });
};

const escapeCsvCell = (value) => {
  const str = String(value ?? '');
  // Guard against spreadsheet formula injection (=, +, -, @, tab, CR)
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
};

/**
 * @route   GET /api/teacher/students
 * @desc    List registered students (demo teacher is isolated to demo cohort only)
 * @access  Private (teacher only)
 */
const getStudents = asyncHandler(async (req, res) => {
  const enriched = await fetchCohortStudentSummaries(req.user);
  res.json({ success: true, data: enriched });
});

/**
 * @route   GET /api/teacher/students/export
 * @desc    Export cohort-isolated class report as CSV
 * @access  Private (teacher only)
 */
const exportStudentsCsv = asyncHandler(async (req, res) => {
  const students = await fetchCohortStudentSummaries(req.user);
  const header = ['Student Name', 'Email', 'Total Reviews', 'Average Score', 'Weakest Topic', 'Last Active Date'];
  const rows = students.map((s) => [
    s.name,
    s.email,
    s.totalReviews,
    `${s.avgScore}%`,
    s.weakestTopic,
    s.lastActiveDate ? new Date(s.lastActiveDate).toISOString().split('T')[0] : 'N/A',
  ]);

  const csvContent = [header, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="codebuddy-class-report.csv"');
  res.send(csvContent);
});

/**
 * @route   PATCH /api/teacher/reviews/:id/feedback
 * @desc    Add mentor feedback comment & optional score override on a student's review
 * @access  Private (teacher only, cohort isolated)
 */
const addReviewFeedback = asyncHandler(async (req, res) => {
  const { comment, adjustedScore } = req.validatedData;
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  const owner = await User.findById(review.user).select('isDemo email').lean();
  const demoTeacher = isDemoTeacherUser(req.user);
  const demoOwner = isDemoStudentUser(owner);

  if (!owner || (demoTeacher && !demoOwner) || (!demoTeacher && demoOwner)) {
    return res.status(403).json({ success: false, message: 'Not authorized to review this submission' });
  }

  const originalScore = review.teacherFeedback?.originalScore ?? review.score;
  const nextScore = adjustedScore !== undefined ? adjustedScore : review.score;

  review.teacherFeedback = {
    comment,
    adjustedScore: nextScore,
    originalScore,
    teacherName: req.user.name,
    reviewedBy: req.user._id,
    updatedAt: new Date(),
  };

  if (adjustedScore !== undefined) {
    review.score = adjustedScore;
  }

  await review.save();
  const out = review.toObject();
  if (!Array.isArray(out.errors)) {
    out.errors = Array.isArray(out.codeErrors) ? out.codeErrors : [];
  }
  res.json({ success: true, data: out });
});

/**
 * @route   GET /api/teacher/students/:id/progress
 * @desc    View detailed progress for a specific student
 * @access  Private (teacher only)
 */
const getStudentProgress = asyncHandler(async (req, res) => {
  const student = await User.findById(req.params.id).select('-password').lean();
  const demoTeacher = isDemoTeacherUser(req.user);
  const demoStudent = isDemoStudentUser(student);

  if (!student || student.role !== 'student' || (demoTeacher && !demoStudent) || (!demoTeacher && demoStudent)) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  const userId = student._id;

  const [allReviewStats, reviews, topics, quizzes, totalQuizzes] = await Promise.all([
    Review.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, totalReviews: { $sum: 1 }, avgScore: { $avg: '$score' } } },
    ]),
    Review.find({ user: userId })
      .select('score language summary createdAt bugs._id')
      .sort('-createdAt')
      .limit(20)
      .lean(),
    TopicProgress.find({ user: userId }).sort({ level: 1 }).lean(),
    Quiz.find({ user: userId, completed: true })
      .select('topics score correctCount totalQuestions completedAt')
      .sort('-completedAt')
      .limit(10)
      .lean(),
    Quiz.countDocuments({ user: userId, completed: true }),
  ]);

  const totalReviews = allReviewStats[0]?.totalReviews || 0;
  const avgScore = allReviewStats[0]?.avgScore != null ? Math.round(allReviewStats[0].avgScore) : 0;

  const scoreTrend = reviews
    .slice()
    .reverse()
    .map((r) => ({
      date: (r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt)).toISOString().split('T')[0],
      score: r.score || 0,
    }));

  res.json({
    success: true,
    data: {
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        streak: student.streak,
        createdAt: student.createdAt,
      },
      overview: {
        totalReviews,
        avgScore,
        totalQuizzes,
        weakTopicsCount: topics.filter((t) => t.level < 50).length,
      },
      scoreTrend,
      topics,
      recentReviews: reviews.slice(0, 10),
      quizzes,
    },
  });
});

module.exports = { getStudents, getStudentProgress, exportStudentsCsv, addReviewFeedback };
