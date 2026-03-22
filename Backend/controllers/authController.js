exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
  }

  // Simple dummy OTP logic (no database)
  if (otp === '123456') {
    return res.json({ success: true, message: 'OTP verified successfully.' });
  } else {
    return res.status(400).json({ success: false, message: 'Invalid OTP.' });
  }
};

exports.resendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  // Simple dummy logic -> Returns success immediately
  return res.json({ success: true, message: 'OTP resent successfully.' });
};
