const express = require('express');
const router = express.Router();
const { companySignup, companyLogin } = require('../controllers/companyController');

<<<<<<< HEAD
// POST /api/companies/signup
router.post('/signup', companySignup);

// POST /api/companies/login
=======
router.post('/signup', companySignup);
>>>>>>> UI
router.post('/login', companyLogin);

module.exports = router;
