const express = require('express');
const router = express.Router();
const {
  createAssignment,
  getAssignments,
  getAssignmentSubmissions,
  deleteAssignment,
} = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/auth');
const { validate, createAssignmentSchema } = require('../validators/schemas');

router.use(protect);

router.get('/', authorize('student', 'teacher'), getAssignments);
router.post('/', authorize('teacher'), validate(createAssignmentSchema), createAssignment);
router.get('/:id/submissions', authorize('teacher'), getAssignmentSubmissions);
router.delete('/:id', authorize('teacher'), deleteAssignment);

module.exports = router;
