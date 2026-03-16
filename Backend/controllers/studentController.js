const Student = require('../models/Student');
const bcrypt = require('bcryptjs');

// Helper to handle Multer file info if present
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
      college,
      linkedin,
      skills // Expecting an array or stringified array from frontend
    } = req.body;

    // Check if student already exists
    const normalizedEmail = email.trim().toLowerCase();
    const existingStudent = await Student.findOne({ email: normalizedEmail });
    if (existingStudent) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Prepare student data
    const studentData = {
      fullName,
      email: normalizedEmail,
      password: hashedPassword,
      phone,
      branch,
      year,
      cgpa,
      rollNumber,
      college,
      linkedin,
      skills: Array.isArray(skills) ? skills : (skills ? JSON.parse(skills) : []),
      isVerified: true
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
    // 1. Find student and include password field
    const normalizedEmail = email.trim().toLowerCase();
    const student = await Student.findOne({ email: normalizedEmail }).select('+password');

    if (!student) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 2. Allow login for verified students OR legacy users (no isVerified field set)
    if (student.isVerified === false) {
      return res.status(403).json({ success: false, message: 'Account not verified. Please complete the signup process.' });
    }

    // 3. Check password (bcrypt match first)
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, student.password);
    } catch (bcryptErr) {
      // password field may not be a valid bcrypt hash (legacy plain-text user)
      isMatch = false;
    }

    // 3b. Fallback: plain-text comparison for legacy accounts (pre-bcrypt migration)
    if (!isMatch && student.password === password) {
      // Re-hash and save the correct hash so future logins work normally
      const salt = await bcrypt.genSalt(10);
      student.password = await bcrypt.hash(password, salt);
      await student.save();
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 4. Success
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
