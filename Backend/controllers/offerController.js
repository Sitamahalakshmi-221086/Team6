const Application = require('../models/Application');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

// Send offer emails to shortlisted students for a drive/job
const sendOfferEmails = async (req, res) => {
  try {
    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ success: false, message: 'jobId required' });

    const applications = await Application.find({ jobId, status: 'Shortlisted' }).populate('studentId');
    if (!applications.length) return res.status(404).json({ success: false, message: 'No shortlisted students found' });

    const job = await Job.findById(jobId).populate('companyId');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const emails = [];
    for (const app of applications) {
      const student = app.studentId;
      if (student && student.email) {
        const offerLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/student-dashboard.html?offer=${app._id}`;
        const mailOptions = {
          from: `"CampusPlace" <${process.env.GMAIL_USER}>`,
          to: student.email,
          subject: `Job Offer from ${job.companyId.companyName}`,
          html: `
            <p>Dear ${student.name},</p>
            <p>Congratulations! You have been selected for the position of <strong>${job.title}</strong> at <strong>${job.companyId.companyName}</strong>.</p>
            <p>Please review and accept/reject the offer: <a href="${offerLink}">View Offer</a></p>
            <p>Best regards,<br>Campus Placement Team</p>
          `
        };
        emails.push(transporter.sendMail(mailOptions));
        // Update application status to Offered
        await Application.findByIdAndUpdate(app._id, { status: 'Offered' });
        // Create notification
        await Notification.create({
          userId: student._id,
          type: 'offer',
          message: `You have received a job offer for ${job.title} from ${job.companyId.companyName}`,
          read: false
        });
      }
    }

    await Promise.all(emails);
    res.status(200).json({ success: true, message: `Offers sent to ${emails.length} students` });
  } catch (error) {
    console.error('sendOfferEmails error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Student accepts offer
const acceptOffer = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const application = await Application.findById(applicationId).populate('studentId jobId');
    if (!application || application.status !== 'Offered') return res.status(404).json({ success: false, message: 'Offer not found' });

    // Update status to Hired
    await Application.findByIdAndUpdate(applicationId, { status: 'Hired' });
    // Update student placement status
    await Student.findByIdAndUpdate(application.studentId._id, { placementStatus: 'Placed' });
    // Notification
    await Notification.create({
      userId: application.studentId._id,
      type: 'placement',
      message: `Congratulations! You have accepted the offer for ${application.jobId.title}`,
      read: false
    });

    res.status(200).json({ success: true, message: 'Offer accepted successfully' });
  } catch (error) {
    console.error('acceptOffer error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Student rejects offer
const rejectOffer = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const application = await Application.findById(applicationId).populate('studentId jobId');
    if (!application || application.status !== 'Offered') return res.status(404).json({ success: false, message: 'Offer not found' });

    // Update status to Rejected
    await Application.findByIdAndUpdate(applicationId, { status: 'Rejected' });
    // Notification
    await Notification.create({
      userId: application.studentId._id,
      type: 'offer_rejected',
      message: `You have rejected the offer for ${application.jobId.title}`,
      read: false
    });

    res.status(200).json({ success: true, message: 'Offer rejected' });
  } catch (error) {
    console.error('rejectOffer error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Get offers for a student
const getStudentOffers = async (req, res) => {
  try {
    const { studentId } = req.params;
    const offers = await Application.find({ studentId, status: 'Offered' }).populate('jobId companyId');
    res.status(200).json({ success: true, offers });
  } catch (error) {
    console.error('getStudentOffers error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = {
  sendOfferEmails,
  acceptOffer,
  rejectOffer,
  getStudentOffers
};