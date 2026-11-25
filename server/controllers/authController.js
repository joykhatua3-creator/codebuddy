const User = require('../models/User');
const { generateToken, asyncHandler } = require('../utils/helpers');

const DEMO_ACCOUNTS = {
  student: {
    name: 'Ali Hassan',
    email: 'student@crbuddy.com',
    password: 'Student@123',
    role: 'student',
  },
  teacher: {
    name: 'Dr. Sarah Ahmed',
    email: 'teacher@crbuddy.com',
    password: 'Teacher@123',
    role: 'teacher',
  },
};

const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
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
const demoLogin = asyncHandler(async (req, res) => {
  const { role } = req.validatedData;
  const account = DEMO_ACCOUNTS[role];

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
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    sameSite: 'lax',
  });
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
  const { name } = req.body;
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
  }

  const user = await User.findById(req.user._id);
  user.name = name.trim();
  await user.save();

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
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
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
  }

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }

  user.password = newPassword;
  await user.save();

  const token = generateToken(user._id);
  setAuthCookie(res, token);

  res.json({ success: true, message: 'Password updated successfully' });
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

  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.json({ success: true, message: 'Account and associated learning data deleted successfully' });
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
};
