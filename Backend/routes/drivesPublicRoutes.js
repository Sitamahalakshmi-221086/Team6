const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const { getApprovedDrivesForStudents } = require('../controllers/driveListingController');
const { createCompanyDrive } = require('../controllers/companyController');
const { applyToDrive, updateDrive } = require('../controllers/driveApplicationController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join('uploads', 'resumes')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', getApprovedDrivesForStudents);
router.post('/create', createCompanyDrive);

// PATCH /api/drives/update/:id
router.patch('/update/:id', updateDrive);

// Student drive application
router.post('/apply', upload.single('resume'), applyToDrive);

module.exports = router;
