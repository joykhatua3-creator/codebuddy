const User = require('../models/User');
const { generateToken, asyncHandler } = require('../utils/helpers');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (student or teacher)
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.validatedData;

  // Check for existing email
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }

  // Create user (password hashed in pre-save hook)
  const user = await User.create({ name, email, password, role });

  const token = generateToken(user._id);

  res.status(201).json({
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
});

/**
 * @route   POST /api/auth/login
 * @desc    Login with email and password
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validatedData;

  // Find user and explicitly include password
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  // Update streak
  user.updateStreak();
  await user.save();

  const token = generateToken(user._id);

  res.json({
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

module.exports = { register, login, getMe };
