// ═══════════════════════════════════════════════════════════════════
//  CAMPUSPLACE — server.js  (FULL REPLACEMENT)
//  Key additions vs the original:
//   • /api/drive-response/:token/accept  → creates TPO Notification
//   • /api/drive-response/:token/reject  → creates TPO Notification
//   • Both routes now POST to /api/tpo/notifications so the TPO
//     notification panel lights up immediately.
// ═══════════════════════════════════════════════════════════════════

const express    = require('express');
const cors       = require('cors');
const morgan     = require('morgan');
const nodemailer = require('nodemailer');
const path       = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });
const connectDB = require('./config/db');
connectDB();

const app = express();

// ── Middleware ──────────────────────────────────────────────────
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.resolve(__dirname, '..', 'Frontend')));

// ── Email transporter ───────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
});

// ── Routes ──────────────────────────────────────────────────────
app.use('/api/students',      require('./routes/studentRoutes'));
app.use('/api/companies',     require('./routes/companyRoutes'));
app.use('/api/company',       require('./routes/companyRoutes'));
app.use('/api/tpo',           require('./routes/tpoRoutes'));
app.use('/api/open-jobs',     require('./routes/openJobsRoutes'));
app.use('/api/notifications', require('./routes/notificationsRoutes'));
app.use('/api/jobs',          require('./routes/jobsRoutes'));
app.use('/api/drives',        require('./routes/drivesPublicRoutes'));
app.use('/api/applications',  require('./routes/applicationRoutes'));app.use('/api/scraper',       require('./routes/scraperRoutes'));

// ── Start Job Scheduler ──────────────────────────────────────
try {
  const { startJobScheduler } = require('./scripts/jobScheduler');
  startJobScheduler();
  console.log('✅ Job scheduler initialized');
} catch (error) {
  console.warn('⚠️  Job scheduler not available (node-cron not installed). Manual scraper trigger available via API.');
}
// ═══════════════════════════════════════════════════════════════════
//  STAGE 6 — Company clicks [Accept] in email
//  GET /api/drive-response/:token/accept
// ═══════════════════════════════════════════════════════════════════
app.get('/api/drive-response/:token/accept', async (req, res) => {
  try {
    const CR           = require('./models/CompanyRequest');
    const Drive        = require('./models/Drive');
    const Notification = require('./models/Notification');

    const request = await CR.findOne({ token: req.params.token });
    if (!request) return res.status(404).send('Invalid or expired token.');
    if (request.status === 'accepted') {
      return res.send(`
        <div style="font-family:sans-serif;text-align:center;padding:50px;">
          <h1 style="color:#16a34a;">✅ Drive Already Confirmed</h1>
          <p>This drive has already been confirmed. Thank you!</p>
        </div>`);
    }

    // ── 1. Update request status ──
    request.status = 'accepted';
    await request.save();

    // ── 2. Create Drive record ──
    const drive = await Drive.create({
      companyName      : request.companyName,
      date             : request.driveDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      location         : request.location  || '',
      eligibility      : request.details   || 'As per request',
      roles            : request.role      || 'Various',
      status           : 'scheduled',
      submittedBy      : 'company',
      companyRequestId : request._id
    });

    // ── 3. Notify TPO in the notification panel (Stage 7) ──
    await Notification.create({
      tpoId            : request.tpoId || null,
      type             : 'company_reply',
      driveId          : drive._id,
      companyRequestId : request._id,
      message          : `✅ ${request.companyName} accepted the campus drive request for "${request.role}"`,
      read             : false
    }).catch(err => console.error('TPO notif error:', err.message));

    // ── 4. Send confirmation email back to TPO ──
    if (process.env.GMAIL_USER) {
      transporter.sendMail({
        from   : `"CampusPlace" <${process.env.GMAIL_USER}>`,
        to     : process.env.GMAIL_USER,
        subject: `✅ Drive Accepted: ${request.companyName}`,
        html   : `<p><strong>${request.companyName}</strong> has <strong style="color:#16a34a;">accepted</strong> your campus drive request for <strong>${request.role}</strong>.</p>
                  <p>Drive date: ${request.driveDate ? new Date(request.driveDate).toLocaleDateString('en-IN') : 'TBD'}</p>
                  <p>Log in to CampusPlace to share the drive details with students.</p>`
      }).catch(() => {});
    }

    res.send(`
      <div style="font-family:'Segoe UI',sans-serif;text-align:center;padding:60px 20px;max-width:500px;margin:auto;">
        <div style="font-size:56px;margin-bottom:16px;">✅</div>
        <h1 style="color:#16a34a;font-size:24px;margin-bottom:8px;">Drive Confirmed!</h1>
        <p style="color:#334155;font-size:15px;line-height:1.6;">
          Thank you for accepting the campus recruitment drive at <strong>JNTU Hyderabad</strong>.<br>
          Our TPO office will contact you shortly with the full schedule.
        </p>
        <p style="color:#64748b;font-size:13px;margin-top:24px;">You may close this window.</p>
      </div>`);
  } catch (err) {
    console.error('Accept route error:', err);
    res.status(500).send('Error processing response: ' + err.message);
  }
});

