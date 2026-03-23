const Drive = require('../models/Drive');

const getApprovedDrivesForStudents = async (req, res) => {
  try {
    const drives = await Drive.find({ status: 'Approved' }).sort({ date: 1 }).lean();
    res.status(200).json({ success: true, drives });
  } catch (error) {
    console.error('Get Drives Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = { getApprovedDrivesForStudents };
