const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    filename: { type: String, default: '' },
    path: { type: String, default: '' },
    contentType: { type: String, default: '' }
  },
  { _id: false }
);

const openJobApplicationSchema = new mongoose.Schema({
  openJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'OpenJob', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },

  status: {
    type: String,
    enum: ['Applied'],
    default: 'Applied'
  },

  resume: { type: resumeSchema, default: undefined },

  createdAt: { type: Date, default: Date.now }
});

// prevent duplicate applications
openJobApplicationSchema.index({ openJobId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('OpenJobApplication', openJobApplicationSchema);

