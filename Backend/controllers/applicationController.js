const Application = require('../models/Application');
const Job = require('../models/Job');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');
const { studentJobMatch } = require('./jobsController');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

const applyToJob = async (req, res) => {
  try {
    const { jobId, studentId } = req.body;
    if (!jobId || !studentId) {
      return res.status(400).json({ success: false, message: 'jobId and studentId are required' });
    }

    const job = await Job.findOne({ _id: jobId, ...studentJobMatch });
    if (!job) {
      return res.status(400).json({ success: false, message: 'Job is not available for applications' });
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
      companyId: job.companyId,
      status: 'applied',
      resume
    });

    await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });

    await Notification.create({
      studentId,
      type: 'drive',
      message: `Application submitted: ${job.title} at ${job.companyName}`
    }).catch(() => {});

    if (student.email) {
      await transporter.sendMail({
        from: `"CampusPlace" <${process.env.GMAIL_USER}>`,
        to: student.email,
        subject: `Application Submitted: ${job.title}`,
        html: `<p>Hello ${student.fullName || 'Student'},</p><p>Your application for <strong>${job.title}</strong> at <strong>${job.companyName}</strong> has been submitted.</p>`
      }).catch(() => {});
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

const getCompanyApplications = async (req, res) => {
  try {
    const { companyId } = req.params;
    const applications = await Application.find({ companyId })
      .populate('studentId', 'fullName email phone branch cgpa skills')
      .populate('jobId', 'title companyName salary location description')
      .sort({ appliedAt: -1 })
      .limit(500)
      .lean();
    res.status(200).json({ success: true, applications });
  } catch (error) {
    console.error('Get Company Applications Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = { applyToJob, getStudentApplications, getTPOApplications, getCompanyApplications };
