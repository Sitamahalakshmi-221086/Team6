const mongoose = require('mongoose');

const InterviewSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    default: 60
  },
  interviewType: {
    type: String,
    enum: ['Technical', 'HR', 'Behavioral', 'Panel', 'Online', 'Offline'],
    default: 'Technical'
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  location: {
    type: String, // For offline interviews
    trim: true
  },
  meetingLink: {
    type: String, // For online interviews
    trim: true
  },
  interviewers: [{
    name: String,
    email: String,
    role: String
  }],
  notes: {
    type: String,
    trim: true
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String,
    recommended: {
      type: String,
      enum: ['Yes', 'No', 'Maybe']
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company', // or 'TPO' if TPO schedules
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'interviews'
});

// Index for efficient queries
InterviewSchema.index({ scheduledDate: 1, companyId: 1 });
InterviewSchema.index({ studentId: 1, status: 1 });

module.exports = mongoose.model('Interview', InterviewSchema);