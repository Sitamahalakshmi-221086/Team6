const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

const tpoSignup = async (req, res) => {
  try {
    const { fullName, email, password, phone, college, designation, department, location, collegeCode, accreditation, about } = req.body;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = await Admin.create({
      fullName, email, password: hashedPassword, phone, college, designation,
      department: department || '', location, collegeCode,
      accreditation: accreditation || '', about: about || ''
    });

    res.status(201).json({ success: true, message: 'Admin (TPO) registered successfully', tpoId: newAdmin._id });
  } catch (error) {
    console.error('Admin Signup Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};

const tpoLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    res.status(200).json({ success: true, message: 'Login successful', admin: { id: admin._id, fullName: admin.fullName, email: admin.email, college: admin.college } });
  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = { tpoSignup, tpoLogin };
