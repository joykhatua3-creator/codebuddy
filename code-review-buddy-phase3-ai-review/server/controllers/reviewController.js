const Review = require('../models/Review');
const { analyzeCode } = require('../services/geminiService');
const { hashCode } = require('../utils/hash');

// POST /api/reviews
exports.createReview = async (req, res, next) => {
  try {
    const { language, code } = req.body;
    const codeHash = hashCode(language, code);

    // Cache: if anyone already reviewed this exact code, reuse that analysis (no AI call).
    // Only the analysis is reused, never the other student's identity or review record.
    const cached = await Review.findOne({ codeHash, language }).select('result').lean();

    let result = cached?.result;
    if (!result) result = await analyzeCode(language, code);

    const review = await Review.create({
      user: req.user._id,
      language,
      code,
      codeHash,
      result,
      fromCache: !!cached,
    });

    res.status(201).json({ success: true, review });
  } catch (err) {
    next(err);
  }
};

// GET /api/reviews?page=1&limit=10
exports.listReviews = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const filter = { user: req.user._id };
    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-code -codeHash') // list view doesn't need the source
        .lean(),
      Review.countDocuments(filter),
    ]);

    res.json({ success: true, reviews, page, pages: Math.ceil(total / limit), total });
  } catch (err) {
    next(err);
  }
};

// GET /api/reviews/:id   (only the owner can read it)
exports.getReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, user: req.user._id }).lean();
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, review });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/reviews/:id
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    next(err);
  }
};
