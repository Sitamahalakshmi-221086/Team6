const mongoose = require('mongoose');
const crypto = require('crypto');

const CompanyRequestSchema = new mongoose.Schema({
  companyName  : { type: String, required: true },
  companyEmail : { type: String, default: '' },
  role         : { type: String, default: '' },
  message      : { type: String, default: '' },
  driveDate    : { type: Date, default: null },
  location     : { type: String, default: '' },
  package      : { type: String, default: '' },
  branches     : [String],
  openJobId    : { type: mongoose.Schema.Types.ObjectId, default: null },
  tpoId        : { type: mongoose.Schema.Types.ObjectId, ref: 'TPO', default: null },
  studentIds   : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  status       : { type: String, enum: ['pending','accepted','rejected'], default: 'pending' },
  details      : { type: String, default: '' },

  // Token for email Accept/Reject links
  token        : { type: String, default: () => crypto.randomBytes(32).toString('hex'), unique: true }
}, { timestamps: true });

module.exports = mongoose.model('CompanyRequest', CompanyRequestSchema);