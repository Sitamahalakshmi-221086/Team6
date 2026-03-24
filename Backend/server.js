const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (like resumes)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../Frontend')));

// Routes
// Routes
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/tpo', require('./routes/tpoRoutes'));
app.use('/api/jobs', require('./routes/jobsRoutes'));
app.use('/api/drives', require('./routes/drivesPublicRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/', require('./passport-oauth'));


// Email Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Send Email / OTP Route
app.post("/send-email", async (req, res) => {
  const { email, name, otp } = req.body;
  console.log("📩 Sending OTP to:", email);

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: "Missing email or otp." });
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
    global.otpStore = global.otpStore || {};
    global.otpStore[email] = otp;
    res.json({ success: true });

  } catch (err) {
    console.error("❌ Mail error:", err.message);
    res.status(500).json({ success: false, message: "Email sending failed." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
