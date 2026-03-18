const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const connectDB = require('./config/db');
const oauthRoutes = require('./passport-oauth');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
  credentials: true
}));
app.use(express.json());
app.use((req, res, next) => {
  if (req.method === 'POST') {
    console.log(`[DEBUG] POST ${req.url} body:`, JSON.stringify(req.body, null, 2));
  }
  next();
});
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Email Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

// ✅ Check if student email already exists — MUST be before app.use('/api/students', ...)
app.post('/api/students/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    const Student = require('./models/Student');
    const exists = await Student.findOne({ email: email.trim().toLowerCase() });
    res.json({ exists: !!exists });
  } catch (err) {
    console.error('check-email error:', err.message);
    res.status(500).json({ exists: false });
  }
});

// Routes
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/tpo', require('./routes/tpoRoutes'));
app.use(oauthRoutes);

// OTP Email Route
app.post("/send-email", async (req, res) => {
  const { email, name, otp } = req.body;
  console.log("📩 Sending OTP to:", email);

  if (!email || !otp) {
    return res.status(400).json({ message: "Missing email or otp." });
  }

  try {
    await transporter.sendMail({
      from:    `"CampusPlace" <${process.env.GMAIL_USER}>`,
      to:      email,
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
    res.status(500).json({ success: false, message: "Email sending failed. Please check GMAIL_USER and GMAIL_PASS in .env" });
  }
});

app.get('/', (req, res) => {
  res.send('✅ Campus Recruitment API is running...');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});