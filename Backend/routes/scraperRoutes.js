const express = require('express');
const { runScraper } = require('../scripts/jobScraper');
const { getSchedulerStatus } = require('../scripts/jobScheduler');
const ScrapedJob = require('../models/ScrapedJob');

const router = express.Router();

/**
 * POST /api/scraper/run
 * Manually trigger job scraper
 * Protected: TPO only
 */
router.post('/run', async (req, res) => {
  try {
    console.log('📌 Manual scraper trigger requested');
    
    // Run scraper in background
    runScraper()
      .then(() => console.log('✅ Scraper completed'))
      .catch(error => console.error('❌ Scraper error:', error));

    res.status(202).json({
      success: true,
      message: 'Job scraper started in background',
      status: 'running',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error starting scraper',
      error: error.message,
    });
  }
});

/**
 * GET /api/scraper/status
 * Get scraper status and recent jobs
 */
router.get('/status', async (req, res) => {
  try {
    const schedulerStatus = getSchedulerStatus();
    const totalJobs = await ScrapedJob.countDocuments();
    const recentJobs = await ScrapedJob.countDocuments({
      scrapedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    const lastScrapedJob = await ScrapedJob.findOne({})
      .sort({ scrapedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      scheduler: schedulerStatus,
      stats: {
        totalJobs,
        jobsAddedIn24h: recentJobs,
        lastScrapedAt: lastScrapedJob?.scrapedAt || null,
        lastScrapedJob: lastScrapedJob
          ? {
              company: lastScrapedJob.company,
              title: lastScrapedJob.title,
              portal: lastScrapedJob.portal,
            }
          : null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching scraper status',
      error: error.message,
    });
  }
});

/**
 * GET /api/scraper/jobs
 * Get all scraped jobs
 * Query params:
 *   - limit: number of jobs (default 20)
 *   - skip: pagination (default 0)
 *   - branch: filter by branch
 *   - portal: filter by job portal
 *   - published: true/false (filter by published status)
 */
router.get('/jobs', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = parseInt(req.query.skip) || 0;
    const branch = req.query.branch;
    const portal = req.query.portal;
    const published = req.query.published;

    let filter = {};

    if (branch) {
      filter.branches = branch;
    }
    if (portal) {
      filter.portal = new RegExp(portal, 'i');
    }
    if (published !== undefined) {
      filter.publishedToStudents = published === 'true';
    }

    const jobs = await ScrapedJob.find(filter)
      .sort({ scrapedAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await ScrapedJob.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        total,
        limit,
        skip,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs',
      error: error.message,
    });
  }
});

/**
 * GET /api/scraper/jobs/:id
 * Get single scraped job details
 */
router.get('/jobs/:id', async (req, res) => {
  try {
    const job = await ScrapedJob.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching job',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/scraper/jobs/:id
 * Delete a scraped job
 */
router.delete('/jobs/:id', async (req, res) => {
  try {
    const job = await ScrapedJob.findByIdAndDelete(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting job',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/scraper/clear-old-jobs
 * Delete jobs older than specified days (default 30 days)
 */
router.delete('/clear-old-jobs', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await ScrapedJob.deleteMany({
      scrapedAt: { $lt: cutoffDate },
    });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} jobs older than ${days} days`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error clearing old jobs',
      error: error.message,
    });
  }
});

module.exports = router;
