const mongoose = require('mongoose');

const scrapedJobSchema = new mongoose.Schema({
  portal: { type: String, required: true, trim: true },
  company: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  branches: { type: [String], default: [] },
  type: { type: String, default: 'Full-time' },
  stipend: { type: String, default: '' },
  skills: { type: [String], default: [] },
  location: { type: String, default: '' },
  postedDate: { type: String, default: '' },
  driveRequested: { type: Boolean, default: false },
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyRequest', default: null },
  companyEmail: { type: String, default: '' },
  scrapedAt: { type: Date, default: Date.now },
  publishedToStudents : { type: Boolean, default: false },
  openJobId           : { type: mongoose.Schema.Types.ObjectId, ref: 'OpenJob', default: null },
}, { timestamps: true }
  );

module.exports = mongoose.model('ScrapedJob', scrapedJobSchema);
