const express = require('express');
const router = express.Router();
const { 
  tpoSignup, 
  tpoLogin, 
  postNotice, 
  scheduleDrive, 
  approveDrive, 
  sendReminder, 
  getDrives,
  sendOTP,
  verifyOTP,
  updateTPOProfile 
} = require('../controllers/tpoController');

router.post('/signup', tpoSignup);
router.post('/login', tpoLogin);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.put('/profile/:id', updateTPOProfile);

router.post('/notices', postNotice);
router.get('/drives', getDrives);
router.post('/drives', scheduleDrive);
router.put('/drives/:id/approve', approveDrive);
router.post('/reminders', sendReminder);

module.exports = router;
