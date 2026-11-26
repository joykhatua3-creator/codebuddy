const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentProgress,
  exportStudentsCsv,
  addReviewFeedback,
} = require('../controllers/teacherController');
const { protect, authorize } = require('../middleware/auth');
const { validate, teacherFeedbackSchema } = require('../validators/schemas');

router.use(protect);
router.use(authorize('teacher'));

router.get('/students', getStudents);
router.get('/students/export', exportStudentsCsv);
router.get('/students/:id/progress', getStudentProgress);
router.patch('/reviews/:id/feedback', validate(teacherFeedbackSchema), addReviewFeedback);

module.exports = router;
