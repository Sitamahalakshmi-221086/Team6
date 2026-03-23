const mongoose = require('mongoose');

const driveSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  // New fields (spec-aligned)
  location: {
    type: String,
    default: ''
  },
  eligibility: {
    type: String,
    required: true
  },
  eligibleBranches: {
    type: [String],
    default: []
  },
  roles: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'scheduled'],
    default: 'Pending'
  },
  submittedBy: {
    type: String,
    enum: ['company', 'tpo'],
    default: 'tpo'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TPO',
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Drive', driveSchema);
