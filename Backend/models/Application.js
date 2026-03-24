const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
    // optional — open-job applications may not have a registered company
  },
  status: {
    type: String,
    enum: ['applied', 'New', 'Reviewed', 'Shortlisted', 'Interview', 'Offered', 'Hired', 'Rejected'],
    default: 'applied'
  },
  type: {
    type: String,
    enum: ['open', 'drive'],
    default: 'drive'
  },
  resume: {
    filename: String,
    path: String,
    contentType: String
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Application', ApplicationSchema);
