 const Company = require('../models/Company');
const bcrypt = require('bcryptjs');

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
    const { companyId, companyName, title, description, requirements, salary, location, jobType, status } = req.body;
    const newJob = await Job.create({
      companyId,
      companyName,
      title,
      description,
      requirements: Array.isArray(requirements) ? requirements : [],
      salary,
      location,
      jobType,
      status: status || 'Active'
    });
    res.status(201).json({ success: true, message: 'Job posted successfully', job: newJob });
  } catch (error) {
    console.error('Post Job Error:', error);
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
    const activeJobsCount = await Job.countDocuments({ companyId, status: 'Active' });
    const totalApplicantsCount = await Application.countDocuments({ companyId });
    const shortlistedCount = await Application.countDocuments({ companyId, status: 'Shortlisted' });
    const hiredCount = await Application.countDocuments({ companyId, status: 'Hired' });

    res.status(200).json({
      success: true,
      stats: {
        activeJobs: activeJobsCount,
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
  postJob,
  getCompanyJobs,
  getJobApplications,
  updateApplicationStatus,
  getCompanyStats
};
