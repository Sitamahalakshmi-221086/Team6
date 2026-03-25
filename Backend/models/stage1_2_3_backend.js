// ═══════════════════════════════════════════════════════════════════
//  CAMPUSPLACE — STAGES 1, 2, 3 BACKEND ADDITIONS
//  Add these functions to tpoController.js and wire the routes.
// ═══════════════════════════════════════════════════════════════════

// ─── DEPENDENCIES (already in tpoController.js top) ───────────────
// const ScrapedJob   = require('../models/ScrapedJob');
// const OpenJob      = require('../models/OpenJob');      ← NEW model
// const Notification = require('../models/Notification');
// const Student      = require('../models/Student');

// ═══════════════════════════════════════════════════════════════════
// STAGE 1 — GET scraped jobs (TPO sees them first)
//   GET /api/tpo/scraped-jobs
// ═══════════════════════════════════════════════════════════════════
const getScrapedJobs = async (req, res) => {
  try {
    const jobs = await ScrapedJob.find().sort({ scrapedAt: -1 }).lean();
    res.status(200).json({ success: true, jobs });
  } catch (err) {
    console.error('getScrapedJobs error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch scraped jobs' });
  }
};

// ═══════════════════════════════════════════════════════════════════
// STAGE 1 — SAVE scraped jobs (called by scraper script)
//   POST /api/tpo/save-scraped-jobs
// ═══════════════════════════════════════════════════════════════════
const saveScrapedJobs = async (req, res) => {
  try {
    const { jobs } = req.body;
    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return res.status(400).json({ success: false, message: 'jobs array required' });
    }
    const saved = await ScrapedJob.insertMany(
      jobs.map(j => ({
        portal: j.portal || 'Unknown',
        company: j.company,
        title: j.title,
        branches: j.branches || [],
        type: j.type || 'Full-time',
        stipend: j.stipend || '',
        skills: j.skills || [],
        location: j.location || '',
        postedDate: j.postedDate || '',
        companyEmail: j.companyEmail || '',
        driveRequested: false,
        publishedToStudents: false   // ← key new field
      })),
      { ordered: false }
    );
    res.status(201).json({ success: true, message: `${saved.length} jobs saved`, count: saved.length });
  } catch (err) {
    console.error('saveScrapedJobs error:', err);
    res.status(500).json({ success: false, message: 'Failed to save scraped jobs' });
  }
};

// ═══════════════════════════════════════════════════════════════════
// STAGE 2 — TPO publishes a scraped job to students
//   POST /api/tpo/publish-job/:scrapedJobId
//
//  • Copies the ScrapedJob into the OpenJob collection
//  • Marks ScrapedJob.publishedToStudents = true
//  • Sends in-app notification to every student
// ═══════════════════════════════════════════════════════════════════
const publishJobToStudents = async (req, res) => {
  try {
    const { scrapedJobId } = req.params;
    const { tpoId } = req.body;

    const scraped = await ScrapedJob.findById(scrapedJobId);
    if (!scraped) {
      return res.status(404).json({ success: false, message: 'Scraped job not found' });
    }
    if (scraped.publishedToStudents) {
      return res.status(400).json({ success: false, message: 'Job already published to students' });
    }

    // Create / upsert an OpenJob record visible to students
    const OpenJob = require('../models/OpenJob');
    const openJob = await OpenJob.create({
      scrapedJobId: scraped._id,
      companyName: scraped.company,
      title: scraped.title,
      description: scraped.stipend || '',
      location: scraped.location || '',
      requiredBranches: scraped.branches || [],
      skills: scraped.skills || [],
      type: scraped.type || 'Full-time',
      package: scraped.stipend || '',
      companyEmail: scraped.companyEmail || '',
      portal: scraped.portal || '',
      publishedBy: tpoId || null,
      publishedAt: new Date(),
      isNotified: false,
      outreachStatus: 'none'
    });

    // Mark scraped job as published
    scraped.publishedToStudents = true;
    scraped.openJobId = openJob._id;
    await scraped.save();

    // Notify all students
    const students = await Student.find({}, '_id').lean();
    if (students.length) {
      const notifs = students.map(st => ({
        studentId: st._id,
        type: 'job',
        message: `New job posted: ${scraped.title} at ${scraped.company}`,
        driveId: null
      }));
      await Notification.insertMany(notifs, { ordered: false }).catch(() => {});
    }

    res.status(201).json({
      success: true,
      message: `Job published to ${students.length} students`,
      openJob
    });
  } catch (err) {
    console.error('publishJobToStudents error:', err);
    res.status(500).json({ success: false, message: 'Failed to publish job' });
  }
};

