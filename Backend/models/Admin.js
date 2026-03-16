const mongoose = require('mongoose');

const tpoSchema = new mongoose.Schema({
  fullName:      { type: String, required: true, trim: true },
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:      { type: String, required: true, select: false },
  phone:         { type: String, required: true },
  college:       { type: String, required: true, trim: true },
  designation:   { type: String, required: true },
  department:    { type: String, default: '' },
  location:      { type: String, required: true },
  collegeCode:   { type: String, required: true },
  accreditation: { type: String, default: '' },
  about:         { type: String, default: '' },
}, { timestamps: true, collection: 'admins' });

module.exports = mongoose.model('Admin', tpoSchema);
