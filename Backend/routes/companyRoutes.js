const express = require('express');
const router = express.Router();
const { companySignup, companyLogin, updateCompanyProfile } = require('../controllers/companyController');

// POST /api/companies/signup
router.post('/signup', companySignup);

// POST /api/companies/login
router.post('/login', companyLogin);

// PUT /api/companies/profile
router.put('/profile', updateCompanyProfile);

module.exports = router;
