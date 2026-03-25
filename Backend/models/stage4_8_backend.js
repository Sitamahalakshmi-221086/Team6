// ═══════════════════════════════════════════════════════════════════
//  CAMPUSPLACE — STAGES 4–8 BACKEND ADDITIONS
//  Add / replace these in tpoController.js and tpoRoutes.js
// ═══════════════════════════════════════════════════════════════════

// ─── STAGE 4: TPO reviews applicants then shortlists ──────────────
// Already handled by:
//   GET  /api/applications/tpo        → loadTPOApplicationsSection()
//   POST /api/tpo/shortlist/:driveId  → shortlistStudentsForDrive()
// Both exist and work. No changes needed.

// ═══════════════════════════════════════════════════════════════════
// STAGE 5 — TPO sends drive request to company WITH shortlisted list
//   POST /api/tpo/send-drive-request
//
//  The existing sendDriveRequest() sends the email but does NOT
//  include the student list.  This replacement builds the student
//  table inside the email HTML.
// ═══════════════════════════════════════════════════════════════════
const sendDriveRequestWithStudents = async (req, res) => {
  try {
    const {
      companyName, companyEmail, role, message,
      driveDate, location, package: pkg,
      branches, scrapedJobId, openJobId, tpoId,
      studentIds   // ← array of studentId strings selected by TPO
    } = req.body;

    if (!companyName || !companyEmail || !role) {
      return res.status(400).json({
        success: false,
        message: 'companyName, companyEmail, and role are required'
      });
    }

    // ── Fetch shortlisted student details for the email ──
    const Student = require('../models/Student');
    let studentRows = '';
    let studentList = [];
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      studentList = await Student.find({ _id: { $in: studentIds } })
        .select('fullName branch year cgpa rollNumber email')
        .lean();
    } else if (openJobId || scrapedJobId) {
      // Auto-pull all students who applied to this open job
      const Application = require('../models/Application');
      const jobRef = openJobId || scrapedJobId;
      const apps = await Application.find({ jobId: jobRef })
        .populate('studentId', 'fullName branch year cgpa rollNumber email')
        .lean();
      studentList = apps
        .map(a => a.studentId)
        .filter(Boolean);
    }

    if (studentList.length > 0) {
      const rows = studentList.map((s, i) => `
        <tr style="background:${i % 2 === 0 ? '#f8fafc' : '#fff'};">
          <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;">${i + 1}</td>
          <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;font-weight:600;">${s.fullName || '—'}</td>
          <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;">${s.rollNumber || '—'}</td>
          <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;">${s.branch || '—'}</td>
          <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;">${s.year || '—'}</td>
          <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;font-weight:600;">${s.cgpa != null ? s.cgpa : '—'}</td>
        </tr>`).join('');

      studentRows = `
        <h3 style="font-size:15px;color:#1e293b;margin:24px 0 8px;">Shortlisted Students (${studentList.length})</h3>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:13px;color:#334155;">
            <thead>
              <tr style="background:#7c3aed;color:#fff;">
                <th style="padding:9px 10px;text-align:left;">#</th>
                <th style="padding:9px 10px;text-align:left;">Name</th>
                <th style="padding:9px 10px;text-align:left;">Roll No.</th>
                <th style="padding:9px 10px;text-align:left;">Branch</th>
                <th style="padding:9px 10px;text-align:left;">Year</th>
                <th style="padding:9px 10px;text-align:left;">CGPA</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }

    // ── Create CompanyRequest record with a token ──
    const CompanyRequest = require('../models/CompanyRequest');
    const ScrapedJob     = require('../models/ScrapedJob');

    const companyRequest = await CompanyRequest.create({
      companyName: companyName.trim(),
      companyEmail: companyEmail.trim(),
      role: role.trim(),
      message: (message || `We would like to invite ${companyName} for a campus recruitment drive.`).trim(),
      driveDate: driveDate ? new Date(driveDate) : null,
      location: location || '',
      package: pkg || '',
      branches: branches || [],
      openJobId: openJobId || scrapedJobId || null,
      tpoId: tpoId || null,
      studentIds: studentList.map(s => s._id),
      status: 'pending'
    });

    if (scrapedJobId) {
      await ScrapedJob.findByIdAndUpdate(scrapedJobId, {
        driveRequested: true,
        requestId: companyRequest._id
      }).catch(() => {});
    }

    const baseUrl = process.env.CALLBACK_BASE || `http://localhost:${process.env.PORT || 5005}`;
    const acceptUrl = `${baseUrl}/api/drive-response/${companyRequest.token}/accept`;
    const rejectUrl = `${baseUrl}/api/drive-response/${companyRequest.token}/reject`;

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
    });

    await transporter.sendMail({
      from: `"CampusPlace – TPO Office" <${process.env.GMAIL_USER}>`,
      to: companyEmail,
      subject: `Campus Drive Request – ${role} at JNTU Hyderabad`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:680px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#4c1d95,#7c3aed);color:#fff;padding:28px 32px;">
            <h2 style="margin:0 0 4px;font-size:22px;">🎓 CampusPlace – JNTU Hyderabad</h2>
            <p style="margin:0;opacity:.85;font-size:14px;">Campus Placement Office · Drive Request</p>
          </div>
          <div style="padding:28px 32px;">
            <p style="font-size:15px;color:#334155;">Dear <strong>${companyName}</strong> HR Team,</p>
            <p style="font-size:14px;color:#475569;line-height:1.7;">
              The Training &amp; Placement Office of <strong>JNTU Hyderabad</strong> would like to invite your
              organization for a <strong>Campus Recruitment Drive</strong> for the role of <strong>${role}</strong>.
            </p>

            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:18px;margin:18px 0;">
              <table style="width:100%;font-size:13.5px;color:#334155;">
                <tr><td style="padding:5px 0;font-weight:600;width:150px;">Role:</td><td>${role}</td></tr>
                ${driveDate ? `<tr><td style="padding:5px 0;font-weight:600;">Proposed Date:</td><td>${new Date(driveDate).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</td></tr>` : ''}
                ${location ? `<tr><td style="padding:5px 0;font-weight:600;">Venue:</td><td>${location}</td></tr>` : ''}
                ${pkg ? `<tr><td style="padding:5px 0;font-weight:600;">Package:</td><td>${pkg}</td></tr>` : ''}
                ${branches && branches.length ? `<tr><td style="padding:5px 0;font-weight:600;">Eligible Branches:</td><td>${branches.join(', ')}</td></tr>` : ''}
                <tr><td style="padding:5px 0;font-weight:600;">Shortlisted Count:</td><td><strong>${studentList.length} students</strong></td></tr>
              </table>
            </div>

            ${message ? `<p style="font-size:14px;color:#475569;line-height:1.6;"><strong>Message from TPO:</strong> ${message}</p>` : ''}

            ${studentRows}

            <p style="font-size:14px;color:#475569;margin-top:24px;">Please confirm your participation by clicking one of the options below:</p>
            <div style="display:flex;gap:14px;margin:24px 0;">
              <a href="${acceptUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">✅ Accept Drive</a>
              <a href="${rejectUrl}" style="display:inline-block;background:#dc2626;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">❌ Decline</a>
            </div>
            <p style="font-size:12px;color:#94a3b8;margin-top:22px;">For queries, contact the TPO office at <a href="mailto:${process.env.GMAIL_USER}" style="color:#7c3aed;">${process.env.GMAIL_USER}</a></p>
          </div>
          <div style="background:#f1f5f9;padding:14px 32px;text-align:center;font-size:11px;color:#94a3b8;">© CampusPlace – JNTU Hyderabad T&amp;P Cell</div>
        </div>`
    });

    res.status(201).json({
      success: true,
      message: `Drive request with ${studentList.length} students sent to ${companyName}`,
      companyRequest
    });
  } catch (err) {
    console.error('sendDriveRequestWithStudents error:', err);
    res.status(500).json({ success: false, message: 'Failed to send drive request' });
  }
};

// ═══════════════════════════════════════════════════════════════════
// STAGE 6 — server.js accept/reject token routes
//  These already exist in server.js. The only gap is: after
//  accept/reject, we must create a TPO Notification.
//  Add this to server.js accept handler after request.save():
// ═══════════════════════════════════════════════════════════════════
/*
  // ── AFTER request.save() in the /accept handler ──
  const Notification = require('./models/Notification');
  await Notification.create({
    tpoId: request.tpoId || null,         // null triggers TPO-wide query
    type: 'company_reply',
    message: `✅ ${request.companyName} accepted the campus drive request for ${request.role}`,
    companyRequestId: request._id,
    read: false
  }).catch(() => {});

  // ── AFTER findOneAndUpdate in the /reject handler ──
  await Notification.create({
    tpoId: request.tpoId || null,
    type: 'company_reply',
    message: `❌ ${request.companyName} declined the campus drive request`,
    companyRequestId: request._id,
    read: false
  }).catch(() => {});
*/

// ═══════════════════════════════════════════════════════════════════
// STAGE 7 — GET TPO notifications (company replies + drive updates)
//   GET /api/tpo/notifications
// ═══════════════════════════════════════════════════════════════════
const getTPONotificationsFull = async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    // Fetch both company_reply and drive notifications for the TPO panel
    const notifications = await Notification.find({
      type: { $in: ['company_reply', 'drive', 'shortlist'] }
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({ success: true, notifications });
  } catch (err) {
    console.error('getTPONotificationsFull error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch TPO notifications' });
  }
};

// ═══════════════════════════════════════════════════════════════════
// STAGE 7 — Mark TPO notification as read
//   PATCH /api/tpo/notifications/:id/read
// ═══════════════════════════════════════════════════════════════════
const markTPONotificationRead = async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark read' });
  }
};

// ═══════════════════════════════════════════════════════════════════
// STAGE 8 — TPO shares drive info to students
//   Combined: post notice + send emails + in-app notifications
//   POST /api/tpo/share-drive-to-students
// ═══════════════════════════════════════════════════════════════════
const shareDriveToStudents = async (req, res) => {
  try {
    const {
      driveId,
      companyRequestId,
      title,
      content,
      venue,
      dateTime,
      documents,
      instructions,
      tpoId,
      sendEmail   // boolean — whether to also email students
    } = req.body;

    const Drive        = require('../models/Drive');
    const Notice       = require('../models/Notice');
    const Notification = require('../models/Notification');
    const Student      = require('../models/Student');
    const nodemailer   = require('nodemailer');

    // ── Resolve drive ──
    let drive = null;
    if (driveId) {
      drive = await Drive.findById(driveId).lean();
    }
    if (!drive && companyRequestId) {
      drive = await Drive.findOne({ companyRequestId }).lean();
    }

    const companyName = drive ? drive.companyName : (title || 'Campus Drive');
    const driveDate   = drive ? drive.date : null;
    const driveRoles  = drive ? (drive.roles || drive.role || '') : '';

    // ── 1. Post Notice ──
    const notice = await Notice.create({
      title: title || `Campus Drive: ${companyName}`,
      content: content ||
        `${companyName} is conducting a campus recruitment drive. ` +
        `Role: ${driveRoles}. ` +
        `Date: ${driveDate ? new Date(driveDate).toLocaleDateString('en-IN') : dateTime || 'TBD'}. ` +
        `Venue: ${venue || (drive && drive.location) || 'College Campus'}. ` +
        (instructions ? `Instructions: ${instructions}` : ''),
      priority: 'high',
      department: 'All',
      postedBy: tpoId || null,
      driveId: drive ? drive._id : null
    });

    // ── 2. In-app Notifications for all students ──
    const students = await Student.find({}, '_id email fullName').lean();
    if (students.length) {
      const notifs = students.map(st => ({
        studentId: st._id,
        type: 'drive',
        driveId: drive ? drive._id : null,
        message: `📢 ${companyName} Drive — ${driveDate ? new Date(driveDate).toLocaleDateString('en-IN') : dateTime || 'TBD'} — Check Notice Board`,
        read: false
      }));
      await Notification.insertMany(notifs, { ordered: false }).catch(() => {});
    }

    // ── 3. Optional email blast ──
    let emailsSent = 0;
    if (sendEmail && students.length) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
      });

      const emailPromises = students.map(st =>
        transporter.sendMail({
          from: `"CampusPlace – TPO" <${process.env.GMAIL_USER}>`,
          to: st.email,
          subject: `🎓 Campus Drive: ${companyName}`,
          html: `
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:auto;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.08);">
              <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);color:#fff;padding:24px 28px;">
                <h2 style="margin:0;">🎓 Campus Drive Announcement</h2>
                <p style="margin:4px 0 0;opacity:.85;">${companyName}</p>
              </div>
              <div style="padding:24px 28px;">
                <p>Dear <strong>${st.fullName || 'Student'}</strong>,</p>
                <p>The Training &amp; Placement Office is pleased to announce an upcoming campus recruitment drive.</p>
                <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:16px 0;">
                  <table style="font-size:14px;color:#1e3a8a;width:100%;">
                    <tr><td style="padding:4px 12px 4px 0;font-weight:700;">Company:</td><td>${companyName}</td></tr>
                    <tr><td style="padding:4px 12px 4px 0;font-weight:700;">Role:</td><td>${driveRoles || '—'}</td></tr>
                    <tr><td style="padding:4px 12px 4px 0;font-weight:700;">Date:</td><td>${driveDate ? new Date(driveDate).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) : dateTime || 'TBD'}</td></tr>
                    <tr><td style="padding:4px 12px 4px 0;font-weight:700;">Venue:</td><td>${venue || (drive && drive.location) || 'College Campus'}</td></tr>
                    ${documents ? `<tr><td style="padding:4px 12px 4px 0;font-weight:700;">Documents:</td><td>${documents}</td></tr>` : ''}
                  </table>
                </div>
                ${instructions ? `<p style="font-size:14px;color:#334155;"><strong>Instructions:</strong> ${instructions}</p>` : ''}
                <p style="font-size:13px;color:#64748b;">Please check your placement dashboard for more details and to register your interest.</p>
              </div>
              <div style="background:#f1f5f9;padding:14px 28px;text-align:center;font-size:11px;color:#94a3b8;">© CampusPlace – JNTU Hyderabad T&amp;P Cell</div>
            </div>`
        }).catch(() => {})
      );

      await Promise.all(emailPromises);
      emailsSent = students.length;
    }

    // ── 4. Update drive status to 'notified' if exists ──
    if (drive) {
      await Drive.findByIdAndUpdate(drive._id, { studentNotified: true });
    }

    res.status(200).json({
      success: true,
      message: `Drive shared: notice posted, ${students.length} in-app notifications sent${sendEmail ? `, ${emailsSent} emails sent` : ''}`,
      notice,
      studentCount: students.length,
      emailsSent
    });
  } catch (err) {
    console.error('shareDriveToStudents error:', err);
    res.status(500).json({ success: false, message: 'Failed to share drive info to students' });
  }
};

// ─── ADD THESE TO tpoRoutes.js ────────────────────────────────────
/*
  const {
    sendDriveRequestWithStudents,
    getTPONotificationsFull,
    markTPONotificationRead,
    shareDriveToStudents,
    publishJobToStudents,
    publishAllNewJobs,
    getJobApplicantsTpo
  } = require('../controllers/tpoController');

  router.post('/send-drive-request',               sendDriveRequestWithStudents);   // replaces old
  router.get('/notifications',                      getTPONotificationsFull);         // replaces old
  router.patch('/notifications/:id/read',           markTPONotificationRead);
  router.post('/share-drive-to-students',           shareDriveToStudents);
  router.post('/publish-job/:scrapedJobId',         publishJobToStudents);
  router.post('/publish-all-jobs',                  publishAllNewJobs);
  router.get('/job-applications/:openJobId',        getJobApplicantsTpo);
*/

module.exports = {
  sendDriveRequestWithStudents,
  getTPONotificationsFull,
  markTPONotificationRead,
  shareDriveToStudents
};
