const Job = require('../models/Job');

const studentJobMatch = {
  $and: [
    { $or: [{ tpoApproval: 'approved' }, { tpoApproval: { $exists: false } }] },
    { status: { $ne: 'Closed' } }
  ]
};

const getApprovedJobsForStudents = async (req, res) => {
  try {
    const jobs = await Job.find(studentJobMatch)
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({ success: true, jobs });
  } catch (error) {
    console.error('Get Jobs Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const getJobsByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const jobs = await Job.find({ companyId }).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, jobs });
  } catch (error) {
    console.error('Get Jobs By Company Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = { getApprovedJobsForStudents, getJobsByCompany, studentJobMatch };
