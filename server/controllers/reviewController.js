const Review = require('../models/Review');
const TopicProgress = require('../models/TopicProgress');
const User = require('../models/User');
const { reviewCode: aiReviewCode } = require('../services/aiService');
const { generateCodeHash, asyncHandler } = require('../utils/helpers');
const {
  getReviewCache,
  setReviewCache,
  deleteReviewCache,
  checkQuotaGuard,
} = require('../config/redis');

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

    const tp = await TopicProgress.findOne({ user: userId, topic: concept.name });
    if (tp) await tp.save();
  }
};

/**
 * @route   POST /api/reviews
 * @desc    Submit code for AI review (with Upstash Redis cache & quota guard)
 * @access  Private (student)
 */
const submitReview = asyncHandler(async (req, res) => {
  const { language, code } = req.validatedData;
  const userId = req.user._id;

  const codeHash = generateCodeHash(code, language);

  // 1. Check Redis cache first (fast sub-millisecond response)
  const cachedRedis = await getReviewCache(codeHash);
  if (cachedRedis) {
    return res.json({
      success: true,
      data: { ...cachedRedis, fromCache: true },
    });
  }

  // 2. Check MongoDB cache
  const cachedMongo = await Review.findOne({ user: userId, codeHash });
  if (cachedMongo) {
    await setReviewCache(codeHash, cachedMongo.toObject(), 86400);
    return res.json({
      success: true,
      data: { ...cachedMongo.toObject(), fromCache: true },
    });
  }

  // 3. Enforce Redis Quota Guard
  await checkQuotaGuard(userId);

  // 4. Call AI (queued via p-queue with concurrency 2)
  const aiResult = await aiReviewCode(code, language);

  // 5. Save in MongoDB
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

  // 6. Cache in Redis with 24h TTL
  await setReviewCache(codeHash, review.toObject(), 86400);

  // Update topic progress asynchronously
  if (aiResult.concepts?.length > 0) {
    updateTopicProgress(userId, aiResult.concepts).catch((err) =>
      console.error('Topic progress update error:', err.message)
    );
  }

  // Update user streak
  const user = await User.findById(userId);
  if (user) {
    user.updateStreak();
    await user.save();
  }

  res.status(201).json({ success: true, data: review });
});

/**
 * @route   POST /api/reviews/stream
 * @desc    Submit code and stream review via Server-Sent Events (SSE)
 * @access  Private (student)
 */
const streamReview = asyncHandler(async (req, res) => {
  const { language, code } = req.body;
  if (!language || !code) {
    return res.status(400).json({ success: false, message: 'Language and code are required' });
  }

  const userId = req.user._id;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  sendEvent('status', { step: 1, message: 'Checking cache...' });
  const codeHash = generateCodeHash(code, language);
  const cached = (await getReviewCache(codeHash)) || (await Review.findOne({ user: userId, codeHash }));

  if (cached) {
    sendEvent('status', { step: 2, message: 'Review retrieved from cache' });
    sendEvent('complete', { ...cached, fromCache: true });
    return res.end();
  }

  await checkQuotaGuard(userId);
  sendEvent('status', { step: 2, message: 'Sending code to Gemini AI for structured static analysis...' });

  const aiResult = await aiReviewCode(code, language);
  sendEvent('status', { step: 3, message: 'Validating response and saving review...' });

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

  await setReviewCache(codeHash, review.toObject(), 86400);

  if (aiResult.concepts?.length > 0) {
    updateTopicProgress(userId, aiResult.concepts).catch(console.error);
  }

  sendEvent('complete', review);
  res.end();
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
      .select('-code -bugs.solution')
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
 * @access  Private (owner or teacher)
 */
const getReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'teacher') {
    return res.status(403).json({ success: false, message: 'Not authorized to view this review' });
  }

  res.json({ success: true, data: review });
});

/**
 * @route   PATCH /api/reviews/:id
 * @desc    Update review (title, notes)
 * @access  Private (owner only)
 */
const updateReview = asyncHandler(async (req, res) => {
  const { summary, notes, isBookmarked } = req.body;
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  if (review.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  if (summary !== undefined) review.summary = summary;
  if (notes !== undefined) review.notes = notes;
  if (isBookmarked !== undefined) review.isBookmarked = isBookmarked;

  await review.save();

  // Invalidate cache
  await deleteReviewCache(review.codeHash);

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

  await deleteReviewCache(review.codeHash);
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

module.exports = {
  submitReview,
  streamReview,
  getReviews,
  getReview,
  updateReview,
  deleteReview,
  toggleBookmark,
};
