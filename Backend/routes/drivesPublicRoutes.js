const express = require('express');
const router = express.Router();
const { getApprovedDrivesForStudents } = require('../controllers/driveListingController');
const { createCompanyDrive } = require('../controllers/companyController');

router.get('/', getApprovedDrivesForStudents);
router.post('/create', createCompanyDrive);

module.exports = router;
