const User = require('../models/User');
const { generateToken, asyncHandler } = require('../utils/helpers');

const DEMO_ACCOUNTS = {
  student: {
    name: 'Ali Hassan',
    email: 'student@crbuddy.com',
    password: 'Student@123',
    role: 'student',
    isDemo: true,
  },
  teacher: {
    name: 'Dr. Sarah Ahmed',
    email: 'teacher@crbuddy.com',
    password: 'Teacher@123',
    role: 'teacher',
    isDemo: true,
  },
};

const getCookieOptions = (maxAge = 7 * 24 * 60 * 60 * 1000) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge,
});

const setAuthCookie = (res, token) => {
  res.cookie('token', token, getCookieOptions());
};

const clearAuthCookie = (res) => {
  res.cookie('token', '', { ...getCookieOptions(0), expires: new Date(0) });
};

const sendAuthResponse = (res, user, statusCode = 200) => {
  const token = generateToken(user._id);
  setAuthCookie(res, token);

  return res.status(statusCode).json({
    success: true,
    data: {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isDemo: Boolean(user.isDemo),
        streak: user.streak,
        createdAt: user.createdAt,
      },
    },
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (student or teacher)
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.validatedData;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }

  const user = await User.create({ name, email, password, role });
  sendAuthResponse(res, user, 201);
});

/**
 * @route   POST /api/auth/login
 * @desc    Login with email and password
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validatedData;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  if (!user.password) {
    return res.status(401).json({
      success: false,
      message: `This account uses ${user.oauthProvider || 'OAuth'} sign-in. Please continue with OAuth.`,
    });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  user.updateStreak();
  await user.save();

  sendAuthResponse(res, user);
});

/**
 * @route   POST /api/auth/demo
 * @desc    One-click demo login for student or teacher role
 * @access  Public
 */
const ensureDemoUser = async (account) => {
  let user = await User.findOne({ email: account.email });
  if (!user) {
    try {
      user = await User.create(account);
    } catch (err) {
      if (err.code === 11000) {
        user = await User.findOne({ email: account.email });
      } else {
        throw err;
      }
    }
  } else if (!user.isDemo) {
    user.isDemo = true;
    await user.save();
  }
  return user;
};

const demoLogin = asyncHandler(async (req, res) => {
  const { role } = req.validatedData;
  const account = DEMO_ACCOUNTS[role];

  const user = await ensureDemoUser(account);

  // Ensure demo teacher always has the seeded demo student in their isolated cohort
  if (role === 'teacher') {
    await ensureDemoUser(DEMO_ACCOUNTS.student).catch(() => {});
  }

  user.updateStreak();
  await user.save();

  sendAuthResponse(res, user);
});

/**
 * @route   POST /api/auth/logout
 * @desc    Clear httpOnly auth cookie
 * @access  Public
 */
const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isDemo: Boolean(user.isDemo),
      streak: user.streak,
      lastActiveDate: user.lastActiveDate,
      createdAt: user.createdAt,
    },
  });
});

/**
 * @route   PATCH /api/auth/me
 * @desc    Update user profile name
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.validatedData;

  const user = await User.findById(req.user._id);
  user.name = name;
  await user.save();

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isDemo: Boolean(user.isDemo),
      streak: user.streak,
    },
  });
});

/**
 * @route   PATCH /api/auth/password
 * @desc    Update password with current password verification
 * @access  Private
 */
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.validatedData;

  const user = await User.findById(req.user._id).select('+password');
  if (!user.password) {
    return res.status(400).json({
      success: false,
      message: 'OAuth-only accounts cannot change password without an existing password',
    });
  }
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }

  user.password = newPassword;
  await user.save();

  const token = generateToken(user._id);
  setAuthCookie(res, token);

  res.json({ success: true, message: 'Password updated successfully', data: { token } });
});

/**
 * @route   DELETE /api/auth/me
 * @desc    Delete user account and cascade delete associated data
 * @access  Private
 */
const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const Review = require('../models/Review');
  const TopicProgress = require('../models/TopicProgress');
  const Quiz = require('../models/Quiz');
  const Roadmap = require('../models/Roadmap');

  await Promise.all([
    Review.deleteMany({ user: userId }),
    TopicProgress.deleteMany({ user: userId }),
    Quiz.deleteMany({ user: userId }),
    Roadmap.deleteMany({ user: userId }),
    User.findByIdAndDelete(userId),
  ]);

  clearAuthCookie(res);
  res.json({ success: true, message: 'Account and associated learning data deleted successfully' });
});

