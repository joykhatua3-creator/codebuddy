const express = require('express');
const router = express.Router();
const {
  register,
  login,
  demoLogin,
  logout,
  getMe,
  updateProfile,
  updatePassword,
  deleteAccount,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  validate,
  registerSchema,
  loginSchema,
  demoLoginSchema,
  updateProfileSchema,
  updatePasswordSchema,
} = require('../validators/schemas');

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/demo', validate(demoLoginSchema), demoLogin);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.patch('/me', protect, validate(updateProfileSchema), updateProfile);
router.patch('/password', protect, validate(updatePasswordSchema), updatePassword);
router.delete('/me', protect, deleteAccount);

module.exports = router;
