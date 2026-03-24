const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const {
  getOpenJobs,
  notifyOpenJob,
  syncOpenJobs
} = require('../controllers/openJobsController');

// Multer Storage Configuration (reuse same uploads/resumes folder convention)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join('uploads', 'resumes')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// GET /api/open-jobs
router.get('/', getOpenJobs);

// POST /api/open-jobs/notify
router.post('/notify', notifyOpenJob);


// POST /api/open-jobs/sync (CareerSpace sync / external import)
router.post('/sync', syncOpenJobs);

module.exports = router;

