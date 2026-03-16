const TPO = require('../models/TPO');
const bcrypt = require('bcryptjs');

const tpoSignup = async (req, res) => {
  try {
    const { fullName, email, password, phone, college, designation, department, location, collegeCode, accreditation, about } = req.body;

    const normalizedEmail = email.trim().toLowerCase();
    const existingTPO = await TPO.findOne({ email: normalizedEmail });
    if (existingTPO) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newTPO = await TPO.create({
      fullName, email: normalizedEmail, password: hashedPassword, phone, college, designation,
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
    const normalizedEmail = email.trim().toLowerCase();
    const tpo = await TPO.findOne({ email: normalizedEmail }).select('+password');
    if (!tpo) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, tpo.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    res.status(200).json({ success: true, message: 'Login successful', tpo: { id: tpo._id, fullName: tpo.fullName, email: tpo.email, college: tpo.college } });
  } catch (error) {
    console.error('TPO Login Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = { tpoSignup, tpoLogin };
