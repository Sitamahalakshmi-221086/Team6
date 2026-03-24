const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { applyToJob, getStudentApplications, getTPOApplications, getCompanyApplications } = require('../controllers/applicationController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join('uploads', 'resumes')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/apply', upload.single('resume'), applyToJob);
router.get('/student/:studentId', getStudentApplications);
router.get('/tpo', getTPOApplications);
router.get('/company/:companyId', getCompanyApplications);

module.exports = router;
