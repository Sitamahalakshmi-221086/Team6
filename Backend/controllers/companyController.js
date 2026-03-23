const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Student = require('../models/Student');
const Drive = require('../models/Drive');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const companySignup = async (req, res) => {
  try {
    const {
      companyName,
      email,
      password,
      contactPerson,
      phone,
      industry,
      companySize,
      website,
      address,
      hiringRoles,
      description
    } = req.body;

    // Check if company already exists
    const existingCompany = await Company.findOne({ email });
    if (existingCompany) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Prepare company data
    const companyData = {
      companyName,
      email,
      password: hashedPassword,
      contactPerson,
      phone,
      industry,
      companySize,
      website,
      address,
      hiringRoles: Array.isArray(hiringRoles) ? hiringRoles : (hiringRoles ? JSON.parse(hiringRoles) : []),
      description
    };

    const newCompany = await Company.create(companyData);

    res.status(201).json({
      success: true,
      message: 'Company registered successfully',
      companyId: newCompany._id
    });
  } catch (error) {
    console.error('Company Signup Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};

const companyLogin = async (req, res) => {
  try {
    const { email, password, companyName } = req.body;

    // 1. Find company and include password
    const company = await Company.findOne({ email }).select('+password');

    if (!company) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 2. Validate company name
    if (company.companyName.trim().toLowerCase() !== companyName.trim().toLowerCase()) {
      return res.status(401).json({ success: false, message: 'Company name does not match our records' });
    }

    // 3. Check password
    const isMatch = await bcrypt.compare(password, company.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 4. Success
    res.status(200).json({
      success: true,
      message: 'Login successful',
      company: {
        id: company._id,
        companyName: company.companyName,
        email: company.email,
        contactPerson: company.contactPerson,
        phone: company.phone,
        industry: company.industry,
        companySize: company.companySize,
        website: company.website,
        address: company.address,
        hiringRoles: company.hiringRoles,
        description: company.description
      }
    });

  } catch (error) {
    console.error('Company Login Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const updateCompanyProfile = async (req, res) => {
  try {
    const {
      email,
      companyName,
      industry,
      companySize,
      website,
      address,
      description
    } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required to update profile.' });
    }

    const updated = await Company.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      {
        companyName,
        industry,
        companySize,
        website,
        address,
        description
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Company account not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Company profile updated successfully.',
      company: {
        companyName: updated.companyName,
        email: updated.email,
        industry: updated.industry,
        companySize: updated.companySize,
        website: updated.website,
        address: updated.address,
        description: updated.description
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Unable to update profile.' });
  }
};

const postJob = async (req, res) => {
  try {
    const {
      companyId,
      companyName,
      title,
      description,
      requirements,
      salary,
      package: packageCtc,
      location,
      jobType,
      workMode,
      deadline,
      status
    } = req.body;

    if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ success: false, message: 'Valid companyId is required' });
    }
    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: 'Job title is required' });
    }
    if (!description || !String(description).trim()) {
      return res.status(400).json({ success: false, message: 'Job description is required' });
    }

    let safeCompanyName = (companyName || '').trim();
    if (!safeCompanyName) {
      const company = await Company.findById(companyId).select('companyName').lean();
      if (!company) {
        return res.status(404).json({ success: false, message: 'Company not found for provided companyId' });
      }
      safeCompanyName = company.companyName || 'Company';
    }

    const newJob = await Job.create({
      companyId,
      companyName: safeCompanyName,
      title: String(title).trim(),
      description: String(description).trim(),
      requirements: Array.isArray(requirements)
        ? requirements.map((r) => String(r).trim()).filter(Boolean)
        : [],
      salary: salary || packageCtc,
      location: location ? String(location).trim() : '',
      jobType,
      workMode,
      deadline,
      status: status || 'Active',
      tpoApproval: 'pending'
    });
    res.status(201).json({ success: true, message: 'Job submitted for TPO approval', job: newJob });
  } catch (error) {
    console.error('Post Job Error:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Internal Server Error'
    });
  }
};

const getCompanyProfile = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).select('-password');
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.status(200).json({ success: true, company });
  } catch (error) {
    console.error('Get Company Profile Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const createCompanyDrive = async (req, res) => {
  try {
    const { companyId, companyName, date, eligibility, roles } = req.body;
    if (!companyId || !companyName || !date) {
      return res.status(400).json({ success: false, message: 'companyId, companyName, and date are required' });
    }
    const drive = await Drive.create({
      companyId,
      companyName,
      date: new Date(date),
      eligibility: eligibility || '—',
      roles: roles || '—',
      status: 'Pending',
      submittedBy: 'company'
    });
    res.status(201).json({ success: true, message: 'Drive request submitted for TPO approval', drive });
  } catch (error) {
    console.error('Create Company Drive Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const getCompanyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ companyId: req.params.companyId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, jobs });
  } catch (error) {
    console.error('Get Company Jobs Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const getCompanyDrives = async (req, res) => {
  try {
    const drives = await Drive.find({ companyId: req.params.companyId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, drives });
  } catch (error) {
    console.error('Get Company Drives Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const getJobApplications = async (req, res) => {
  try {
    const applications = await Application.find({ jobId: req.params.jobId })
      .populate('studentId', 'fullName email phone branch year cgpa skills resume')
      .sort({ appliedAt: -1 });
    res.status(200).json({ success: true, applications });
  } catch (error) {
    console.error('Get Job Applications Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const application = await Application.findByIdAndUpdate(
      req.params.applicationId,
      { status },
      { new: true }
    );
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    res.status(200).json({ success: true, message: `Status updated to ${status}`, application });
  } catch (error) {
    console.error('Update Application Status Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const getCompanyStats = async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const totalJobsPosted = await Job.countDocuments({ companyId });
    const approvedJobs = await Job.countDocuments({
      companyId,
      $or: [{ tpoApproval: 'approved' }, { tpoApproval: { $exists: false } }]
    });
    const pendingJobs = await Job.countDocuments({ companyId, tpoApproval: 'pending' });
    const totalApplicantsCount = await Application.countDocuments({ companyId });
    const shortlistedCount = await Application.countDocuments({ companyId, status: 'Shortlisted' });
    const hiredCount = await Application.countDocuments({ companyId, status: 'Hired' });

    res.status(200).json({
      success: true,
      stats: {
        totalJobsPosted,
        approvedJobs,
        pendingJobs,
        activeJobs: approvedJobs,
        totalApplicants: totalApplicantsCount,
        shortlisted: shortlistedCount,
        hired: hiredCount
      }
    });
  } catch (error) {
    console.error('Get Company Stats Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = {
  companySignup,
  companyLogin,
  updateCompanyProfile,
  getCompanyProfile,
  postJob,
  createCompanyDrive,
  getCompanyJobs,
  getCompanyDrives,
  getJobApplications,
  updateApplicationStatus,
  getCompanyStats
};
