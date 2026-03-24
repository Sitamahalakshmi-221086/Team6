const Job = require('../models/Job');
const Drive = require('../models/Drive');
const CompanyRequest = require('../models/CompanyRequest');
const Notification = require('../models/Notification');

const getNotificationsCount = async (req, res) => {
  try {
    const [pendingJobs, pendingDrives, pendingCompanyRequests] = await Promise.all([
      Job.countDocuments({ tpoApproval: 'pending' }),
      Drive.countDocuments({ submittedBy: 'company', status: 'Pending' }),
      CompanyRequest.countDocuments({ status: 'pending' })
    ]);

    res.status(200).json({
      success: true,
      count: pendingJobs + pendingDrives + pendingCompanyRequests
    });
  } catch (error) {
    console.error('getNotificationsCount error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications count' });
  }
};

const getStudentNotifications = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await Notification.find({ studentId: id })
      .populate('jobId')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    res.status(200).json({ success: true, notifications: rows });
  } catch (error) {
    console.error('getStudentNotifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student notifications' });
  }
};

module.exports = { getNotificationsCount, getStudentNotifications };
