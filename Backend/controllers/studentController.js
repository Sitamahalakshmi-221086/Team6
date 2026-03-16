const Student = require('../models/Student');
const bcrypt = require('bcryptjs');

const studentSignup = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phone,
      branch,
      year,
      cgpa,
      rollNumber,
      linkedin,
      skills // Expecting an array or stringified array from frontend
    } = req.body;

    // Check if student already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Prepare student data
    const studentData = {
      fullName,
      email,
      password: hashedPassword,
      phone,
      branch,
      year,
      cgpa,
      rollNumber,
      linkedin: linkedin || '',
      skills: Array.isArray(skills) ? skills : (skills ? JSON.parse(skills) : [])
    };

    // If file uploaded via Multer
    if (req.file) {
      studentData.resume = {
        filename: req.file.filename,
        path: req.file.path,
        contentType: req.file.mimetype
      };
    }

    const newStudent = await Student.create(studentData);

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      studentId: newStudent._id
    });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};

const studentLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find student and include password field (which is select: false by default)
    const student = await Student.findOne({ email }).select('+password');

    if (!student) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 2. Check password
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 3. Success (For a real app, generate JWT here)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      student: {
        id: student._id,
        fullName: student.fullName,
        email: student.email,
        phone: student.phone,
        branch: student.branch,
        year: student.year,
        cgpa: student.cgpa,
        rollNumber: student.rollNumber,
        linkedin: student.linkedin,
        github: student.github,
        preferredLocation: student.preferredLocation,
        skills: student.skills,
        resume: student.resume
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = {
  studentSignup,
  studentLogin
};
