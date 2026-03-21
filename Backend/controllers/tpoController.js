const TPO = require('../models/TPO');
const Notice = require('../models/Notice');
const Drive = require('../models/Drive');
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
      companyName, date, eligibility, roles, createdBy: tpoId
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
    const drive = await Drive.findByIdAndUpdate(id, { status: 'Approved' }, { new: true });
    
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

module.exports = { tpoSignup, tpoLogin, postNotice, scheduleDrive, approveDrive, sendReminder, getDrives };