// ═══════════════════════════════════════════════════════════════════
// STAGE 2 — BULK publish all new scraped jobs in one click
//   POST /api/tpo/publish-all-jobs
// ═══════════════════════════════════════════════════════════════════
const publishAllNewJobs = async (req, res) => {
  try {
    const { tpoId } = req.body;
    const unpublished = await ScrapedJob.find({ publishedToStudents: { $ne: true } }).lean();
    if (!unpublished.length) {
      return res.status(200).json({ success: true, message: 'No new jobs to publish', count: 0 });
    }

    const OpenJob = require('../models/OpenJob');
    const openJobs = await OpenJob.insertMany(
      unpublished.map(j => ({
        scrapedJobId: j._id,
        companyName: j.company,
        title: j.title,
        description: j.stipend || '',
        location: j.location || '',
        requiredBranches: j.branches || [],
        skills: j.skills || [],
        type: j.type || 'Full-time',
        package: j.stipend || '',
        companyEmail: j.companyEmail || '',
        portal: j.portal || '',
        publishedBy: tpoId || null,
        publishedAt: new Date(),
        isNotified: false,
        outreachStatus: 'none'
      })),
      { ordered: false }
    );

    // Bulk-mark as published
    const ids = unpublished.map(j => j._id);
    await ScrapedJob.updateMany({ _id: { $in: ids } }, { publishedToStudents: true });

    // One combined notification per student
    const students = await Student.find({}, '_id').lean();
    if (students.length) {
      const notifs = students.map(st => ({
        studentId: st._id,
        type: 'job',
        message: `${openJobs.length} new job(s) published — check the Jobs section`,
        driveId: null
      }));
      await Notification.insertMany(notifs, { ordered: false }).catch(() => {});
    }

    res.status(201).json({
      success: true,
      message: `${openJobs.length} jobs published`,
      count: openJobs.length
    });
  } catch (err) {
    console.error('publishAllNewJobs error:', err);
    res.status(500).json({ success: false, message: 'Failed to bulk publish jobs' });
  }
};

// ═══════════════════════════════════════════════════════════════════
// STAGE 2 — GET all open (published) jobs — student-facing
//   GET /api/open-jobs
//   (Already handled in openJobsRoutes, but add this as a fallback)
// ═══════════════════════════════════════════════════════════════════
const getPublishedJobs = async (req, res) => {
  try {
    const OpenJob = require('../models/OpenJob');
    const jobs = await OpenJob.find().sort({ publishedAt: -1 }).lean();
    res.status(200).json({ success: true, openJobs: jobs });
  } catch (err) {
    console.error('getPublishedJobs error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch jobs' });
  }
};

// ═══════════════════════════════════════════════════════════════════
// STAGE 3 — GET applications for a specific open job (TPO view)
//   GET /api/tpo/job-applications/:openJobId
// ═══════════════════════════════════════════════════════════════════
const getJobApplicantsTpo = async (req, res) => {
  try {
    const { openJobId } = req.params;
    const Application = require('../models/Application');
    const apps = await Application.find({ jobId: openJobId })
      .populate('studentId', 'fullName email branch year cgpa rollNumber phone skills')
      .sort({ appliedAt: -1 })
      .lean();
    res.status(200).json({ success: true, applications: apps, count: apps.length });
  } catch (err) {
    console.error('getJobApplicantsTpo error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch applicants' });
  }
};

// ═══════════════════════════════════════════════════════════════════
// STAGE 3 — GET all applications across all open jobs (TPO aggregate)
//   GET /api/applications/tpo
//   (already exists — verify it populates studentId + jobId)
// ═══════════════════════════════════════════════════════════════════

// ─── ADD THESE ROUTES to tpoRoutes.js ────────────────────────────
/*
  router.get('/scraped-jobs',            getScrapedJobs);
  router.post('/save-scraped-jobs',      saveScrapedJobs);
  router.post('/publish-job/:scrapedJobId', publishJobToStudents);
  router.post('/publish-all-jobs',       publishAllNewJobs);
  router.get('/job-applications/:openJobId', getJobApplicantsTpo);
*/

module.exports = {
  getScrapedJobs,
  saveScrapedJobs,
  publishJobToStudents,
  publishAllNewJobs,
  getPublishedJobs,
  getJobApplicantsTpo
};
