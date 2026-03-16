const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { studentSignup, studentLogin } = require('../controllers/studentController');

// Ensure uploads directory exists (prevents ENOENT crash)
const uploadDir = path.join(__dirname, '..', 'uploads', 'resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ Created uploads/resumes directory');
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Saving resumes here
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// POST /api/students/signup
router.post('/signup', (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `File upload error: ${err.message}` });
    } else if (err) {
      return res.status(500).json({ success: false, message: `Upload failed: ${err.message}` });
    }
    studentSignup(req, res, next);
  });
});

// POST /api/students/login
router.post('/login', studentLogin);

module.exports = router;
