const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  requirements: {
    type: [String],
    default: []
  },
  salary: {
    type: String
  },
  location: {
    type: String
  },
  jobType: {
    type: String,
    enum: ['Full Time', 'Part Time', 'Internship', 'Contract'],
    default: 'Full Time'
  },
  workMode: {
    type: String,
    enum: ['On-site', 'Hybrid', 'Remote'],
    default: 'On-site'
  },
  deadline: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Active', 'Draft', 'Closed'],
    default: 'Active'
  },
  tpoApproval: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  applicantsCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Job', JobSchema);
