const express = require('express');
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createReviewSchema } = require('../validators/reviewValidators');

const router = express.Router();

// AI calls cost money and quota: 10 per minute per logged-in user
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => String(req.user._id), // runs after protect
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  message: { success: false, message: 'You are sending reviews too fast. Wait a minute and try again.' },
});

router.use(protect);

router.post('/', aiLimiter, validate(createReviewSchema), ctrl.createReview);
router.get('/', ctrl.listReviews);
router.get('/:id', ctrl.getReview);
router.delete('/:id', ctrl.deleteReview);

module.exports = router;
