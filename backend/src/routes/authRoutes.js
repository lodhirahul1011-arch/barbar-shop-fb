
const router = require('express').Router();
const {
  signup,
  login,
  me,
  logout,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/register', signup);
router.post('/login', login);
router.get('/me', authMiddleware, me);
router.post('/logout', authMiddleware, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
