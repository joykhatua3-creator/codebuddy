const express = require('express');
const router = express.Router();
const { getStudents, getStudentProgress } = require('../controllers/teacherController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('teacher'));

router.get('/students', getStudents);
router.get('/students/:id/progress', getStudentProgress);

module.exports = router;
