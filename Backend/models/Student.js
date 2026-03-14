const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
<<<<<<< HEAD
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
=======
  fullName:   { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true, select: false },
  phone:      { type: String, required: true },
  branch:     { type: String, required: true },
  year:       { type: String, required: true },
  cgpa:       { type: Number, required: true },
  rollNumber: { type: String, default: '' },
  linkedin:   { type: String, default: '' },
  skills:     { type: [String], default: [] },
  resume:     { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
>>>>>>> UI
