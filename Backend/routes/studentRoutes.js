const express = require('express');
const router = express.Router();
const { studentSignup, studentLogin } = require('../controllers/studentController');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, 'uploads/resumes/'); },
  filename: function (req, file, cb) { cb(null, Date.now() + '-' + file.originalname); }
});
const upload = multer({ storage });

router.post('/signup', upload.single('resume'), studentSignup);
router.post('/login', studentLogin);

module.exports = router;
