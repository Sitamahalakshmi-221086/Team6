const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Please provide your full name'],
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
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false // Don't return password by default
  },
  phone: {
    type: String,
    required: [true, 'Please provide your phone number']
  },
  branch: {
    type: String,
    required: [true, 'Please select your branch']
  },
  year: {
    type: String,
    required: [true, 'Please select your year of study']
  },
  cgpa: {
    type: Number,
    required: [true, 'Please provide your CGPA'],
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
    required: [true, 'Please provide your college name']
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
