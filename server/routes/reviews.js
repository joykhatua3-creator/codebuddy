const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { submitReview, getReviews, getReview, deleteReview, toggleBookmark } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');
const { validate, reviewSubmitSchema } = require('../validators/schemas');

// AI rate limit: 10 requests per minute
const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many AI requests. Please wait a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(protect);
router.use(authorize('student'));

router.post('/', aiRateLimit, validate(reviewSubmitSchema), submitReview);
router.get('/', getReviews);
router.get('/:id', getReview);
router.delete('/:id', deleteReview);
router.patch('/:id/bookmark', toggleBookmark);

module.exports = router;
