const mongoose = require('mongoose');

const driveApplicationSchema = new mongoose.Schema({
  drive: { type: mongoose.Schema.Types.ObjectId, ref: 'Drive', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },

  status: {
    type: String,
    enum: ['Applied', 'Shortlisted', 'Interview', 'Rejected', 'Offered', 'Hired'],
    default: 'Applied'
  },

  resume: {
    filename: { type: String, default: '' },
    path: { type: String, default: '' },
    contentType: { type: String, default: '' }
  },

  createdAt: { type: Date, default: Date.now }
});

driveApplicationSchema.index({ drive: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('DriveApplication', driveApplicationSchema);
