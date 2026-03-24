const Job = require('../models/Job');
const Drive = require('../models/Drive');
const CompanyRequest = require('../models/CompanyRequest');

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

module.exports = { getNotificationsCount };
