const express = require('express');
const router = express.Router();
const {
  scheduleInterview,
  getCompanyInterviews,
  getStudentInterviews,
  updateInterviewStatus,
  confirmInterview,
  cancelInterview,
  getAvailableSlots
} = require('../controllers/interviewController');

// POST /api/interviews/schedule - Schedule new interview
router.post('/schedule', scheduleInterview);

// GET /api/interviews/company/:companyId - Get interviews for company
router.get('/company/:companyId', getCompanyInterviews);

// GET /api/interviews/student/:studentId - Get interviews for student
router.get('/student/:studentId', getStudentInterviews);

// PUT /api/interviews/:interviewId/status - Update interview status
router.put('/:interviewId/status', updateInterviewStatus);

// PUT /api/interviews/:interviewId/confirm - Student confirms interview
router.put('/:interviewId/confirm', confirmInterview);

// PUT /api/interviews/:interviewId/cancel - Cancel interview
router.put('/:interviewId/cancel', cancelInterview);

// GET /api/interviews/available-slots - Get available time slots
router.get('/available-slots', getAvailableSlots);

module.exports = router;