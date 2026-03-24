const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    type: { type: String, enum: ['open_job', 'drive', 'application'], required: true, index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'OpenJob', required: false, index: true },
    driveId: { type: mongoose.Schema.Types.ObjectId, ref: 'Drive', required: false, index: true },
    message: { type: String, default: '', trim: true },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

notificationSchema.index({ studentId: 1, type: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('Notification', notificationSchema);

