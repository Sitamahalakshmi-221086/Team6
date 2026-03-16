const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: function() { return !this.isOAuth; },
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide your college email'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() { return !this.isOAuth; },
    minlength: 8,
    select: false
  },
  phone: {
    type: String,
    required: function() { return !this.isOAuth; },
  },
  branch: {
    type: String,
    required: function() { return !this.isOAuth; },
  },
  year: {
    type: String,
    required: function() { return !this.isOAuth; },
  },
  cgpa: {
    type: Number,
    required: function() { return !this.isOAuth; },
    min: 0,
    max: 10
  },
  rollNumber: {
    type: String,
    trim: true
  },
  college: {
    type: String,
    trim: true,
    required: function() { return !this.isOAuth; },
  },
  linkedin: {
    type: String,
    trim: true
  },
  skills: {
    type: [String],
    default: []
  },
  github: {
    type: String,
    trim: true
  },
  preferredLocation: {
    type: String,
    trim: true
  },
  resume: {
    filename: String,
    path: String,
    contentType: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },

  // ── OAuth fields ──
  isOAuth: {
    type: Boolean,
    default: false
  },
  oauthProvider: {
    type: String,
    default: null
  },
  oauthId: {
    type: String,
    default: null
  },
  avatarUrl: {
    type: String,
    default: ''
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'students'
});

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;