const Application = require('../models/Application');
const Job = require('../models/Job');
const Student = require('../models/Student');
const { studentJobMatch } = require('./jobsController');

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

    const resume = student.resume && student.resume.filename
      ? {
          filename: student.resume.filename,
          path: student.resume.path,
          contentType: student.resume.contentType
        }
      : undefined;

    const application = await Application.create({
      jobId,
      studentId,
      companyId: job.companyId,
      status: 'New',
      resume
    });

    await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });

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

module.exports = { applyToJob, getStudentApplications };
