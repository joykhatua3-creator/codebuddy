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

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  // Push summary averages, trends, and activity grouping into MongoDB aggregations in parallel
  const [topics, reviewAgg, quizAgg] = await Promise.all([
    TopicProgress.find({ user: userId }).sort({ level: 1 }).lean(),
    Review.aggregate([
      { $match: { user: userId } },
      {
        $facet: {
          stats: [
            {
              $group: {
                _id: null,
                totalReviews: { $sum: 1 },
                avgScore: { $avg: '$score' },
              },
            },
          ],
          recentTrend: [
            { $sort: { createdAt: -1 } },
            { $limit: 30 },
            { $project: { _id: 0, score: 1, createdAt: 1, language: 1 } },
          ],
          activityByDay: [
            { $match: { createdAt: { $gte: fourteenDaysAgo } } },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]),
    Quiz.aggregate([
      { $match: { user: userId, completed: true } },
      {
        $facet: {
          stats: [
            {
              $group: {
                _id: null,
                totalQuizzes: { $sum: 1 },
                avgQuizScore: { $avg: '$score' },
              },
            },
          ],
          recentQuizzes: [
            { $sort: { completedAt: -1, createdAt: -1 } },
            { $limit: 5 },
            { $project: { score: 1, topics: 1, createdAt: 1, completedAt: 1 } },
          ],
        },
      },
    ]),
  ]);

  // Get up to 3 weakest unmastered topics (exclude >= 75% mastered concepts)
  const weakestTopics = topics.filter((t) => t.level < 75).slice(0, 3);

  const reviewFacet = reviewAgg[0] || {};
  const reviewStats = reviewFacet.stats?.[0];
  const totalReviews = reviewStats?.totalReviews || 0;
  const avgScore = reviewStats?.avgScore != null ? Math.round(reviewStats.avgScore) : 0;

  // Chronological oldest -> newest for last 30 reviews
  const scoreTrend = (reviewFacet.recentTrend || [])
    .slice()
    .reverse()
    .map((r) => ({
      date: (r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt)).toISOString().split('T')[0],
      score: r.score || 0,
      language: r.language,
    }));

  const quizFacet = quizAgg[0] || {};
  const quizStats = quizFacet.stats?.[0];
  const totalQuizzes = quizStats?.totalQuizzes || 0;
  const avgQuizScore = quizStats?.avgQuizScore != null ? Math.round(quizStats.avgQuizScore) : 0;
  const recentQuizzes = quizFacet.recentQuizzes || [];

  const activityMap = {};
  (reviewFacet.activityByDay || []).forEach((entry) => {
    if (entry?._id) activityMap[entry._id] = entry.count;
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
