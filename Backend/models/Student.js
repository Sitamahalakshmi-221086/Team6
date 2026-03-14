const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
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
