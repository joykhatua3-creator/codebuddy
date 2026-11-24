const User = require('../models/User');
const Review = require('../models/Review');
const TopicProgress = require('../models/TopicProgress');
const Quiz = require('../models/Quiz');
const { asyncHandler } = require('../utils/helpers');

/**
 * @route   GET /api/teacher/students
 * @desc    List all registered students with summary stats
 * @access  Private (teacher only)
 */
const getStudents = asyncHandler(async (req, res) => {
  const students = await User.find({ role: 'student' })
    .select('name email streak createdAt')
    .sort({ createdAt: -1 })
    .lean();

  if (students.length === 0) {
    return res.json({ success: true, data: [] });
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

  const enriched = students.map((student) => {
    const idStr = student._id.toString();
    const rev = reviewMap.get(idStr);
    const top = topicMap.get(idStr);
    const qz = quizMap.get(idStr);

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
      joinedAt: student.createdAt,
    };
  });

  res.json({ success: true, data: enriched });
});

/**
 * @route   GET /api/teacher/students/:id/progress
 * @desc    View detailed progress for a specific student
 * @access  Private (teacher only)
 */
const getStudentProgress = asyncHandler(async (req, res) => {
  const student = await User.findById(req.params.id).select('-password').lean();

  if (!student || student.role !== 'student') {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  const userId = student._id;

  const [allReviewStats, reviews, topics, quizzes] = await Promise.all([
    Review.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, totalReviews: { $sum: 1 }, avgScore: { $avg: '$score' } } },
    ]),
    Review.find({ user: userId })
      .select('score language summary createdAt bugs')
      .sort('-createdAt')
      .limit(20)
      .lean(),
    TopicProgress.find({ user: userId }).sort({ level: 1 }).lean(),
    Quiz.find({ user: userId, completed: true })
      .select('topics score correctCount totalQuestions completedAt')
      .sort('-completedAt')
      .limit(10)
      .lean(),
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
        totalQuizzes: quizzes.length,
        weakTopicsCount: topics.filter((t) => t.level < 50).length,
      },
      scoreTrend,
      topics,
      recentReviews: reviews.slice(0, 10),
      quizzes,
    },
  });
});

module.exports = { getStudents, getStudentProgress };
