const express = require('express');
const router = express.Router();

const {
  getOpenJobs,
  notifyOpenJob,
  syncOpenJobs
} = require('../controllers/openJobsController');

// GET /api/open-jobs
router.get('/', getOpenJobs);

// POST /api/open-jobs/notify
router.post('/notify', notifyOpenJob);


// POST /api/open-jobs/sync (CareerSpace sync / external import)
router.post('/sync', syncOpenJobs);

module.exports = router;

