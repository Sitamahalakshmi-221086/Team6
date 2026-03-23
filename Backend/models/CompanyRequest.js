const mongoose = require('mongoose');

const companyRequestSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },

    // Optional link so the TPO can tie outreach to a specific open job card.
    openJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'OpenJob', default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CompanyRequest', companyRequestSchema);

