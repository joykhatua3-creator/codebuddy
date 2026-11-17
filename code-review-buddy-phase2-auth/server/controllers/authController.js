const User = require('../models/User');
const { signToken } = require('../utils/token');

// POST /api/auth/register  — public sign-up always creates a STUDENT
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'That email is already registered',
        errors: { email: 'That email is already registered' },
      });
    }

    // role is deliberately NOT read from the request body (prevents self-promotion to teacher)
    const user = await User.create({ name, email, password, role: 'student' });

    res.status(201).json({ success: true, token: signToken(user), user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    const ok = user && (await user.comparePassword(password));

    // Same message for unknown email and wrong password, so emails can't be probed
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    res.json({ success: true, token: signToken(user), user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.me = (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
};
