const mongoose = require('mongoose');

const companyRequestSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    companyEmail: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    driveDate: { type: Date, default: null },
    location: { type: String, default: '' },
    package: { type: String, default: '' },
    branches: { type: [String], default: [] },
    token: {
      type: String,
      default: () => require('crypto').randomBytes(16).toString('hex'),
      unique: true
    },
    openJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScrapedJob', default: null },
    tpoId: { type: mongoose.Schema.Types.ObjectId, ref: 'TPO', default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CompanyRequest', companyRequestSchema);
