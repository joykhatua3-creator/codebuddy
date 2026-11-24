const TopicProgress = require('../models/TopicProgress');
const Review = require('../models/Review');
const Quiz = require('../models/Quiz');
const { asyncHandler } = require('../utils/helpers');

/**
 * @route   GET /api/progress
 * @desc    Get student's full progress data
 * @access  Private (student)
 */
const getProgress = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get topic progress
  const topics = await TopicProgress.find({ user: userId }).sort({ level: 1 }).lean();

  // Get 3 weakest topics (lowest level)
  const weakestTopics = topics.slice(0, 3);

  // Review stats
  const reviews = await Review.find({ user: userId }).select('score createdAt language').lean();
  const totalReviews = reviews.length;
  const avgScore =
    totalReviews > 0
      ? Math.round(reviews.reduce((acc, r) => acc + (r.score || 0), 0) / totalReviews)
      : 0;

  // Score over time (last 30 entries)
  const scoreTrend = reviews
    .slice(-30)
    .map((r) => ({
      date: (r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt)).toISOString().split('T')[0],
      score: r.score || 0,
      language: r.language,
    }));

  // Quiz stats
  const quizzes = await Quiz.find({ user: userId, completed: true }).select(
    'score topics createdAt completedAt'
  ).lean();
  const totalQuizzes = quizzes.length;
  const avgQuizScore =
    totalQuizzes > 0
      ? Math.round(quizzes.reduce((acc, q) => acc + (q.score || 0), 0) / totalQuizzes)
      : 0;

  // Recent quizzes (last 5)
  const recentQuizzes = quizzes.slice(-5).reverse();

  // Activity by day (last 14 days)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const recentReviews = await Review.find({
    user: userId,
    createdAt: { $gte: fourteenDaysAgo },
  }).select('createdAt').lean();

  const activityMap = {};
  recentReviews.forEach((r) => {
    const day = (r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt)).toISOString().split('T')[0];
    activityMap[day] = (activityMap[day] || 0) + 1;
  });

  res.json({
    success: true,
    data: {
      overview: {
        totalReviews,
        avgScore,
        totalQuizzes,
        avgQuizScore,
        streak: req.user.streak,
        weakTopicsCount: topics.filter((t) => t.level < 50).length,
      },
      scoreTrend,
      topics,
      weakestTopics,
      recentQuizzes,
      activity: activityMap,
    },
  });
});

module.exports = { getProgress };