const jwt = require('jsonwebtoken');

const isGoogleOAuthEnabled = () =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const isGithubOAuthEnabled = () =>
  Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
const isFirebaseOAuthEnabled = () =>
  Boolean(process.env.FIREBASE_API_KEY && process.env.FIREBASE_PROJECT_ID);

const resolveBackendBaseUrl = (req) => {
  if (process.env.BACKEND_URL) return process.env.BACKEND_URL.replace(/\/+$/, '');
  return `${req.protocol}://${req.get('host')}`;
};

const resolveClientBaseUrl = (requestedRedirect) => {
  const configured = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  if (requestedRedirect) {
    const clean = requestedRedirect.replace(/\/+$/, '');
    if (
      configured.includes(clean) ||
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(clean) ||
      /\.vercel\.app$/.test(clean)
    ) {
      return clean;
    }
  }
  return configured[0] || 'http://localhost:5173';
};

const upsertOAuthUser = async ({ email, name, provider, oauthId, role = 'student' }) => {
  const normalizedEmail = String(email).toLowerCase().trim();
  let user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    user = await User.create({
      name: (name || normalizedEmail.split('@')[0] || 'User').slice(0, 50),
      email: normalizedEmail,
      role: role === 'teacher' ? 'teacher' : 'student',
      oauthProvider: provider,
      oauthId: String(oauthId || ''),
    });
  } else {
    if (!user.oauthProvider) {
      user.oauthProvider = provider;
      user.oauthId = String(oauthId || '');
    }
    user.updateStreak();
    await user.save();
  }
  return user;
};

/**
 * @route   GET /api/auth/oauth/providers
 * @desc    Check which optional OAuth sign-in providers are configured
 * @access  Public
 */
const getOAuthProviders = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      google: isGoogleOAuthEnabled(),
      github: isGithubOAuthEnabled(),
      firebase: isFirebaseOAuthEnabled(),
    },
  });
});

/**
 * @route   GET /api/auth/oauth/google
 * @desc    Redirect user to Google OAuth consent screen
 * @access  Public
 */
