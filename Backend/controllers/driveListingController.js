const Drive = require('../models/Drive');
const DriveApplication = require('../models/DriveApplication');

const getApprovedDrivesForStudents = async (req, res) => {
  try {
    const studentId = req.query.studentId ? String(req.query.studentId) : null;

    const driveDocs = await Drive.find({ status: { $in: ['scheduled', 'Approved'] } })
      .sort({ date: 1 })
      .lean();

    if (studentId) {
      const apps = await DriveApplication.find({ studentId }).select('driveId').lean();
      const appliedSet = new Set(apps.map((a) => String(a.driveId)));
      const drives = driveDocs.map((d) => ({
        ...d,
        applied: appliedSet.has(String(d._id))
      }));
      return res.status(200).json({ success: true, drives });
    }

    res.status(200).json({ success: true, drives: driveDocs });
  } catch (error) {
    console.error('Get Drives Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = { getApprovedDrivesForStudents };
