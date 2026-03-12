const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { studentSignup, studentLogin } = require('../controllers/studentController');

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/resumes'); // Saving resumes here
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
router.post('/signup', upload.single('resume'), (req, res, next) => {
  // Pass the request to the controller
  studentSignup(req, res, next);
});

// POST /api/students/login
router.post('/login', studentLogin);

module.exports = router;

