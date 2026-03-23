const mongoose = require('mongoose');

const openJobNotificationSchema = new mongoose.Schema(
  {
    openJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'OpenJob', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },

    // simple audit fields
    channels: { type: [String], default: ['dashboard'] }, // e.g. ["email","dashboard"]
    emailSent: { type: Boolean, default: false },

    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

// prevent duplicate notifications per student/open-job
openJobNotificationSchema.index({ openJobId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('OpenJobNotification', openJobNotificationSchema);

