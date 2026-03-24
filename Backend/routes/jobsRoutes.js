const express = require('express');
const router = express.Router();
const { getApprovedJobsForStudents, getJobsByCompany } = require('../controllers/jobsController');
const { postJob } = require('../controllers/companyController');

router.get('/', getApprovedJobsForStudents);
router.get('/company/:companyId', getJobsByCompany);
router.post('/create', postJob);

module.exports = router;
