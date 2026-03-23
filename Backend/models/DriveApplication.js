const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    filename: { type: String, default: '' },
    path: { type: String, default: '' },
    contentType: { type: String, default: '' }
  },
  { _id: false }
);

const driveApplicationSchema = new mongoose.Schema({
  driveId: { type: mongoose.Schema.Types.ObjectId, ref: 'Drive', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },

  status: {
    type: String,
    enum: ['Applied', 'Submitted'],
    default: 'Applied'
  },

  resume: { type: resumeSchema, default: undefined },

  createdAt: { type: Date, default: Date.now }
});

driveApplicationSchema.index({ driveId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('DriveApplication', driveApplicationSchema);

