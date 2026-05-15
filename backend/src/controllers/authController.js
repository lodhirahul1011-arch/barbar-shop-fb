
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getJwtSecret = () => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }
  return 'barberflow-dev-secret-change-me';
};

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const getResetSecret = () => process.env.JWT_RAW_SECRET || getJwtSecret();

const sendAuthResponse = (res, status, user, message) => {
  const token = signToken(user);

  return res.status(status).json({
    message,
    msg: message,
    token,
    user: user.toAuthJSON(),
  });
};

exports.signup = async (req, res) => {
  try {
    const { name, fullName, email, password, role, phone } = req.body;
    const displayName = (fullName || name || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!displayName || !normalizedEmail || !password) {
      return res.status(422).json({
        message: 'Name, email and password are required',
        msg: 'Name, email and password are required',
      });
    }

    if (String(password).length < 6) {
      return res.status(422).json({
        message: 'Password must be at least 6 characters',
        msg: 'Password must be at least 6 characters',
      });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        message: 'User already exists',
        msg: 'User already exists',
      });
    }

    const safeRole = ['customer', 'owner', 'admin'].includes(role) ? role : 'customer';
    const user = await User.create({
      name: displayName,
      fullName: displayName,
      email: normalizedEmail,
      password,
      role: safeRole,
      phone,
    });

    return sendAuthResponse(res, 201, user, 'Signup successful');
  } catch (err) {
    return res.status(500).json({ message: err.message, msg: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(422).json({
        message: 'Email and password are required',
        msg: 'Email and password are required',
      });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials',
        msg: 'Invalid credentials',
      });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({
        message: 'Invalid credentials',
        msg: 'Invalid credentials',
      });
    }

    return sendAuthResponse(res, 200, user, 'Login successful');
  } catch (err) {
    return res.status(500).json({ message: err.message, msg: err.message });
  }
};

exports.me = async (req, res) => {
  return res.json({
    message: 'Current logged-in user',
    msg: 'Current logged-in user',
    user: req.user.toAuthJSON ? req.user.toAuthJSON() : req.user,
  });
};

exports.logout = async (req, res) => {
  return res.json({
    message: 'Logout successful',
    msg: 'Logout successful',
  });
};

exports.forgotPassword = async (req, res) => {
  try {
    const normalizedEmail = String(req.body.email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      return res.status(422).json({
        message: 'Email is required',
        msg: 'Email is required',
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.json({
        message: 'If the email exists, a reset link will be generated',
        msg: 'If the email exists, a reset link will be generated',
      });
    }

    const token = jwt.sign({ id: user._id }, getResetSecret(), { expiresIn: '30m' });
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;
    const response = {
      message: 'Reset link generated',
      msg: 'Reset link generated',
    };

    if (process.env.NODE_ENV !== 'production') {
      response.resetLink = resetLink;
    }

    return res.json(response);
  } catch (err) {
    return res.status(500).json({ message: err.message, msg: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const token = req.body.token || req.params.token;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(422).json({
        message: 'Token and password are required',
        msg: 'Token and password are required',
      });
    }

    if (String(password).length < 6) {
      return res.status(422).json({
        message: 'Password must be at least 6 characters',
        msg: 'Password must be at least 6 characters',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, getResetSecret());
    } catch {
      return res.status(400).json({
        message: 'Invalid or expired reset token',
        msg: 'Invalid or expired reset token',
      });
    }

    const user = await User.findById(decoded.id).select('+password');
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        msg: 'User not found',
      });
    }

    user.password = password;
    await user.save();

    return res.json({
      message: 'Password updated successfully',
      msg: 'Password updated successfully',
    });
  } catch (err) {
    return res.status(500).json({ message: err.message, msg: err.message });
  }
};
