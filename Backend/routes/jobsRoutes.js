const express = require('express');
const router = express.Router();
const { getApprovedJobsForStudents } = require('../controllers/jobsController');
const { postJob } = require('../controllers/companyController');

router.get('/', getApprovedJobsForStudents);
router.post('/create', postJob);

module.exports = router;
