const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  submitReview,
  streamReview,
  getReviews,
  getReview,
  updateReview,
  deleteReview,
  toggleBookmark,
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');
const { validate, reviewSubmitSchema } = require('../validators/schemas');

// AI rate limit: 10 requests per minute
const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 100 : 30,
  skip: () => process.env.NODE_ENV === 'development',
  message: { success: false, message: 'Too many AI requests. Please wait a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(protect);

router.post('/', authorize('student'), aiRateLimit, validate(reviewSubmitSchema), submitReview);
router.post('/stream', authorize('student'), aiRateLimit, streamReview);
router.get('/', authorize('student'), getReviews);
router.get('/:id', authorize('student', 'teacher'), getReview);
router.patch('/:id', authorize('student'), updateReview);
router.delete('/:id', authorize('student'), deleteReview);
router.patch('/:id/bookmark', authorize('student'), toggleBookmark);

module.exports = router;
