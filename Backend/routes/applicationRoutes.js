const express = require('express');
const router = express.Router();
const { applyToJob, getStudentApplications } = require('../controllers/applicationController');

router.post('/apply', applyToJob);
router.get('/student/:studentId', getStudentApplications);

module.exports = router;
