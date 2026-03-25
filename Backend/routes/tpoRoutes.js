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
  shortlistStudentsForDrive,
  sendShortlistEmails,
  getCompanyRequests,
  // Added/replaced from integration guide
  getScrapedJobs,
  saveScrapedJobs,
  publishJobToStudents,
  publishAllNewJobs,
  getPublishedJobs,
  getJobApplicantsTpo,
  sendDriveRequestWithStudents,
  getTPONotificationsFull,
  markTPONotificationRead,
  shareDriveToStudents
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

// ── INTEGRATION GUIDE ROUTES ──
// Stage 1
router.get('/scraped-jobs', getScrapedJobs);
router.post('/save-scraped-jobs', saveScrapedJobs);

// Stage 2
router.post('/publish-job/:scrapedJobId', publishJobToStudents);
router.post('/publish-all-jobs', publishAllNewJobs);

// Stage 3
router.get('/job-applications/:openJobId', getJobApplicantsTpo);

// Stage 5
router.post('/send-drive-request', sendDriveRequestWithStudents);

// Stage 7
router.get('/notifications', getTPONotificationsFull);
router.patch('/notifications/:id/read', markTPONotificationRead);

// Stage 8
router.post('/share-drive-to-students', shareDriveToStudents);

// Legacy/other
router.get('/shortlisted-drives', getCompanyRequests);
router.post('/shortlist/:driveId', shortlistStudentsForDrive);
router.post('/shortlist/:driveId/notify', sendShortlistEmails);

module.exports = router;
