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
  getOAuthProviders,
  oauthGoogleStart,
  oauthGoogleCallback,
  oauthGithubStart,
  oauthGithubCallback,
  oauthFirebaseLogin,
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
router.get('/oauth/providers', getOAuthProviders);
router.get('/oauth/google', oauthGoogleStart);
router.get('/oauth/google/callback', oauthGoogleCallback);
router.get('/oauth/github', oauthGithubStart);
router.get('/oauth/github/callback', oauthGithubCallback);
router.post('/oauth/firebase', oauthFirebaseLogin);
router.get('/me', protect, getMe);
router.patch('/me', protect, validate(updateProfileSchema), updateProfile);
router.patch('/password', protect, validate(updatePasswordSchema), updatePassword);
router.delete('/me', protect, deleteAccount);

module.exports = router;
