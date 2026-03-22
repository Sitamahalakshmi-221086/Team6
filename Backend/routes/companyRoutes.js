const express = require('express');
const router = express.Router();
const { 
  companySignup, 
  companyLogin, 
  updateCompanyProfile,
  postJob,
  getCompanyJobs,
  getJobApplications,
  updateApplicationStatus,
  getCompanyStats
} = require('../controllers/companyController');

// POST /api/companies/signup
router.post('/signup', companySignup);

// POST /api/companies/login
router.post('/login', companyLogin);

// PUT /api/companies/profile
router.put('/profile', updateCompanyProfile);

// GET /api/companies/stats/:companyId
router.get('/stats/:companyId', getCompanyStats);

// POST /api/companies/post-job
router.post('/post-job', postJob);

// GET /api/companies/jobs/:companyId
router.get('/jobs/:companyId', getCompanyJobs);

// GET /api/companies/applications/:jobId
router.get('/applications/:jobId', getJobApplications);

// PUT /api/companies/application-status/:applicationId
router.put('/application-status/:applicationId', updateApplicationStatus);

module.exports = router;
