const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: false, index: true },
    tpoId: { type: mongoose.Schema.Types.ObjectId, ref: 'TPO', required: false, index: true },
    type: { type: String, enum: ['open_job', 'drive', 'application', 'shortlist', 'system', 'company_reply'], required: true, index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'OpenJob', required: false, index: true },
    driveId: { type: mongoose.Schema.Types.ObjectId, ref: 'Drive', required: false, index: true },
    companyRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyRequest', default: null },
    message: { type: String, default: '', trim: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: false }
);


module.exports = mongoose.model('Notification', notificationSchema);

