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
  updateTPOProfile,
  getTPOProfile,
  getPlacementRequests,
  getTPORequestsCount,
  approvePlacementRequest,
  rejectPlacementRequest,
  getTPOAnalytics,
  getTPODashboard,
  getTPONotices,
  getTPOStudentsDirectory,
  getTPOCompaniesDirectory,
  getTPOPlacementRecords,
  requestCompany,
  updateCompanyRequestStatus,
  sendDriveRequest,
  getScrapedJobs,
  saveScrapedJobs,
  shortlistStudentsForDrive,
  sendShortlistEmails,
  getTPONotifications,
  getCompanyRequests
} = require('../controllers/tpoController');

router.post('/signup', tpoSignup);
router.post('/login', tpoLogin);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.get('/profile/:id', getTPOProfile);
router.put('/profile/:id', updateTPOProfile);

router.get('/requests', getPlacementRequests);
router.get('/requests/count', getTPORequestsCount);
router.patch('/approve/:id', approvePlacementRequest);
router.patch('/reject/:id', rejectPlacementRequest);
router.get('/analytics', getTPOAnalytics);
router.get('/dashboard', getTPODashboard);
router.get('/notices', getTPONotices);
router.get('/students', getTPOStudentsDirectory);
router.get('/companies-list', getTPOCompaniesDirectory);
router.get('/placement-records', getTPOPlacementRecords);

router.post('/notices', postNotice);
router.get('/drives', getDrives);
router.post('/drives', scheduleDrive);
router.put('/drives/:id/approve', approveDrive);

// Company outreach / request flow
router.post('/request-company', requestCompany);
router.patch('/request-company/:id', updateCompanyRequestStatus);
router.post('/reminders', sendReminder);

// ── NEW: Placement Drive System Extensions ──
router.post('/send-drive-request', sendDriveRequest);
router.get('/scraped-jobs', getScrapedJobs);
router.post('/save-scraped-jobs', saveScrapedJobs);
router.get('/shortlisted-drives', getCompanyRequests);
router.post('/shortlist/:driveId', shortlistStudentsForDrive);
router.post('/shortlist/:driveId/notify', sendShortlistEmails);
router.get('/notifications', getTPONotifications);

module.exports = router;
