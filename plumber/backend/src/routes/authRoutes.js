const express = require('express');
const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  resetPasswordByToken,
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.route('/reset-password/:token')
  .post(resetPasswordByToken)
  .put(resetPasswordByToken);

module.exports = router;
