const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { generateRoadmap, getRoadmap, updateStep, deleteRoadmap } = require('../controllers/roadmapController');
const { protect, authorize } = require('../middleware/auth');

const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many AI requests. Please wait a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(protect);
router.use(authorize('student'));

router.post('/generate', aiRateLimit, generateRoadmap);
router.get('/', getRoadmap);
router.patch('/steps/:stepId', updateStep);
router.delete('/', deleteRoadmap);

module.exports = router;
