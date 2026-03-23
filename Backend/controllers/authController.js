const nodemailer = require('nodemailer');

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
  }

  // Cross-reference the true random OTP from server memory
  global.otpStore = global.otpStore || {};
  const expectedOtp = global.otpStore[email];

  if (expectedOtp && otp === expectedOtp) {
    // Clear it out for security after successful use
    delete global.otpStore[email];
    return res.json({ success: true, message: 'OTP verified successfully.' });
  } else {
    return res.status(400).json({ success: false, message: 'Invalid OTP. Please check the code and try again.' });
  }
};

exports.resendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  global.otpStore = global.otpStore || {};
  // Recover existing OTP or forge a brand new random one if needed
  let codeToSend = global.otpStore[email];
  if (!codeToSend) {
    codeToSend = Math.floor(100000 + Math.random() * 900000).toString();
    global.otpStore[email] = codeToSend;
  }

  try {
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

    await transporter.sendMail({
      from: `"CampusPlace" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Your CampusPlace OTP is: ${codeToSend}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;">
          <h2 style="color:#1e3a8a;">CampusPlace Email Verification</h2>
          <p>Hello,</p>
          <p>Your one-time password has been resent:</p>
          <div style="font-size:36px;font-weight:800;letter-spacing:10px;color:#2563eb;padding:16px 0;">${codeToSend}</div>
          <p style="color:#64748b;font-size:13px;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
        </div>
      `
    });

    return res.json({ success: true, message: 'OTP resent successfully.' });
  } catch (err) {
    console.error("❌ Resend mail error:", err.message);
    return res.status(500).json({ success: false, message: 'Email resending failed.' });
  }
};
