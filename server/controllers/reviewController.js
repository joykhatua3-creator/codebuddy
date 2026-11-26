const Review = require('../models/Review');
const TopicProgress = require('../models/TopicProgress');
const User = require('../models/User');
const { reviewCode: aiReviewCode } = require('../services/aiService');
const { validateCodeInput } = require('../services/codeAnalyzer');
const { generateCodeHash, asyncHandler } = require('../utils/helpers');
const {
  getReviewCache,
  setReviewCache,
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
  improvedCode: source.improvedCode || '',
  improvementNotes: source.improvementNotes || [],
  isFallback: Boolean(source.isFallback),
  fallbackReason: source.fallbackReason || '',
  analysisVersion: 2,
});

/**
 * Shared review resolution flow for both standard POST and SSE stream endpoints.
 */
const resolveAndSaveReview = async ({ userId, language, code, assignmentId = null, onStatus }) => {
  const codeHash = generateCodeHash(code, language);

  let validAssignmentId = null;
  if (assignmentId) {
    const Assignment = require('../models/Assignment');
    const assignmentDoc = await Assignment.findById(assignmentId).select('_id isDemo').lean();
    if (assignmentDoc) {
      validAssignmentId = assignmentDoc._id;
    }
  }

  // 1. Check existing user review (ignore stale v1 or fallback-only entries; allow distinct assignment submissions)
  const existingUserReview = await Review.findOne({
    user: userId,
    codeHash,
    ...(validAssignmentId ? { assignment: validAssignmentId } : { assignment: null }),
  });
  if (existingUserReview && existingUserReview.analysisVersion >= 2 && !existingUserReview.isFallback) {
    onStatus?.({ step: 2, message: 'Review retrieved from your history' });
    return { review: { ...existingUserReview.toObject(), fromCache: true }, statusCode: 200 };
  }

  // 2. Check shared AI cache in Redis (only v2 non-fallback entries)
  const cachedAi = await getReviewCache(codeHash);
  let aiResult =
    cachedAi && cachedAi.analysisVersion >= 2 && !cachedAi.isFallback
      ? extractAiFields(cachedAi)
      : null;
  const fromCache = !!aiResult;

  if (!aiResult) {
    await checkQuotaGuard(userId);
    onStatus?.({ step: 2, message: 'Analyzing code syntax, logic, and bugs...' });
    aiResult = await aiReviewCode(code, language);
    if (!aiResult.isFallback) {
      await setReviewCache(codeHash, extractAiFields(aiResult), 86400);
    }
  }

  onStatus?.({ step: 3, message: 'Saving review results...' });

  const fields = {
    ...extractAiFields(aiResult),
    fromCache,
    ...(validAssignmentId ? { assignment: validAssignmentId } : {}),
  };

  const shouldUpdateProgress = !existingUserReview || (existingUserReview.analysisVersion || 1) < 2;

  let review;
  if (existingUserReview) {
    Object.assign(existingUserReview, fields);
    review = await existingUserReview.save();
  } else {
    review = await Review.create({
      user: userId,
      language,
      code,
      codeHash,
      ...fields,
    });
  }

  if (shouldUpdateProgress) {
    await Promise.all([
      aiResult.concepts?.length > 0
        ? updateTopicProgress(userId, aiResult.concepts).catch((err) =>
            console.error('Topic progress update error:', err.message)
          )
        : Promise.resolve(),
      updateUserStreak(userId).catch((err) => console.error('Streak update error:', err.message)),
    ]);
  }

  return { review: review.toObject(), statusCode: existingUserReview ? 200 : 201 };
};

/**
 * @route   POST /api/reviews
 * @desc    Submit code for AI review (with Upstash Redis cache & quota guard)
 * @access  Private (student)
 */
const submitReview = asyncHandler(async (req, res) => {
  const { language, code, assignmentId } = req.validatedData;
  const check = validateCodeInput(code, language);
  if (!check.valid) {
    return res.status(400).json({ success: false, message: check.reason });
  }

  const { review, statusCode } = await resolveAndSaveReview({
    userId: req.user._id,
    language,
    code,
    assignmentId,
  });

  res.status(statusCode).json({ success: true, data: review });
});

/**
 * @route   POST /api/reviews/stream
 * @desc    Submit code and stream review via Server-Sent Events (SSE)
 * @access  Private (student)
 */
const streamReview = asyncHandler(async (req, res) => {
  const parsed = reviewSubmitSchema.safeParse(req.body || {});
  if (!parsed.success) {
    const message = parsed.error.errors.map((e) => e.message).join(', ');
    return res.status(400).json({ success: false, message });
  }

  const { language, code, assignmentId } = parsed.data;
  const check = validateCodeInput(code, language);
  if (!check.valid) {
    return res.status(400).json({ success: false, message: check.reason });
  }

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
    sendEvent('status', { step: 1, message: 'Validating code & checking review cache...' });

    const { review } = await resolveAndSaveReview({
      userId,
      language,
      code,
      assignmentId,
      onStatus: (statusData) => sendEvent('status', statusData),
    });

    const reviewId = review._id.toString();
    sendEvent('complete', { ...review, reviewId, _id: reviewId });
    res.end();
  } catch (err) {
    console.error('Error during review stream:', err.message);
    sendEvent('error', { message: err.message || 'Review failed' });
    res.end();
  }
});

/**
 * @route   POST /api/reviews/:id/retry
 * @desc    Retry an existing review directly with Gemini AI (bypassing cache)
 * @access  Private (owner only)
 */
const retryReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }
  if (review.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  await checkQuotaGuard(req.user._id);
  const aiResult = await aiReviewCode(review.code, review.language);

  Object.assign(review, {
    ...extractAiFields(aiResult),
    fromCache: false,
  });
  await review.save();

  if (!aiResult.isFallback) {
    await setReviewCache(review.codeHash, extractAiFields(aiResult), 86400);
  }

  res.json({ success: true, data: review });
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

  // Isolate demo teacher from viewing real registered students' reviews by ID
  if (
    req.user.role === 'teacher' &&
    (req.user.isDemo || req.user.email === 'teacher@crbuddy.com') &&
    review.user.toString() !== req.user._id.toString()
  ) {
    const owner = await User.findById(review.user).select('isDemo email').lean();
    if (!owner || (!owner.isDemo && owner.email !== 'student@crbuddy.com')) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this review' });
    }
  }

  res.json({ success: true, data: review });
});

/**
 * @route   PATCH /api/reviews/:id
 * @desc    Update review (title, notes)
 * @access  Private (owner only)
 */
const updateReview = asyncHandler(async (req, res) => {
  const { title, notes, isBookmarked } = req.validatedData;
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  if (review.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  if (title !== undefined) review.title = title;
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
  retryReview,
  getReviews,
  getReview,
  updateReview,
  deleteReview,
  toggleBookmark,
};
