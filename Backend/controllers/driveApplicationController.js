const Drive = require('../models/Drive');
const DriveApplication = require('../models/DriveApplication');
const Student = require('../models/Student');

async function applyToDrive(req, res) {
  try {
    const { driveId, studentId } = req.body || {};
    if (!driveId || !studentId) {
      return res.status(400).json({ success: false, message: 'driveId and studentId are required' });
    }

    const drive = await Drive.findById(driveId).lean();
    if (!drive) return res.status(404).json({ success: false, message: 'Drive not found' });

    // Only allow applying to scheduled (or legacy approved) drives.
    const allowed = drive.status === 'scheduled' || drive.status === 'Approved';
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Drive is not open for applications' });
    }

    const existing = await DriveApplication.findOne({ driveId, studentId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already applied for this drive' });
    }

    let resume = undefined;
    if (req.file) {
      resume = {
        filename: req.file.filename,
        path: req.file.path,
        contentType: req.file.mimetype
      };
    } else {
      const st = await Student.findById(studentId).select('resume.filename resume.path resume.contentType');
      if (st && st.resume && st.resume.filename) {
        resume = {
          filename: st.resume.filename,
          path: st.resume.path,
          contentType: st.resume.contentType
        };
      }
    }

    if (!resume) {
      return res.status(400).json({ success: false, message: 'Resume is required to apply' });
    }

    const application = await DriveApplication.create({
      driveId,
      studentId,
      status: 'Applied',
      resume
    });

    res.status(201).json({ success: true, message: 'Drive application submitted', application });
  } catch (err) {
    console.error('applyToDrive error:', err);
    res.status(500).json({ success: false, message: 'Failed to apply to drive' });
  }
}

async function updateDrive(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body || {};

    const allowedUpdates = {};
    if (updates.date) allowedUpdates.date = updates.date;
    if (updates.status) allowedUpdates.status = updates.status;
    if (typeof updates.companyName === 'string') allowedUpdates.companyName = updates.companyName.trim();
    if (typeof updates.roles === 'string') allowedUpdates.roles = updates.roles;
    if (typeof updates.role === 'string') allowedUpdates.role = updates.role;
    if (typeof updates.location === 'string') allowedUpdates.location = updates.location;
    if (Array.isArray(updates.eligibleBranches)) allowedUpdates.eligibleBranches = updates.eligibleBranches;
    if (typeof updates.eligibility === 'string') allowedUpdates.eligibility = updates.eligibility;

    const drive = await Drive.findByIdAndUpdate(id, allowedUpdates, { new: true });
    if (!drive) return res.status(404).json({ success: false, message: 'Drive not found' });
    res.status(200).json({ success: true, drive });
  } catch (err) {
    console.error('updateDrive error:', err);
    res.status(500).json({ success: false, message: 'Failed to update drive' });
  }
}

module.exports = {
  applyToDrive,
  updateDrive
};