// ═══════════════════════════════════════════════════════════════════
//  STAGE 6 — Company clicks [Reject] in email
//  GET /api/drive-response/:token/reject
// ═══════════════════════════════════════════════════════════════════
app.get('/api/drive-response/:token/reject', async (req, res) => {
  try {
    const CR           = require('./models/CompanyRequest');
    const Notification = require('./models/Notification');

    const request = await CR.findOneAndUpdate(
      { token: req.params.token },
      { status: 'rejected' },
      { new: true }
    );
    if (!request) return res.status(404).send('Invalid or expired token.');

    // ── Notify TPO (Stage 7) ──
    await Notification.create({
      tpoId            : request.tpoId || null,
      type             : 'company_reply',
      companyRequestId : request._id,
      message          : `❌ ${request.companyName} declined the campus drive request for "${request.role}"`,
      read             : false
    }).catch(err => console.error('TPO notif error:', err.message));

    // ── Notify TPO by email ──
    if (process.env.GMAIL_USER) {
      transporter.sendMail({
        from   : `"CampusPlace" <${process.env.GMAIL_USER}>`,
        to     : process.env.GMAIL_USER,
        subject: `❌ Drive Declined: ${request.companyName}`,
        html   : `<p><strong>${request.companyName}</strong> has <strong style="color:#dc2626;">declined</strong> your campus drive request for <strong>${request.role}</strong>.</p>
                  <p>You may try contacting them again with a revised proposal.</p>`
      }).catch(() => {});
    }

    res.send(`
      <div style="font-family:'Segoe UI',sans-serif;text-align:center;padding:60px 20px;max-width:500px;margin:auto;">
        <div style="font-size:56px;margin-bottom:16px;">❌</div>
        <h1 style="color:#dc2626;font-size:24px;margin-bottom:8px;">Drive Declined</h1>
        <p style="color:#334155;font-size:15px;line-height:1.6;">
          We've recorded your response. Thank you for your time.<br>
          The TPO office has been notified.
        </p>
        <p style="color:#64748b;font-size:13px;margin-top:24px;">You may close this window.</p>
      </div>`);
  } catch (err) {
    console.error('Reject route error:', err);
    res.status(500).send('Error processing response.');
  }
});

// ── OTP email route (unchanged) ─────────────────────────────────
app.post('/send-email', async (req, res) => {
  const { email, name, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Missing email or otp.' });
  try {
    await transporter.sendMail({
      from   : `"CampusPlace" <${process.env.GMAIL_USER}>`,
      to     : email,
      subject: `Your CampusPlace OTP: ${otp}`,
      html   : `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;">
          <h2 style="color:#1e3a8a;">CampusPlace Email Verification</h2>
          <p>Hello <strong>${name || 'User'}</strong>,</p>
          <p>Your one-time password is:</p>
          <div style="font-size:36px;font-weight:800;letter-spacing:10px;color:#2563eb;padding:16px 0;">${otp}</div>
          <p style="color:#64748b;font-size:13px;">Valid for <strong>10 minutes</strong>. Do not share it.</p>
        </div>`
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Mail error:', err.message);
    res.status(500).json({ success: false, message: 'Email sending failed.' });
  }
});

app.get('/', (req, res) => res.send('✅ Campus Recruitment API is running…'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
