
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getJwtSecret = () => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }
  return 'barberflow-dev-secret-change-me';
};

module.exports = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      message: 'Authentication token missing',
      msg: 'Authentication token missing',
    });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: 'User not found for this token',
        msg: 'User not found for this token',
      });
    }

    req.auth = decoded;
    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({
      message: 'Invalid or expired token',
      msg: 'Invalid or expired token',
    });
  }
};
