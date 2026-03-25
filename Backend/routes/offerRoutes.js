const express = require('express');
const router = express.Router();
const {
  sendOfferEmails,
  acceptOffer,
  rejectOffer,
  getStudentOffers
} = require('../controllers/offerController');

// POST /api/offers/send - Send offer emails to shortlisted students
router.post('/send', sendOfferEmails);

// PUT /api/offers/accept/:applicationId - Student accepts offer
router.put('/accept/:applicationId', acceptOffer);

// PUT /api/offers/reject/:applicationId - Student rejects offer
router.put('/reject/:applicationId', rejectOffer);

// GET /api/offers/student/:studentId - Get offers for a student
router.get('/student/:studentId', getStudentOffers);

module.exports = router;