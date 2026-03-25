
const mongoose = require('mongoose');

const OpenJobSchema = new mongoose.Schema({
  scrapedJobId    : { type: mongoose.Schema.Types.ObjectId, ref: 'ScrapedJob', default: null },
  companyName     : { type: String, required: true, trim: true },
  title           : { type: String, required: true, trim: true },
  description     : { type: String, default: '' },
  location        : { type: String, default: '' },
  requiredBranches: [{ type: String }],
  skills          : [{ type: String }],
  type            : { type: String, default: 'Full-time' },
  package         : { type: String, default: '' },
  companyEmail    : { type: String, default: '' },
  portal          : { type: String, default: '' },
  publishedBy     : { type: mongoose.Schema.Types.ObjectId, ref: 'TPO', default: null },
  publishedAt     : { type: Date, default: Date.now },
  isNotified      : { type: Boolean, default: false },
  outreachStatus  : { type: String, enum: ['none','pending','accepted','rejected'], default: 'none' },
  outreachCreatedAt: { type: Date, default: null },
  driveRequested  : { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.models.OpenJob || mongoose.model('OpenJob', OpenJobSchema);
