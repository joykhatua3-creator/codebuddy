const express = require('express');
const router = express.Router();
const { getProgress } = require('../controllers/progressController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('student'));

router.get('/', getProgress);

module.exports = router;
