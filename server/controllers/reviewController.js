const Review = require('../models/Review');
const TopicProgress = require('../models/TopicProgress');
const User = require('../models/User');
const { reviewCode: aiReviewCode } = require('../services/aiService');
const { generateCodeHash, asyncHandler } = require('../utils/helpers');

/**
 * Update TopicProgress for a student based on AI-detected concepts.
 * @param {string} userId
 * @param {Array<{name: string, level: 'weak'|'ok'|'strong'}>} concepts
 */
const updateTopicProgress = async (userId, concepts) => {
  for (const concept of concepts) {
    const update = {};
    if (concept.level === 'weak') update.$inc = { weakCount: 1 };
    else if (concept.level === 'ok') update.$inc = { okCount: 1 };
    else if (concept.level === 'strong') update.$inc = { strongCount: 1 };

    update.$set = { lastSeen: new Date() };

    await TopicProgress.findOneAndUpdate(
      { user: userId, topic: concept.name },
      update,
      { upsert: true, new: true, runValidators: true }
    );

    // Recalculate level
    const tp = await TopicProgress.findOne({ user: userId, topic: concept.name });
    if (tp) await tp.save(); // triggers pre-save hook to recalc level
  }
};

/**
 * @route   POST /api/reviews
 * @desc    Submit code for AI review
 * @access  Private (student)
 */
const submitReview = asyncHandler(async (req, res) => {
  const { language, code } = req.validatedData;
  const userId = req.user._id;

  // Generate hash for cache lookup
  const codeHash = generateCodeHash(code, language);

  // Check for cached review (same user + same code)
  const cached = await Review.findOne({ user: userId, codeHash });
  if (cached) {
    return res.json({
      success: true,
      data: { ...cached.toObject(), fromCache: true },
    });
  }

  // Call AI for fresh review
  const aiResult = await aiReviewCode(code, language);

  // Save review
  const review = await Review.create({
    user: userId,
    language,
    code,
    codeHash,
    score: aiResult.score,
    summary: aiResult.summary,
    bugs: aiResult.bugs,
    codeQuality: aiResult.codeQuality,
    complexity: aiResult.complexity,
    security: aiResult.security,
    concepts: aiResult.concepts,
    fromCache: false,
  });

  // Update topic progress asynchronously
  if (aiResult.concepts?.length > 0) {
    updateTopicProgress(userId, aiResult.concepts).catch((err) =>
      console.error('Topic progress update error:', err.message)
    );
  }

  // Update user streak
  const user = await User.findById(userId);
  user.updateStreak();
  await user.save();

  res.status(201).json({ success: true, data: review });
});

/**
 * @route   GET /api/reviews
 * @desc    Get all reviews for the authenticated student
 * @access  Private (student)
 */
const getReviews = asyncHandler(async (req, res) => {
  const { language, minScore, maxScore, sort = '-createdAt', page = 1, limit = 10 } = req.query;

  const filter = { user: req.user._id };
  if (language) filter.language = language;
  if (minScore || maxScore) {
    filter.score = {};
    if (minScore) filter.score.$gte = Number(minScore);
    if (maxScore) filter.score.$lte = Number(maxScore);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .select('-code -bugs.solution') // don't expose solutions in list view
      .sort(sort)
      .skip(skip)
      .limit(Number(limit)),
    Review.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      reviews,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    },
  });
});

/**
 * @route   GET /api/reviews/:id
 * @desc    Get a single review (full detail including solutions)
 * @access  Private (owner only)
 */
const getReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  // Ownership check
  if (review.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to view this review' });
  }

  res.json({ success: true, data: review });
});

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete a review
 * @access  Private (owner only)
 */
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  if (review.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
  }

  await review.deleteOne();

  res.json({ success: true, data: { message: 'Review deleted successfully' } });
});

/**
 * @route   PATCH /api/reviews/:id/bookmark
 * @desc    Toggle bookmark on a review
 * @access  Private (owner only)
 */
const toggleBookmark = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  if (review.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  review.isBookmarked = !review.isBookmarked;
  await review.save();

  res.json({ success: true, data: { isBookmarked: review.isBookmarked } });
});

module.exports = { submitReview, getReviews, getReview, deleteReview, toggleBookmark };
