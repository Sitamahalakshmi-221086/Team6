const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { studentSignup, studentLogin } = require('../controllers/studentController');
const Student = require('../models/Student');

// Ensure uploads directory exists (prevents ENOENT crash)
const uploadDir = path.join(__dirname, '..', 'uploads', 'resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ Created uploads/resumes directory');
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF, DOC, DOCX files are allowed'));
  }
});

// ── Auth Middleware ──
function authMiddleware(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

// ── Existing Routes ──
router.post('/signup', upload.single('resume'), studentSignup);
router.post('/login', studentLogin);

// ── NEW: Complete Profile after OAuth ──
router.patch('/complete-profile', authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    const { phone, branch, year, cgpa, college, rollNumber, linkedin, skills } = req.body;

    if (!phone || !branch || !year || !cgpa || !college) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields' });
    }

    const updateData = {
      phone,
      branch,
      year,
      cgpa:       parseFloat(cgpa),
      college,
      rollNumber: rollNumber || '',
      linkedin:   linkedin   || '',
      skills:     skills ? JSON.parse(skills) : [],
      isVerified: true,
    };

    if (req.file) {
      updateData.resume = {
        filename:    req.file.filename,
        path:        req.file.path,
        contentType: req.file.mimetype
      };
    }

    const student = await Student.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: false }
    );

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    res.json({ success: true, message: 'Profile completed successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;