import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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
    res.status(500).json({ message: "Email sending failed." });
  }
});

app.listen(3000, () => console.log("✅ Server running on http://localhost:3000"));
