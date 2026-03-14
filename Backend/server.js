const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const nodemailer = require('nodemailer');
require('dotenv').config();

const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));

// ================= OTP EMAIL SETUP =================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

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
          <p style="color:#64748b;font-size:13px;">This OTP is valid for <strong>10 minutes</strong>. Do not share it.</p>
        </div>
      `
    });

    console.log("✅ OTP sent to:", email);
    res.json({ success: true });

  } catch (err) {
    console.error("❌ Mail error:", err.message);
    res.status(500).json({ message: "Email sending failed." });
  }
});

// Test route
app.get('/', (req, res) => {
  res.send('✅ Campus Recruitment API is running...');
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});


sed -i "s|app.use('/api/companies'|app.use('/api/tpo', require('./routes/tpoRoutes'));\napp.use('/api/companies'|" ~/Team6/Backend/server.js