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
  const students = await User.find({ role: 'student' }).select('name email streak createdAt');

  // Aggregate stats for each student
  const enriched = await Promise.all(
    students.map(async (student) => {
      const [reviews, weakestTopic, quizzes] = await Promise.all([
        Review.find({ user: student._id }).select('score'),
        TopicProgress.findOne({ user: student._id }).sort({ level: 1 }).select('topic level'),
        Quiz.find({ user: student._id, completed: true }).select('score'),
      ]);

      const totalReviews = reviews.length;
      const avgScore =
        totalReviews > 0
          ? Math.round(reviews.reduce((a, r) => a + (r.score || 0), 0) / totalReviews)
          : 0;
      const avgQuizScore =
        quizzes.length > 0
          ? Math.round(quizzes.reduce((a, q) => a + (q.score || 0), 0) / quizzes.length)
          : 0;

      return {
        _id: student._id,
        name: student.name,
        email: student.email,
        streak: student.streak,
        totalReviews,
        avgScore,
        weakestTopic: weakestTopic?.topic || 'N/A',
        weakestTopicLevel: weakestTopic?.level ?? null,
        totalQuizzes: quizzes.length,
        avgQuizScore,
        joinedAt: student.createdAt,
      };
    })
  );

  res.json({ success: true, data: enriched });
});

/**
 * @route   GET /api/teacher/students/:id/progress
 * @desc    View detailed progress for a specific student
 * @access  Private (teacher only)
 */
const getStudentProgress = asyncHandler(async (req, res) => {
  const student = await User.findById(req.params.id).select('-password');

  if (!student || student.role !== 'student') {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  const userId = student._id;

  const [reviews, topics, quizzes] = await Promise.all([
    Review.find({ user: userId })
      .select('score language summary createdAt bugs')
      .sort('-createdAt')
      .limit(20),
    TopicProgress.find({ user: userId }).sort({ level: 1 }),
    Quiz.find({ user: userId, completed: true })
      .select('topics score correctCount totalQuestions completedAt')
      .sort('-completedAt')
      .limit(10),
  ]);

  const totalReviews = reviews.length;
  const avgScore =
    totalReviews > 0
      ? Math.round(reviews.reduce((a, r) => a + (r.score || 0), 0) / totalReviews)
      : 0;

  const scoreTrend = reviews
    .slice()
    .reverse()
    .map((r) => ({
      date: r.createdAt.toISOString().split('T')[0],
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
