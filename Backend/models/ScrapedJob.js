const mongoose = require('mongoose');

const scrapedJobSchema = new mongoose.Schema({
  company: { type: String, required: true },
  title: { type: String, required: true },
  portal: { type: String, default: 'CareerSpace' },
  location: { type: String },
  stipend: { type: String },
  package: { type: String },
  companyEmail: { type: String },
  driveRequested: { type: Boolean, default: false },
  driveAccepted: { type: Boolean, default: false },
  driveRejected: { type: Boolean, default: false },
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyRequest' },
  scrapedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ScrapedJob', scrapedJobSchema);
