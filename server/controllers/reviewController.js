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

const { reviewSubmitSchema } = require('../validators/schemas');

/**
 * Update TopicProgress for a student based on AI-detected concepts (parallelized).
 * @param {string} userId
 * @param {Array<{name: string, level: 'weak'|'ok'|'strong'}>} concepts
 */
const updateTopicProgress = async (userId, concepts) => {
  if (!Array.isArray(concepts) || concepts.length === 0) return;

  await Promise.all(
    concepts.map(async (concept) => {
      if (!concept?.name) return;
      const inc = {};
      if (concept.level === 'weak') inc.weakCount = 1;
      else if (concept.level === 'ok') inc.okCount = 1;
      else if (concept.level === 'strong') inc.strongCount = 1;

      const updated = await TopicProgress.findOneAndUpdate(
        { user: userId, topic: concept.name.trim() },
        { ...(Object.keys(inc).length ? { $inc: inc } : {}), $set: { lastSeen: new Date() } },
        { upsert: true, new: true }
      );

      if (updated) {
        const total = updated.weakCount + updated.okCount + updated.strongCount;
        const computedLevel =
          total === 0 ? 0 : Math.round((100 * (updated.okCount * 0.5 + updated.strongCount)) / total);
        if (updated.level !== computedLevel) {
          updated.level = computedLevel;
          await updated.save();
        }
      }
    })
  );
};

const updateUserStreak = async (userId) => {
  const user = await User.findById(userId);
  if (user) {
    user.updateStreak();
    await user.save();
  }
};

const extractAiFields = (source) => ({
  score: source.score,
  summary: source.summary,
  bugs: source.bugs || [],
  codeQuality: source.codeQuality,
  complexity: source.complexity,
  security: source.security || [],
  concepts: source.concepts || [],
});

/**
 * @route   POST /api/reviews
 * @desc    Submit code for AI review (with Upstash Redis cache & quota guard)
 * @access  Private (student)
 */
const submitReview = asyncHandler(async (req, res) => {
  const { language, code } = req.validatedData;
  const userId = req.user._id;
  const codeHash = generateCodeHash(code, language);

  // 1. Check if this user already reviewed this exact code
  const existingUserReview = await Review.findOne({ user: userId, codeHash }).lean();
  if (existingUserReview) {
    return res.json({
      success: true,
      data: { ...existingUserReview, fromCache: true },
    });
  }

  // 2. Check shared AI analysis cache in Redis; create a user-owned Review record if found
  const cachedAi = await getReviewCache(codeHash);
  let aiResult = cachedAi ? extractAiFields(cachedAi) : null;
  let fromCache = !!aiResult;

  if (!aiResult) {
    await checkQuotaGuard(userId);
    aiResult = await aiReviewCode(code, language);
    await setReviewCache(codeHash, extractAiFields(aiResult), 86400);
  }

  // 3. Save user-owned Review in MongoDB
  const review = await Review.create({
    user: userId,
    language,
    code,
    codeHash,
    ...extractAiFields(aiResult),
    fromCache,
  });

  // Update topic progress & streak
  await Promise.all([
    aiResult.concepts?.length > 0
      ? updateTopicProgress(userId, aiResult.concepts).catch((err) =>
          console.error('Topic progress update error:', err.message)
        )
      : Promise.resolve(),
    updateUserStreak(userId).catch((err) => console.error('Streak update error:', err.message)),
  ]);

  res.status(201).json({ success: true, data: review });
});

/**
 * @route   POST /api/reviews/stream
 * @desc    Submit code and stream review via Server-Sent Events (SSE)
 * @access  Private (student)
 */
const streamReview = asyncHandler(async (req, res) => {
  const parsed = reviewSubmitSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.errors.map((e) => e.message).join(', ');
    return res.status(400).json({ success: false, message });
  }

  const { language, code } = parsed.data;
  const userId = req.user._id;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    if (event === 'status') {
      res.write(`event: progress\ndata: ${JSON.stringify(data)}\n\n`);
    }
  };

  try {
    sendEvent('status', { step: 1, message: 'Checking review cache...' });
    const codeHash = generateCodeHash(code, language);

    // 1. User's own prior review
    const existingUserReview = await Review.findOne({ user: userId, codeHash }).lean();
    if (existingUserReview) {
      sendEvent('status', { step: 2, message: 'Review retrieved from your history' });
      const reviewId = existingUserReview._id.toString();
      sendEvent('complete', { ...existingUserReview, reviewId, _id: reviewId, fromCache: true });
      return res.end();
    }

    // 2. Shared Redis AI analysis cache
    const cachedAi = await getReviewCache(codeHash);
    let aiResult = cachedAi ? extractAiFields(cachedAi) : null;
    const fromCache = !!aiResult;

    if (!aiResult) {
      await checkQuotaGuard(userId);
      sendEvent('status', { step: 2, message: 'Analyzing code structure and identifying bugs...' });
      aiResult = await aiReviewCode(code, language);
      await setReviewCache(codeHash, extractAiFields(aiResult), 86400);
    }

    sendEvent('status', { step: 3, message: 'Saving review results...' });

    const review = await Review.create({
      user: userId,
      language,
      code,
      codeHash,
      ...extractAiFields(aiResult),
      fromCache,
    });

    await Promise.all([
      aiResult.concepts?.length > 0
        ? updateTopicProgress(userId, aiResult.concepts).catch((err) =>
            console.error('Topic progress update error:', err.message)
          )
        : Promise.resolve(),
      updateUserStreak(userId).catch((err) => console.error('Streak update error:', err.message)),
    ]);

    const reviewObj = review.toObject();
    const reviewId = review._id.toString();
    sendEvent('complete', { ...reviewObj, reviewId, _id: reviewId });
    res.end();
  } catch (err) {
    console.error('Error during review stream:', err.message);
    sendEvent('error', { message: err.message || 'Review failed' });
    res.end();
  }
});

/**
 * @route   GET /api/reviews
 * @desc    Get all reviews for the authenticated student
 * @access  Private (student)
 */
const ALLOWED_SORTS = new Set(['-createdAt', 'createdAt', '-score', 'score']);

const getReviews = asyncHandler(async (req, res) => {
  const { language, minScore, maxScore, sort = '-createdAt', page = 1, limit = 10 } = req.query;

  const filter = { user: req.user._id };
  if (language) filter.language = language;
  if ((minScore !== undefined && minScore !== '') || (maxScore !== undefined && maxScore !== '')) {
    filter.score = {};
    if (minScore !== undefined && minScore !== '' && !Number.isNaN(Number(minScore))) {
      filter.score.$gte = Number(minScore);
    }
    if (maxScore !== undefined && maxScore !== '' && !Number.isNaN(Number(maxScore))) {
      filter.score.$lte = Number(maxScore);
    }
    if (Object.keys(filter.score).length === 0) delete filter.score;
  }

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const safeSort = ALLOWED_SORTS.has(sort) ? sort : '-createdAt';
  const skip = (safePage - 1) * safeLimit;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .select('-code -bugs.solution')
      .sort(safeSort)
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Review.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      reviews,
      pagination: {
        total,
        page: safePage,
        pages: Math.ceil(total / safeLimit),
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
  const review = await Review.findById(req.params.id).lean();

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
  const { title, summary, notes, isBookmarked } = req.body;
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  if (review.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  if (title !== undefined) review.title = String(title).trim();
  if (summary !== undefined) review.summary = summary;
  if (notes !== undefined) review.notes = notes;
  if (isBookmarked !== undefined) review.isBookmarked = isBookmarked;

  await review.save();

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
