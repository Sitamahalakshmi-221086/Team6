const Student = require('../models/Student');
const bcrypt = require('bcryptjs');

const studentSignup = async (req, res) => {
  try {
    const {
      fullName, email, password, phone,
      branch, year, cgpa, rollNumber,
      college, linkedin, skills
    } = req.body;

    console.log('📝 studentSignup called with email:', email);

    if (!fullName || !email || !password || !phone || !branch || !year || !cgpa || !college) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Hash password first (fast, no DB needed)
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
      rollNumber: rollNumber || '',
      college,
      linkedin:   linkedin  || '',
      skills: Array.isArray(skills) ? skills : (skills ? JSON.parse(skills) : []),
      isVerified: true
    };

    if (req.file) {
      studentData.resume = {
        filename:    req.file.filename,
        path:        req.file.path,
        contentType: req.file.mimetype
      };
    }

    const newStudent = new Student(studentData);

    // ✅ SEND RESPONSE IMMEDIATELY — don't wait for DB save
    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      studentId: newStudent._id  // _id is generated locally, no DB needed
    });

    // Save to DB in background after response is sent
    newStudent.save({ validateBeforeSave: false })
      .then(() => console.log('✅ Student saved successfully:', newStudent._id))
      .catch(err => console.error('❌ Background save error:', err.message));

  } catch (error) {
    console.error('❌ Signup Error:', error.message);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};

const studentLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email.trim().toLowerCase();
    const student = await Student.findOne({ email: normalizedEmail }).select('+password');

    if (!student) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (student.isVerified === false) {
      return res.status(403).json({ success: false, message: 'Account not verified. Please complete the signup process.' });
    }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, student.password);
    } catch (bcryptErr) {
      isMatch = false;
    }

    if (!isMatch && student.password === password) {
      const salt = await bcrypt.genSalt(10);
      student.password = await bcrypt.hash(password, salt);
      await student.save({ validateBeforeSave: false });
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      student: {
        id:                student._id,
        fullName:          student.fullName,
        email:             student.email,
        phone:             student.phone,
        branch:            student.branch,
        year:              student.year,
        cgpa:              student.cgpa,
        rollNumber:        student.rollNumber,
        linkedin:          student.linkedin,
        skills:            student.skills,
        resume:            student.resume
      }
    });

  } catch (error) {
    console.error('❌ Login Error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = { studentSignup, studentLogin };