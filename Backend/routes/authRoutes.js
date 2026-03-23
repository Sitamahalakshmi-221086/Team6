const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/verify-otp
router.post('/verify-otp', authController.verifyOtp);

// POST /api/auth/resend-otp
router.post('/resend-otp', authController.resendOtp);

module.exports = router;
