const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  companyName:   { type: String, required: true, trim: true },
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:      { type: String, required: true, select: false },
  contactPerson: { type: String, required: true },
  phone:         { type: String, required: true },
  industry:      { type: String, required: true },
  companySize:   { type: String, default: '' },
  website:       { type: String, default: '' },
  address:       { type: String, required: true },
  hiringRoles:   { type: [String], default: [] },
  description:   { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
