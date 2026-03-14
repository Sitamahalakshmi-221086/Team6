const express = require('express');
const router = express.Router();
const { companySignup, companyLogin } = require('../controllers/companyController');

router.post('/signup', companySignup);
router.post('/login', companyLogin);

module.exports = router;
