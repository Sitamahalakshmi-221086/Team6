const Interview = require('../models/Interview');
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

// Schedule interview
const scheduleInterview = async (req, res) => {
  try {
    const {
      applicationId,
      scheduledDate,
      duration = 60,
      interviewType = 'Technical',
      location,
      meetingLink,
      interviewers = [],
      notes
    } = req.body;

    if (!applicationId || !scheduledDate) {
      return res.status(400).json({ success: false, message: 'applicationId and scheduledDate required' });
    }

    const application = await Application.findById(applicationId).populate('studentId jobId companyId');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Check if interview already exists
    const existingInterview = await Interview.findOne({ applicationId, status: { $in: ['scheduled', 'confirmed'] } });
    if (existingInterview) {
      return res.status(400).json({ success: false, message: 'Interview already scheduled for this application' });
    }

    const interview = new Interview({
      applicationId,
      studentId: application.studentId._id,
      companyId: application.companyId._id,
      jobId: application.jobId._id,
      scheduledDate: new Date(scheduledDate),
      duration,
      interviewType,
      location,
      meetingLink,
      interviewers,
      notes,
      createdBy: req.companyId || req.tpoId // Assuming auth middleware sets this
    });

    await interview.save();

    // Update application status
    await Application.findByIdAndUpdate(applicationId, { status: 'Interview' });

    // Send email to student
    const student = application.studentId;
    const job = application.jobId;
    const company = application.companyId;

    const emailHtml = `
      <p>Dear ${student.fullName},</p>
      <p>Your interview for <strong>${job.title}</strong> at <strong>${company.companyName}</strong> has been scheduled.</p>
      <p><strong>Interview Details:</strong></p>
      <ul>
        <li><strong>Date & Time:</strong> ${new Date(scheduledDate).toLocaleString()}</li>
        <li><strong>Duration:</strong> ${duration} minutes</li>
        <li><strong>Type:</strong> ${interviewType}</li>
        ${location ? `<li><strong>Location:</strong> ${location}</li>` : ''}
        ${meetingLink ? `<li><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></li>` : ''}
        ${interviewers.length > 0 ? `<li><strong>Interviewers:</strong> ${interviewers.map(i => i.name).join(', ')}</li>` : ''}
      </ul>
      <p>Please confirm your availability by logging into your dashboard.</p>
      <p>Best regards,<br>Campus Placement Team</p>
    `;

    if (student.email) {
      transporter.sendMail({
        from: `"CampusPlace" <${process.env.GMAIL_USER}>`,
        to: student.email,
        subject: `Interview Scheduled: ${job.title} at ${company.companyName}`,
        html: emailHtml
      }).catch(() => {});
    }

    // Create notification
    await Notification.create({
      userId: student._id,
      type: 'interview_scheduled',
      message: `Interview scheduled for ${job.title} at ${company.companyName} on ${new Date(scheduledDate).toLocaleDateString()}`,
      read: false
    });

    res.status(201).json({ success: true, interview });
  } catch (error) {
    console.error('scheduleInterview error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Get interviews for company
const getCompanyInterviews = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { status, upcoming } = req.query;

    let query = { companyId };
    if (status) query.status = status;
    if (upcoming === 'true') {
      query.scheduledDate = { $gte: new Date() };
    }

    const interviews = await Interview.find(query)
      .populate('studentId', 'fullName email rollNumber')
      .populate('jobId', 'title')
      .sort({ scheduledDate: 1 });

    res.status(200).json({ success: true, interviews });
  } catch (error) {
    console.error('getCompanyInterviews error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Get interviews for student
const getStudentInterviews = async (req, res) => {
  try {
    const { studentId } = req.params;
    const interviews = await Interview.find({ studentId })
      .populate('companyId', 'companyName')
      .populate('jobId', 'title')
      .sort({ scheduledDate: 1 });

    res.status(200).json({ success: true, interviews });
  } catch (error) {
    console.error('getStudentInterviews error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Update interview status
const updateInterviewStatus = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { status, feedback } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    interview.status = status;
    if (feedback) {
      interview.feedback = feedback;
    }
    interview.updatedAt = new Date();

    await interview.save();

    // If completed with feedback, update application status
    if (status === 'completed' && feedback) {
      const application = await Application.findById(interview.applicationId);
      if (application) {
        if (feedback.recommended === 'Yes') {
          await Application.findByIdAndUpdate(interview.applicationId, { status: 'Offered' });
        } else if (feedback.recommended === 'No') {
          await Application.findByIdAndUpdate(interview.applicationId, { status: 'Rejected' });
        }
      }
    }

    // Create notification for student
    await Notification.create({
      userId: interview.studentId,
      type: 'interview_update',
      message: `Interview status updated to ${status} for ${interview.jobId.title}`,
      read: false
    });

    res.status(200).json({ success: true, interview });
  } catch (error) {
    console.error('updateInterviewStatus error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Confirm interview (by student)
const confirmInterview = async (req, res) => {
  try {
    const { interviewId } = req.params;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    if (interview.studentId.toString() !== req.studentId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    interview.status = 'confirmed';
    interview.updatedAt = new Date();
    await interview.save();

    // Create notification for company
    await Notification.create({
      userId: interview.companyId,
      type: 'interview_confirmed',
      message: `Student confirmed interview for ${interview.jobId.title}`,
      read: false
    });

    res.status(200).json({ success: true, message: 'Interview confirmed' });
  } catch (error) {
    console.error('confirmInterview error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Cancel interview
const cancelInterview = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { reason } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    interview.status = 'cancelled';
    interview.notes = (interview.notes || '') + `\nCancelled: ${reason}`;
    interview.updatedAt = new Date();
    await interview.save();

    // Update application status back
    await Application.findByIdAndUpdate(interview.applicationId, { status: 'Shortlisted' });

    // Notify student
    await Notification.create({
      userId: interview.studentId,
      type: 'interview_cancelled',
      message: `Interview cancelled for ${interview.jobId.title}`,
      read: false
    });

    res.status(200).json({ success: true, message: 'Interview cancelled' });
  } catch (error) {
    console.error('cancelInterview error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Get available time slots for scheduling
const getAvailableSlots = async (req, res) => {
  try {
    const { companyId, date } = req.query;
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(9, 0, 0, 0); // 9 AM
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(17, 0, 0, 0); // 5 PM

    // Get existing interviews for the day
    const existingInterviews = await Interview.find({
      companyId,
      scheduledDate: {
        $gte: startOfDay,
        $lt: endOfDay
      },
      status: { $in: ['scheduled', 'confirmed'] }
    }).select('scheduledDate duration');

    // Generate available slots (1-hour intervals)
    const slots = [];
    let currentTime = new Date(startOfDay);

    while (currentTime < endOfDay) {
      const slotEnd = new Date(currentTime.getTime() + 60 * 60 * 1000); // 1 hour later

      // Check if slot conflicts with existing interviews
      const conflict = existingInterviews.some(interview => {
        const interviewEnd = new Date(interview.scheduledDate.getTime() + interview.duration * 60 * 1000);
        return (currentTime < interviewEnd && slotEnd > interview.scheduledDate);
      });

      if (!conflict) {
        slots.push({
          start: currentTime.toISOString(),
          end: slotEnd.toISOString(),
          available: true
        });
      }

      currentTime = slotEnd;
    }

    res.status(200).json({ success: true, slots });
  } catch (error) {
    console.error('getAvailableSlots error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = {
  scheduleInterview,
  getCompanyInterviews,
  getStudentInterviews,
  updateInterviewStatus,
  confirmInterview,
  cancelInterview,
  getAvailableSlots
};