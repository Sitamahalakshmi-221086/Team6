const express = require('express');
const router = express.Router();
const {
  companySignup,
  companyLogin,
  updateCompanyProfile,
  getCompanyProfile,
  postJob,
  getCompanyJobs,
  getCompanyDrives,
  getJobApplications,
  updateApplicationStatus,
  getCompanyStats,
  getCompanyDashboard
} = require('../controllers/companyController');

// POST /api/companies/signup
router.post('/signup', companySignup);

// POST /api/companies/login
router.post('/login', companyLogin);

// PUT /api/companies/profile
router.put('/profile', updateCompanyProfile);

router.get('/profile/:id', getCompanyProfile);

// GET /api/companies/stats/:companyId
router.get('/stats/:companyId', getCompanyStats);

// Alias for company analytics cards
router.get('/dashboard/:companyId', getCompanyDashboard);

// POST /api/companies/post-job
router.post('/post-job', postJob);

// GET /api/companies/jobs/:companyId
router.get('/jobs/:companyId', getCompanyJobs);

router.get('/drives/:companyId', getCompanyDrives);

// GET /api/companies/applications/:jobId
router.get('/applications/:jobId', getJobApplications);

// PUT /api/companies/application-status/:applicationId
router.put('/application-status/:applicationId', updateApplicationStatus);

module.exports = router;
