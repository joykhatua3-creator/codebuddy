const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  generateRoadmap,
  getRoadmap,
  updateStep,
  resetRoadmapProgress,
  deleteRoadmap,
} = require('../controllers/roadmapController');
const { protect, authorize } = require('../middleware/auth');
const { validate, generateRoadmapSchema, updateRoadmapStepSchema } = require('../validators/schemas');

const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 100 : 30,
  skip: () => process.env.NODE_ENV === 'development',
  message: { success: false, message: 'Too many AI requests. Please wait a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(protect);
router.use(authorize('student'));

router.post('/generate', aiRateLimit, validate(generateRoadmapSchema), generateRoadmap);
router.get('/', getRoadmap);
router.patch('/steps/:stepId', validate(updateRoadmapStepSchema), updateStep);
router.patch('/:id/reset', resetRoadmapProgress);
router.delete('/:id', deleteRoadmap);
router.delete('/', deleteRoadmap);

module.exports = router;
