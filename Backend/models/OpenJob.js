const mongoose = require('mongoose');

const openJobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  companyName: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  location: { type: String, required: true, default: '' },
  package: { type: String, required: true, default: '' }, // labeled as "package" per spec
  requiredBranches: { type: [String], default: [] },
  applyLink: { type: String, required: true, default: '' },
  createdAt: { type: Date, default: Date.now },
  lastSyncedAt: { type: Date, default: Date.now }
});

openJobSchema.index({ title: 1, companyName: 1 }, { unique: true });

module.exports = mongoose.model('OpenJob', openJobSchema);

