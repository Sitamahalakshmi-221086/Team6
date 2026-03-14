const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
<<<<<<< HEAD
  companyName: {
    type: String,
    required: [true, 'Please provide the company name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide the official email'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  contactPerson: {
    type: String,
    required: [true, 'Please provide a contact person name'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number']
  },
  industry: {
    type: String,
    required: [true, 'Please select an industry']
  },
  companySize: {
    type: String,
    enum: ['', '1–50 employees', '51–200 employees', '201–1000 employees', '1001–5000 employees', '5000+ employees'],
    default: ''
  },
  website: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Please provide the company address'],
    trim: true
  },
  hiringRoles: {
    type: [String],
    default: []
  },
  description: {
    type: String,
    trim: true
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
  collection: 'companies'
});

const Company = mongoose.model('Company', companySchema);

module.exports = Company;
=======
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
>>>>>>> UI
