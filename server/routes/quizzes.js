const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  generateQuiz,
  submitQuiz,
  getQuizzes,
  getQuizById,
  deleteQuiz,
} = require('../controllers/quizController');
const { protect, authorize } = require('../middleware/auth');
const { validate, quizSubmitSchema } = require('../validators/schemas');

const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 100 : 30,
  skip: () => process.env.NODE_ENV === 'development',
  message: { success: false, message: 'Too many AI requests. Please wait a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(protect);

router.post('/generate', authorize('student'), aiRateLimit, generateQuiz);
router.get('/', authorize('student'), getQuizzes);
router.get('/:id', authorize('student', 'teacher'), getQuizById);
router.post('/:id/submit', authorize('student'), validate(quizSubmitSchema), submitQuiz);
router.delete('/:id', authorize('student'), deleteQuiz);

module.exports = router;
