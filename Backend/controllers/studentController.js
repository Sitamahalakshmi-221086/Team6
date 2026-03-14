const Student = require('../models/Student');
const bcrypt = require('bcryptjs');

const studentSignup = async (req, res) => {
  try {
    const { fullName, email, password, phone, branch, year, cgpa, rollNumber, linkedin, skills } = req.body;

    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newStudent = await Student.create({
      fullName,
      email,
      password: hashedPassword,
      phone,
      branch,
      year,
      cgpa,
      rollNumber,
      linkedin: linkedin || '',
      skills: skills ? JSON.parse(skills) : [],
      resume: req.file ? req.file.path : ''
    });

    res.status(201).json({ success: true, message: 'Student registered successfully', studentId: newStudent._id });
  } catch (error) {
    console.error('Student Signup Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};

const studentLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const student = await Student.findOne({ email }).select('+password');
    if (!student) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      student: { id: student._id, fullName: student.fullName, email: student.email, branch: student.branch }
    });
  } catch (error) {
    console.error('Student Login Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = { studentSignup, studentLogin };
