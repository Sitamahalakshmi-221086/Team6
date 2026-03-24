const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const nodemailer = require('nodemailer');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Static folder for resumes
app.use(express.static(path.resolve(__dirname, '..', 'Frontend'))); // Serve frontend files

// Email Transporter (using credentials from .env)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

// Routes
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/company', require('./routes/companyRoutes'));
app.use('/api/tpo', require('./routes/tpoRoutes'));
app.use('/api/open-jobs', require('./routes/openJobsRoutes'));
app.use('/api/notifications', require('./routes/notificationsRoutes'));
app.use('/api/jobs', require('./routes/jobsRoutes'));
app.use('/api/drives', require('./routes/drivesPublicRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));

// OTP Email Route
app.post("/send-email", async (req, res) => {
  const { email, name, otp } = req.body;
  console.log("📩 Sending OTP to:", email);

  if (!email || !otp) {
    return res.status(400).json({ message: "Missing email or otp." });
  }

  try {
    await transporter.sendMail({
      from: `"CampusPlace" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Your CampusPlace OTP: ${otp}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;">
          <h2 style="color:#1e3a8a;">CampusPlace Email Verification</h2>
          <p>Hello <strong>${name || "User"}</strong>,</p>
          <p>Your one-time password is:</p>
          <div style="font-size:36px;font-weight:800;letter-spacing:10px;color:#2563eb;padding:16px 0;">${otp}</div>
          <p style="color:#64748b;font-size:13px;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
        </div>
      `
    });

    console.log("✅ OTP sent to:", email);
    res.json({ success: true });

  } catch (err) {
    console.error("❌ Mail error:", err.message);
    // If mail fails, we still return a response
    res.status(500).json({ success: false, message: "Email sending failed. Please check GMAIL_USER and GMAIL_PASS in .env" });
  }
});

app.get('/', (req, res) => {
  res.send('✅ Campus Recruitment API is running...');
});

// Set PORT
const PORT = process.env.PORT || 5000;

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
