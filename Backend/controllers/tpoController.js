const TPO = require('../models/TPO');
const Notice = require('../models/Notice');
const Drive = require('../models/Drive');
const Job = require('../models/Job');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Application = require('../models/Application');
const CompanyRequest = require('../models/CompanyRequest');
const DriveApplication = require('../models/DriveApplication');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

const tpoSignup = async (req, res) => {
  try {
    const { fullName, email, password, phone, college, designation, department, location, collegeCode, accreditation, about } = req.body;

    const existingTPO = await TPO.findOne({ email });
    if (existingTPO) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newTPO = await TPO.create({
      fullName, email, password: hashedPassword, phone, college, designation,
      department: department || '', location, collegeCode,
      accreditation: accreditation || '', about: about || ''
    });

    res.status(201).json({ success: true, message: 'TPO registered successfully', tpoId: newTPO._id });
  } catch (error) {
    console.error('TPO Signup Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};

const tpoLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const tpo = await TPO.findOne({ email }).select('+password');
    if (!tpo) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, tpo.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    res.status(200).json({ success: true, message: 'Login successful', tpo: { id: tpo._id, fullName: tpo.fullName, email: tpo.email, college: tpo.college } });
  } catch (error) {
    console.error('TPO Login Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const postNotice = async (req, res) => {
  try {
    const { title, department, priority, content, tpoId } = req.body;
    
    if(!title || !content || !tpoId) {
       return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const newNotice = await Notice.create({
      title, department, priority, content, postedBy: tpoId
    });

    res.status(201).json({ success: true, message: 'Notice posted successfully', notice: newNotice });
  } catch (err) {
    console.error('Post Notice Error:', err);
    res.status(500).json({ success: false, message: 'Failed to post notice' });
  }
};

const scheduleDrive = async (req, res) => {
  try {
    const { companyName, date, eligibility, roles, tpoId } = req.body;
    
    if(!companyName || !date || !eligibility || !roles || !tpoId) {
       return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const newDrive = await Drive.create({
      companyName,
      date: new Date(date),
      eligibility,
      roles,
      createdBy: tpoId,
      submittedBy: 'tpo',
      status: 'scheduled'
    });

    res.status(201).json({ success: true, message: 'Drive scheduled successfully', drive: newDrive });
  } catch (err) {
    console.error('Schedule Drive Error:', err);
    res.status(500).json({ success: false, message: 'Failed to schedule drive' });
  }
};

const approveDrive = async (req, res) => {
  try {
    const { id } = req.params;
    const drive = await Drive.findByIdAndUpdate(id, { status: 'scheduled' }, { new: true });
    
    if(!drive) return res.status(404).json({ success: false, message: 'Drive not found' });
    res.status(200).json({ success: true, message: 'Drive approved successfully', drive });
  } catch (err) {
    console.error('Approve Drive Error:', err);
    res.status(500).json({ success: false, message: 'Failed to approve drive' });
  }
};

const sendReminder = async (req, res) => {
  try {
    const { email, studentName, message } = req.body;
    
    if(!email || !studentName || !message) {
      return res.status(400).json({ success: false, message: 'Missing email, name, or message' });
    }

    await transporter.sendMail({
      from: `"CampusPlace TPO" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `TPO Reminder: Important Update`,
      html: `
        <div style="font-family:sans-serif;padding:32px;border:1px solid #e2e8f0;border-radius:12px;">
          <h2 style="color:#1e3a8a;">CampusPlace Update</h2>
          <p>Hello <strong>${studentName}</strong>,</p>
          <p>You have a new reminder from the Placement Office:</p>
          <p style="background:#f8fafc;padding:16px;border-left:4px solid #2563eb;">${message}</p>
        </div>
      `
    });

    res.status(200).json({ success: true, message: `Reminder sent to ${studentName}` });
  } catch (err) {
    console.error('Send Reminder Error:', err);
    res.status(500).json({ success: false, message: 'Failed to send reminder email' });
  }
};

const getDrives = async (req, res) => {
  try {
    const drives = await Drive.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, drives });
  } catch (err) {
    console.error('Get Drives Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch drives' });
  }
};

const otpStore = new Map(); // Simple in-memory store for OTPs: email -> otp

const sendOTP = async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, otp);
    
    // Set expiry for 10 minutes
    setTimeout(() => otpStore.delete(email), 10 * 60 * 1000);

    await transporter.sendMail({
      from: `"CampusPlace" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Your CampusPlace OTP: ${otp}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;">
          <h2 style="color:#1e3a8a;">Email Verification</h2>
          <p>Hello <strong>${name || "User"}</strong>,</p>
          <p>Your one-time password is:</p>
          <div style="font-size:36px;font-weight:800;letter-spacing:10px;color:#2563eb;padding:16px 0;">${otp}</div>
          <p style="color:#64748b;font-size:13px;">Valid for 10 minutes. Do not share it.</p>
        </div>
      `
    });

    res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    console.error('Send OTP Error:', err);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });

  if (otpStore.get(email) === otp) {
    otpStore.delete(email); // One-time use
    res.status(200).json({ success: true, message: 'OTP verified successfully' });
  } else {
    res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
  }
};

const updateTPOProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent password update through this endpoint for safety
    delete updates.password;

    const tpo = await TPO.findByIdAndUpdate(id, updates, { new: true }).select('-password');
    if (!tpo) return res.status(404).json({ success: false, message: 'TPO not found' });

    res.status(200).json({ success: true, message: 'Profile updated successfully', tpo });
  } catch (err) {
    console.error('Update TPO Profile Error:', err);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

const getTPOProfile = async (req, res) => {
  try {
    const tpo = await TPO.findById(req.params.id).select('-password');
    if (!tpo) return res.status(404).json({ success: false, message: 'TPO not found' });
    res.status(200).json({ success: true, tpo });
  } catch (err) {
    console.error('Get TPO Profile Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

const getPlacementRequests = async (req, res) => {
  try {
    const pendingJobs = await Job.find({ tpoApproval: 'pending' })
      .populate('companyId', 'companyName email industry')
      .sort({ createdAt: -1 })
      .lean();
    const pendingDrives = await Drive.find({ submittedBy: 'company', status: 'Pending' })
      .populate('companyId', 'companyName email')
      .sort({ createdAt: -1 })
      .lean();
    const companyRequests = await CompanyRequest.find()
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, pendingJobs, pendingDrives, pendingCompanyRequests: companyRequests });
  } catch (err) {
    console.error('Get Placement Requests Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch requests' });
  }
};

const getTPORequestsCount = async (req, res) => {
  try {
    const [pendingJobs, pendingDrives, pendingCompanyRequests] = await Promise.all([
      Job.countDocuments({ tpoApproval: 'pending' }),
      Drive.countDocuments({ submittedBy: 'company', status: 'Pending' }),
      CompanyRequest.countDocuments({ status: 'pending' })
    ]);

    res.status(200).json({
      success: true,
      count: pendingJobs + pendingDrives + pendingCompanyRequests
    });
  } catch (err) {
    console.error('getTPORequestsCount error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch requests count' });
  }
};

// Module 3: TPO outreach company request flow
const requestCompany = async (req, res) => {
  try {
    const { companyName, role, message, openJobId } = req.body || {};

    if (!companyName || !role || !message) {
      return res.status(400).json({ success: false, message: 'companyName, role, and message are required' });
    }

    const companyRequest = await CompanyRequest.create({
      companyName: String(companyName).trim(),
      role: String(role).trim(),
      message: String(message).trim(),
      openJobId: openJobId || null,
      status: 'pending'
    });

    res.status(201).json({ success: true, companyRequest });
  } catch (err) {
    console.error('requestCompany error:', err);
    res.status(500).json({ success: false, message: 'Failed to create company request' });
  }
};

const updateCompanyRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, date, location, details, roles, eligibility } = req.body || {};

    if (!status || !['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be one of pending/accepted/rejected' });
    }

    const companyRequest = await CompanyRequest.findByIdAndUpdate(
      id,
      { status, driveDate: date, location, details },
      { new: true }
    );

    if (!companyRequest) return res.status(404).json({ success: false, message: 'Company request not found' });

    if (status === 'accepted' && date) {
      const Drive = require('../models/Drive');
      const Notification = require('../models/Notification');
      const Student = require('../models/Student');
      
      const newDrive = await Drive.create({
        companyName: companyRequest.companyName,
        date: new Date(date),
        location: location || '',
        eligibility: eligibility || 'None',
        roles: roles || companyRequest.role || 'Various',
        status: 'scheduled',
        submittedBy: 'company',
        createdBy: null
      });

      const students = await Student.find({}, '_id');
      const notificationsToInsert = students.map(st => ({
        studentId: st._id,
        type: 'drive',
        driveId: newDrive._id,
        message: `New Campus Drive: ${companyRequest.companyName} on ${new Date(date).toLocaleDateString()}`
      }));
      if (notificationsToInsert.length > 0) {
         await Notification.insertMany(notificationsToInsert, { ordered: false }).catch(err => {
           console.error('Notification insertion error (ignoring duplicates):', err.message);
         });
      }
    }

    res.status(200).json({ success: true, companyRequest });
  } catch (err) {
    console.error('updateCompanyRequestStatus error:', err);
    res.status(500).json({ success: false, message: 'Failed to update company request' });
  }
};

const approvePlacementRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const resourceType = req.body.resourceType || 'job';
    if (resourceType === 'drive') {
      const drive = await Drive.findByIdAndUpdate(
        id,
        { status: 'scheduled' },
        { new: true }
      );
      if (!drive) return res.status(404).json({ success: false, message: 'Drive not found' });
      return res.status(200).json({ success: true, message: 'Drive approved', drive });
    }
    const job = await Job.findByIdAndUpdate(
      id,
      { tpoApproval: 'approved' },
      { new: true }
    );
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    return res.status(200).json({ success: true, message: 'Job approved', job });
  } catch (err) {
    console.error('Approve Request Error:', err);
    res.status(500).json({ success: false, message: 'Failed to approve' });
  }
};

const rejectPlacementRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const resourceType = req.body.resourceType || 'job';
    if (resourceType === 'drive') {
      const drive = await Drive.findByIdAndUpdate(
        id,
        { status: 'Rejected' },
        { new: true }
      );
      if (!drive) return res.status(404).json({ success: false, message: 'Drive not found' });
      return res.status(200).json({ success: true, message: 'Drive rejected', drive });
    }
    const job = await Job.findByIdAndUpdate(
      id,
      { tpoApproval: 'rejected' },
      { new: true }
    );
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    return res.status(200).json({ success: true, message: 'Job rejected', job });
  } catch (err) {
    console.error('Reject Request Error:', err);
    res.status(500).json({ success: false, message: 'Failed to reject' });
  }
};

const getTPOAnalytics = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalCompanies = await Company.countDocuments();
    const totalDrives = await Drive.countDocuments({ status: { $in: ['scheduled', 'Approved'] } });
    const totalApplications = await Application.countDocuments();
    const shortlisted = await Application.countDocuments({ status: 'Shortlisted' });
    const interviews = await Application.countDocuments({ status: 'Interview' });
    const offers = await Application.countDocuments({ status: { $in: ['Offered', 'Hired'] } });

    const placedStudentIds = await Application.distinct('studentId', {
      status: { $in: ['Offered', 'Hired'] }
    });
    const studentsWithApps = await Application.distinct('studentId');
    const pl = new Set(placedStudentIds.map((id) => String(id)));
    const sw = new Set(studentsWithApps.map((id) => String(id)));
    let inProcessStudents = 0;
    for (const id of sw) {
      if (!pl.has(id)) inProcessStudents += 1;
    }
    const notAppliedStudents = Math.max(0, totalStudents - sw.size);
    const placedStudents = pl.size;

    const studentsByBranch = await Student.aggregate([
      { $group: { _id: '$branch', total: { $sum: 1 } } }
    ]);
    const placedByBranch = await Application.aggregate([
      { $match: { status: { $in: ['Offered', 'Hired'] } } },
      { $lookup: { from: 'students', localField: 'studentId', foreignField: '_id', as: 'st' } },
      { $unwind: '$st' },
      { $group: { _id: '$st.branch', placed: { $sum: 1 } } }
    ]);
    const placedMap = Object.fromEntries(placedByBranch.map((x) => [x._id, x.placed]));
    const branchPlacement = studentsByBranch
      .map(({ _id, total }) => {
        const b = _id || 'Unknown';
        const rate = total ? Math.round(((placedMap[b] || 0) / total) * 100) : 0;
        return { branch: b, rate, total };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    const companyHires = await Application.aggregate([
      { $match: { status: { $in: ['Offered', 'Hired'] } } },
      { $group: { _id: '$companyId', hires: { $sum: 1 } } },
      { $lookup: { from: 'companies', localField: '_id', foreignField: '_id', as: 'co' } },
      { $project: { name: { $arrayElemAt: ['$co.companyName', 0] }, hires: 1 } },
      { $sort: { hires: -1 } },
      { $limit: 8 }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalCompanies,
        totalDrives,
        totalApplications,
        shortlisted,
        interviews,
        offers,
        placedStudents,
        inProcessStudents,
        notAppliedStudents,
        branchPlacement,
        companyHires: companyHires.map((c) => ({
          name: c.name || 'Company',
          hires: c.hires
        }))
      }
    });
  } catch (err) {
    console.error('TPO Analytics Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
};

// Module 5: Unified dashboard stats
const getTPODashboard = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalCompanies = await Company.countDocuments();

    // Scheduled drives: support both legacy 'Approved' and new 'scheduled'
    const totalDrives = await Drive.countDocuments({ status: { $in: ['scheduled', 'Approved'] } });
    const totalApplications = await DriveApplication.countDocuments();

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalCompanies,
        totalDrives,
        totalApplications
      }
    });
  } catch (err) {
    console.error('getTPODashboard error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
};

const getTPONotices = async (req, res) => {
  try {
    const notices = await Notice.find().sort({ postedAt: -1 }).limit(50).lean();
    res.status(200).json({ success: true, notices });
  } catch (err) {
    console.error('Get notices error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch notices' });
  }
};

const getTPOStudentsDirectory = async (req, res) => {
  try {
    const students = await Student.find().select('-password').lean();
    const applications = await Application.find().select('studentId status').lean();
    const byStudent = {};
    for (const a of applications) {
      const sid = String(a.studentId);
      if (!byStudent[sid]) byStudent[sid] = [];
      byStudent[sid].push(a.status);
    }
    const categorize = (statuses) => {
      if (!statuses.length) return 'unplaced';
      if (statuses.some((s) => s === 'Offered' || s === 'Hired')) return 'placed';
      if (statuses.every((s) => s === 'Rejected')) return 'unplaced';
      return 'active';
    };
    const enriched = students.map((s) => {
      const st = byStudent[String(s._id)] || [];
      return {
        ...s,
        category: categorize(st),
        applicationCount: st.length
      };
    });
    res.status(200).json({ success: true, students: enriched });
  } catch (err) {
    console.error('TPO students directory error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch students' });
  }
};

const getTPOCompaniesDirectory = async (req, res) => {
  try {
    const companies = await Company.find().select('-password').sort({ companyName: 1 }).lean();
    res.status(200).json({ success: true, companies });
  } catch (err) {
    console.error('TPO companies list error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch companies' });
  }
};

const getTPOPlacementRecords = async (req, res) => {
  try {
    const rows = await Application.find({ status: { $in: ['Offered', 'Hired'] } })
      .populate('studentId', 'fullName branch rollNumber')
      .populate('jobId', 'title salary')
      .populate('companyId', 'companyName')
      .sort({ appliedAt: -1 })
      .limit(200)
      .lean();
    res.status(200).json({ success: true, records: rows });
  } catch (err) {
    console.error('TPO placement records error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch placements' });
  }
};

module.exports = {
  tpoSignup,
  tpoLogin,
  postNotice,
  scheduleDrive,
  approveDrive,
  sendReminder,
  getDrives,
  sendOTP,
  verifyOTP,
  updateTPOProfile,
  getTPOProfile,
  getPlacementRequests,
  getTPORequestsCount,
  approvePlacementRequest,
  rejectPlacementRequest,
  getTPOAnalytics,
  getTPODashboard,
  getTPONotices,
  getTPOStudentsDirectory,
  getTPOCompaniesDirectory,
  getTPOPlacementRecords,
  requestCompany,
  updateCompanyRequestStatus
};