const oauthGoogleStart = asyncHandler(async (req, res) => {
  if (!isGoogleOAuthEnabled()) {
    return res.status(501).json({ success: false, message: 'Google OAuth is not configured on the server' });
  }
  const clientUrl = resolveClientBaseUrl(req.query.redirectOrigin);
  const role = req.query.role === 'teacher' ? 'teacher' : 'student';
  const state = jwt.sign({ role, clientUrl, nonce: Date.now() }, process.env.JWT_SECRET, { expiresIn: '10m' });
  const redirectUri = `${resolveBackendBaseUrl(req)}/api/auth/oauth/google/callback`;

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

const oauthGoogleCallback = asyncHandler(async (req, res) => {
  if (!isGoogleOAuthEnabled()) {
    return res.status(501).json({ success: false, message: 'Google OAuth is not configured' });
  }

  let statePayload = { role: 'student', clientUrl: resolveClientBaseUrl() };
  try {
    statePayload = jwt.verify(req.query.state, process.env.JWT_SECRET);
  } catch {
    return res.redirect(`${resolveClientBaseUrl()}/login?oauthError=invalid_state`);
  }

  const clientUrl = resolveClientBaseUrl(statePayload.clientUrl);
  if (req.query.error || !req.query.code) {
    return res.redirect(`${clientUrl}/login?oauthError=google_cancelled`);
  }

  const redirectUri = `${resolveBackendBaseUrl(req)}/api/auth/oauth/google/callback`;
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: String(req.query.code),
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok || !tokenJson.access_token) {
    return res.redirect(`${clientUrl}/login?oauthError=google_token_failed`);
  }

  const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const profile = await profileRes.json();
  if (!profileRes.ok || !profile.email) {
    return res.redirect(`${clientUrl}/login?oauthError=google_profile_failed`);
  }

  const user = await upsertOAuthUser({
    email: profile.email,
    name: profile.name,
    provider: 'google',
    oauthId: profile.sub,
    role: statePayload.role,
  });

  const token = generateToken(user._id);
  setAuthCookie(res, token);
  res.redirect(`${clientUrl}/login?oauthToken=${encodeURIComponent(token)}`);
});

/**
 * @route   GET /api/auth/oauth/github
 * @desc    Redirect user to GitHub OAuth consent screen
 * @access  Public
 */
const oauthGithubStart = asyncHandler(async (req, res) => {
  if (!isGithubOAuthEnabled()) {
    return res.status(501).json({ success: false, message: 'GitHub OAuth is not configured on the server' });
  }
  const clientUrl = resolveClientBaseUrl(req.query.redirectOrigin);
  const role = req.query.role === 'teacher' ? 'teacher' : 'student';
  const state = jwt.sign({ role, clientUrl, nonce: Date.now() }, process.env.JWT_SECRET, { expiresIn: '10m' });
  const redirectUri = `${resolveBackendBaseUrl(req)}/api/auth/oauth/github/callback`;

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'read:user user:email',
    state,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

const oauthGithubCallback = asyncHandler(async (req, res) => {
  if (!isGithubOAuthEnabled()) {
    return res.status(501).json({ success: false, message: 'GitHub OAuth is not configured' });
  }

  let statePayload = { role: 'student', clientUrl: resolveClientBaseUrl() };
  try {
    statePayload = jwt.verify(req.query.state, process.env.JWT_SECRET);
  } catch {
    return res.redirect(`${resolveClientBaseUrl()}/login?oauthError=invalid_state`);
  }

  const clientUrl = resolveClientBaseUrl(statePayload.clientUrl);
  if (req.query.error || !req.query.code) {
    return res.redirect(`${clientUrl}/login?oauthError=github_cancelled`);
  }

  const redirectUri = `${resolveBackendBaseUrl(req)}/api/auth/oauth/github/callback`;
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: String(req.query.code),
      redirect_uri: redirectUri,
    }),
  });
  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok || !tokenJson.access_token) {
    return res.redirect(`${clientUrl}/login?oauthError=github_token_failed`);
  }

  const headers = {
    Authorization: `Bearer ${tokenJson.access_token}`,
    'User-Agent': 'CodeReviewBuddy',
    Accept: 'application/vnd.github+json',
  };
  const [userRes, emailsRes] = await Promise.all([
    fetch('https://api.github.com/user', { headers }),
    fetch('https://api.github.com/user/emails', { headers }),
  ]);
  const ghUser = await userRes.json();
  const ghEmails = emailsRes.ok ? await emailsRes.json() : [];
  const primaryEmail =
    ghUser.email ||
    (Array.isArray(ghEmails) ? ghEmails.find((e) => e.primary && e.verified)?.email || ghEmails[0]?.email : null);

  if (!primaryEmail) {
    return res.redirect(`${clientUrl}/login?oauthError=github_email_unavailable`);
  }

  const user = await upsertOAuthUser({
    email: primaryEmail,
    name: ghUser.name || ghUser.login,
    provider: 'github',
    oauthId: ghUser.id,
    role: statePayload.role,
  });

  const token = generateToken(user._id);
  setAuthCookie(res, token);
  res.redirect(`${clientUrl}/login?oauthToken=${encodeURIComponent(token)}`);
});

/**
 * @route   POST /api/auth/oauth/firebase
 * @desc    Verify Firebase Auth ID token if Firebase env vars are configured
 * @access  Public
 */
const oauthFirebaseLogin = asyncHandler(async (req, res) => {
  if (!isFirebaseOAuthEnabled()) {
    return res.status(501).json({ success: false, message: 'Firebase Auth is not configured on the server' });
  }
  const { idToken, role } = req.body || {};
  if (!idToken || typeof idToken !== 'string') {
    return res.status(400).json({ success: false, message: 'Firebase idToken is required' });
  }

  const lookupRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(process.env.FIREBASE_API_KEY)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );
  const lookupJson = await lookupRes.json();
  const fbUser = lookupJson?.users?.[0];
  if (!lookupRes.ok || !fbUser?.email) {
    return res.status(401).json({ success: false, message: 'Invalid Firebase token' });
  }

  const user = await upsertOAuthUser({
    email: fbUser.email,
    name: fbUser.displayName,
    provider: 'firebase',
    oauthId: fbUser.localId,
    role: role === 'teacher' ? 'teacher' : 'student',
  });

  sendAuthResponse(res, user);
});

module.exports = {
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
};
