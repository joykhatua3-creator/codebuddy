const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { generateQuiz, submitQuiz, getQuizzes } = require('../controllers/quizController');
const { protect, authorize } = require('../middleware/auth');
const { validate, quizSubmitSchema } = require('../validators/schemas');

const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many AI requests. Please wait a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(protect);
router.use(authorize('student'));

router.post('/generate', aiRateLimit, generateQuiz);
router.post('/:id/submit', validate(quizSubmitSchema), submitQuiz);
router.get('/', getQuizzes);

module.exports = router;
