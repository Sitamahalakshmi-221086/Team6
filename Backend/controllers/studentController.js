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
      linkedin,
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

const sendPasswordResetEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const student = await Student.findOne({ email: email.trim().toLowerCase() });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    console.log(`📧 Simulated password reset email sent to: ${student.email}`);
    return res.status(200).json({ success: true, message: `Password reset email sent to ${student.email}` });
  } catch (error) {
    console.error('Password Reset Error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const startTest = async (req, res) => {
  try {
    const { email, testName } = req.body;
    const student = await Student.findOne({ email: email.trim().toLowerCase() });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    const testLink = `https://campusplace.edu/test/${testName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    return res.status(200).json({ success: true, message: `Success! A test link has been sent to ${student.email}`, link: testLink });
  } catch (error) {
    console.error('Start Test Error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const Application = require('../models/Application');

const getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('-password').lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // Join applications with job/company details
    const applications = await Application.find({ studentId: req.params.id })
      .populate('jobId', 'title companyName salary location jobType')
      .sort({ appliedAt: -1 })
      .lean();

    return res.status(200).json({ success: true, student: { ...student, applications } });
  } catch (error) {
    console.error('Get Profile Error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const updateStudentProfile = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password;
    delete updates.email;
    const student = await Student.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    }).select('-password');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    return res.status(200).json({ success: true, student });
  } catch (error) {
    console.error('Update Student Profile Error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const getStudentAnalytics = async (req, res) => {
  try {
    const studentId = req.params.id;
    const apps = await Application.find({ studentId });
    const totalApplications = apps.length;
    const shortlisted = apps.filter((a) => a.status === 'Shortlisted').length;
    const interviews = apps.filter((a) => a.status === 'Interview').length;
    const offers = apps.filter((a) => a.status === 'Offered' || a.status === 'Hired').length;
    return res.status(200).json({
      success: true,
      stats: {
        totalApplications,
        shortlisted,
        interviews,
        offers
      }
    });
  } catch (error) {
    console.error('Student Analytics Error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().select('-password');
    // For now, if category is missing in model, we can infer it or default to 'unplaced'
    const studentsWithCategory = students.map(st => {
      const studentObj = st.toObject();
      if (!studentObj.category) {
        studentObj.category = 'unplaced'; // Default category
      }
      return studentObj;
    });
    return res.status(200).json({ success: true, students: studentsWithCategory });
  } catch (error) {
    console.error('Get All Students Error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const getPrepResources = async (req, res) => {
  try {
    const { q } = req.query;
    const query = (q || '').toLowerCase();

    const mockResources = [
      { id: 1, title: 'Top 50 Node.js Interview Questions', type: 'MCQs', category: 'Node.js', difficulty: 'Medium', link: 'https://www.interviewbit.com/node-js-interview-questions/' },
      { id: 2, title: 'Two Sum Problem - Arrays', type: 'Coding Problem', category: 'DSA', difficulty: 'Easy', link: 'https://leetcode.com/problems/two-sum/' },
      { id: 3, title: 'React Hooks Lifecycle Explained', type: 'Examples & Guide', category: 'React', difficulty: 'Advanced', link: 'https://react.dev/reference/react' },
      { id: 4, title: 'Quantitative Aptitude - Time & Work', type: 'Practice Set', category: 'Aptitude', difficulty: 'Medium', link: 'https://www.indiabix.com/aptitude/time-and-work/' },
      { id: 5, title: 'Reverse a Linked List', type: 'Coding Problem', category: 'DSA', difficulty: 'Medium', link: 'https://leetcode.com/problems/reverse-linked-list/' },
      { id: 6, title: 'Express Middleware Flow', type: 'Examples', category: 'Node.js', difficulty: 'Beginner', link: 'https://expressjs.com/en/guide/using-middleware.html' },
      { id: 7, title: 'React State Management (Redux vs Context)', type: 'Guide + MCQs', category: 'React', difficulty: 'Medium', link: 'https://redux.js.org/introduction/getting-started' },
      { id: 8, title: 'Logical Reasoning - Puzzles', type: 'Practice Set', category: 'Aptitude', difficulty: 'Hard', link: 'https://www.indiabix.com/logical-reasoning/puzzles/' }
    ];

    const filtered = (query === 'all' || query === 'placement preparation')
      ? mockResources
      : mockResources.filter(r => 
          r.category.toLowerCase().includes(query) || 
          r.title.toLowerCase().includes(query) ||
          r.type.toLowerCase().includes(query)
        );

    return res.status(200).json({ success: true, resources: filtered });
  } catch (error) {
    console.error('Prep Resources Error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = {
  studentSignup,
  studentLogin,
  sendPasswordResetEmail,
  startTest,
  getStudentProfile,
  updateStudentProfile,
  getStudentAnalytics,
  getAllStudents,
  getPrepResources
};
