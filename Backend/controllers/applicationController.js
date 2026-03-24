const Application = require('../models/Application');
const Job = require('../models/Job');
const OpenJob = require('../models/OpenJob');
const Student = require('../models/Student');
const Company = require('../models/Company');
const { studentJobMatch } = require('./jobsController');

const applyToJob = async (req, res) => {
  try {
    const { jobId, studentId, type } = req.body;
    if (!jobId || !studentId) {
      return res.status(400).json({ success: false, message: 'jobId and studentId are required' });
    }

    const applicationType = type === 'open' ? 'open' : 'drive';
    let job;
    let companyId;

    if (applicationType === 'open') {
      job = await OpenJob.findById(jobId);
      if (!job) {
        return res.status(400).json({ success: false, message: 'Open Job not found' });
      }
      // Derive companyId by matching companyName — null if company is not yet registered
      const company = await Company.findOne({ companyName: new RegExp('^' + job.companyName + '$', 'i') });
      companyId = company ? company._id : null;
    } else {
      job = await Job.findOne({ _id: jobId, ...studentJobMatch });
      if (!job) {
        return res.status(400).json({ success: false, message: 'Job is not available for applications' });
      }
      companyId = job.companyId;
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const existing = await Application.findOne({ jobId, studentId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already applied for this job' });
    }

    const resume = req.file
      ? {
          filename: req.file.filename,
          path: req.file.path,
          contentType: req.file.mimetype
        }
      : student.resume && student.resume.filename
        ? {
            filename: student.resume.filename,
            path: student.resume.path,
            contentType: student.resume.contentType
          }
        : undefined;

    if (!resume) {
      return res.status(400).json({ success: false, message: 'Resume is required to apply' });
    }

    const application = await Application.create({
      jobId,
      studentId,
      companyId: companyId || undefined, // null for unregistered open-job companies
      type: applicationType,
      status: 'applied',
      resume
    });

    if (applicationType === 'drive') {
      await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });
    }

    res.status(201).json({ success: true, message: 'Application submitted', application });
  } catch (error) {
    console.error('Apply Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const getStudentApplications = async (req, res) => {
  try {
    const { studentId } = req.params;
    const applications = await Application.find({ studentId })
      .populate('jobId', 'title companyName salary location jobType description')
      .sort({ appliedAt: -1 })
      .lean();
    res.status(200).json({ success: true, applications });
  } catch (error) {
    console.error('Get Student Applications Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const getTPOApplications = async (req, res) => {
  try {
    const { jobId } = req.query || {};
    const filter = {};
    if (jobId) filter.jobId = jobId;

    const applications = await Application.find(filter)
      .populate('studentId', 'fullName email phone branch cgpa skills')
      .populate('jobId', 'title companyName salary location description')
      .sort({ appliedAt: -1 })
      .limit(500)
      .lean();

    res.status(200).json({ success: true, applications });
  } catch (error) {
    console.error('Get TPO Applications Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = { applyToJob, getStudentApplications, getTPOApplications };
