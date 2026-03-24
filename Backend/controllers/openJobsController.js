const nodemailer = require('nodemailer');
const https = require('https');

const OpenJob = require('../models/OpenJob');
const OpenJobNotification = require('../models/OpenJobNotification');
const Student = require('../models/Student');
const CompanyRequest = require('../models/CompanyRequest');
const Notification = require('../models/Notification');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

async function getCollegeBranches() {
  const branches = await Student.distinct('branch');
  return branches.filter((b) => typeof b === 'string' && b.trim());
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (resp) => {
        let data = '';
        resp.on('data', (chunk) => {
          data += chunk;
        });
        resp.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

function deriveRequiredBranchesFromText(text, collegeBranches) {
  const t = (text || '').toLowerCase();
  const set = new Set();

  // Simple heuristics. If nothing matches, we fall back to all college branches.
  const hasAny = (arr) => arr.some((k) => t.includes(k));

  const want = {
    CSE: ['software', 'developer', 'react', 'node', 'javascript', 'typescript', 'python', 'java', 'sql', 'mongodb', 'rest', 'api', 'spring'],
    IT: ['aws', 'devops', 'kubernetes', 'docker', 'linux', 'system', 'cloud', 'gcp', 'azure'],
    ECE: ['embedded', 'vlsi', 'verilog', 'fpga', 'microcontroller', 'signal'],
    EEE: ['power', 'electrical', 'control systems', 'electronics', 'transformer'],
    MECH: ['mechanical', 'automotive', 'thermo', 'solidworks', 'cad', 'fluid'],
    CIVIL: ['civil', 'structural', 'construction', 'survey']
  };

  collegeBranches.forEach((b) => {
    const key = String(b).toUpperCase();
    if (want[key] && hasAny(want[key])) set.add(key);
  });

  if (!set.size) {
    // If we can't infer, allow all branches so the portal doesn't end up empty.
    collegeBranches.forEach((b) => set.add(b));
  }

  return Array.from(set);
}

function mapOpenJobResponse(openJobs, opts) {
  // opts: { studentId }
  const studentId = opts && opts.studentId ? String(opts.studentId) : null;
  return Promise.resolve(
    Promise.all(
      openJobs.map(async (oj) => {
        const isNotified = studentId
          ? await OpenJobNotification.exists({ openJobId: oj._id, studentId })
          : await OpenJobNotification.exists({ openJobId: oj._id });

        const outreach = await CompanyRequest.findOne({ openJobId: oj._id }).select('status createdAt').lean();
        return {
          _id: oj._id,
          title: oj.title,
          companyName: oj.companyName,
          description: oj.description,
          location: oj.location,
          package: oj.package,
          requiredBranches: oj.requiredBranches,
          applyLink: oj.applyLink,
          createdAt: oj.createdAt,
          isNotified: Boolean(isNotified),
          isApplied: false,
          outreachStatus: outreach ? outreach.status : null,
          outreachCreatedAt: outreach ? outreach.createdAt : null
        };
      })
    )
  );
}

async function fetchAndStoreJobs(sourceJobs = []) {
  const collegeBranches = await getCollegeBranches();
  const fallbackBranches = collegeBranches.length ? collegeBranches : ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];

  let jobsToSync = Array.isArray(sourceJobs) ? sourceJobs.filter(Boolean) : [];
  if (!jobsToSync.length) {
    const remote = await fetchJson('https://www.arbeitnow.com/api/job-board-api');
    const remoteJobs = Array.isArray(remote?.data) ? remote.data : [];
    jobsToSync = remoteJobs.slice(0, 100).map((j) => ({
      title: j.title || '',
      companyName: j.company_name || '',
      description: j.description || '',
      location: Array.isArray(j.location) ? j.location.join(', ') : j.location || '',
      package: 'Not disclosed',
      applyLink: j.url || ''
    }));
  }

  let syncedCount = 0;
  let skippedCount = 0;

  for (const j of jobsToSync) {
    const title = String(j.title || '').trim();
    const companyName = String(j.companyName || '').trim();
    const description = String(j.description || '').trim();
    const location = String(j.location || '').trim();
    const applyLink = String(j.applyLink || '').trim();
    const pkg = String(j.package || '').trim();

    if (!title || !companyName || !description || !applyLink) {
      skippedCount += 1;
      continue;
    }

    const requiredBranches = deriveRequiredBranchesFromText(`${title}\n${description}`, fallbackBranches);

    await OpenJob.updateOne(
      { title, companyName },
      {
        $set: {
          description,
          location,
          package: pkg,
          requiredBranches,
          applyLink,
          lastSyncedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );
    syncedCount += 1;
  }

  return { syncedCount, skippedCount };
}

async function getOpenJobs(req, res) {
  try {
    const studentId = req.query.studentId ? String(req.query.studentId) : null;
    const collegeBranches = await getCollegeBranches();

    const filterByCollege = {
      $or: [
        { requiredBranches: { $exists: false } },
        { requiredBranches: { $size: 0 } },
        { requiredBranches: { $in: collegeBranches } }
      ]
    };

    let jobsQuery = OpenJob.find(filterByCollege).sort({ createdAt: -1 });

    // If we have a studentId, return only jobs that were notified to that student.
    if (studentId) {
      const notified = await OpenJobNotification.find({ studentId })
        .select('openJobId')
        .lean();
      const openJobIds = notified.map((n) => n.openJobId).filter(Boolean);
      jobsQuery = OpenJob.find(filterByCollege).where('_id').in(openJobIds).sort({ createdAt: -1 });
    }

    const openJobs = await jobsQuery.lean();
    if (!openJobs.length) {
      return res.status(200).json({ success: true, openJobs: [] });
    }

    const mapped = await mapOpenJobResponse(openJobs, { studentId });
    res.status(200).json({ success: true, openJobs: mapped });
  } catch (err) {
    console.error('getOpenJobs error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch open jobs' });
  }
}

async function notifyOpenJob(req, res) {
  try {
    const { openJobId, channels, sendEmail } = req.body || {};
    if (!openJobId) return res.status(400).json({ success: false, message: 'openJobId is required' });

    const openJob = await OpenJob.findById(openJobId);
    if (!openJob) return res.status(404).json({ success: false, message: 'Open job not found' });

    const selectedChannels = Array.isArray(channels)
      ? channels
      : typeof channels === 'string'
        ? channels.split(',').map((x) => x.trim()).filter(Boolean)
        : [];

    const shouldEmail = Boolean(sendEmail) || selectedChannels.includes('email');
    const shouldDashboard = selectedChannels.length === 0 || selectedChannels.includes('dashboard');

    const collegeBranches = await getCollegeBranches();
    const required = Array.isArray(openJob.requiredBranches) && openJob.requiredBranches.length ? openJob.requiredBranches : collegeBranches;
    const eligibleStudents = await Student.find({ branch: { $in: required } }).select('_id email fullName').lean();

    if (!eligibleStudents.length) {
      return res.status(200).json({ success: true, message: 'No eligible students found', notifiedCount: 0 });
    }

    // Create notifications per student (unique index prevents duplicates).
    const docs = eligibleStudents.map((st) => ({
      openJobId: openJob._id,
      studentId: st._id,
      channels: [
        ...(shouldEmail ? ['email'] : []),
        ...(shouldDashboard ? ['dashboard'] : [])
      ],
      emailSent: false
    }));

    await OpenJobNotification.insertMany(docs, { ordered: false }).catch(() => {
      // ignore duplicate key errors
    });

    // Student-facing notification feed (for dashboard "Open Jobs" section)
    const notifDocs = eligibleStudents.map((st) => ({
      studentId: st._id,
      type: 'open_job',
      jobId: openJob._id,
      message: `New open job: ${openJob.title} at ${openJob.companyName}`
    }));
    await Notification.insertMany(notifDocs, { ordered: false }).catch(() => {
      // ignore duplicate key errors
    });

    let emailSentCount = 0;
    if (shouldEmail) {
      // Send email in a best-effort way (don't fail the whole request).
      await Promise.all(
        eligibleStudents.map(async (st) => {
          try {
            await transporter.sendMail({
              from: `"CampusPlace" <${process.env.GMAIL_USER}>`,
              to: st.email,
              subject: `Open Job Alert: ${openJob.title} — ${openJob.companyName}`,
              html: `
                <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:22px;border:1px solid #e2e8f0;border-radius:12px;">
                  <h2 style="color:#1e3a8a;margin-bottom:6px;">${openJob.title}</h2>
                  <p style="margin:0 0 12px;color:#334155;">${openJob.companyName} · ${openJob.location || ''}</p>
                  <div style="background:#f8fafc;border:1px solid #e5e7eb;padding:14px;border-radius:10px;margin-bottom:14px;">
                    <strong>Package:</strong> ${openJob.package || '—'}
                  </div>
                  <p style="margin:0 0 10px;color:#64748b;">You’ve been notified by your TPO. Log in to your dashboard to apply.</p>
                  ${openJob.applyLink ? `<p style="margin:0;"><a href="${openJob.applyLink}" target="_blank">Apply link</a></p>` : ''}
                </div>
              `
            });
            emailSentCount += 1;
          } catch (e) {
            // ignore individual email errors
          }
        })
      );
      await OpenJobNotification.updateMany(
        { openJobId: openJob._id, studentId: { $in: eligibleStudents.map((s) => s._id) } },
        { $set: { emailSent: true } }
      );
    }

    res.status(201).json({
      success: true,
      openJobId: openJob._id,
      notifiedCount: eligibleStudents.length,
      emailSentCount
    });
  } catch (err) {
    console.error('notifyOpenJob error:', err);
    res.status(500).json({ success: false, message: 'Failed to notify students' });
  }
}


async function syncOpenJobs(req, res) {
  try {
    const payloadJobs = Array.isArray(req.body?.jobs) ? req.body.jobs : [];
    if (!payloadJobs.length) {
      return res.status(200).json({ success: true, syncedCount: 0, skippedCount: 0, message: 'No jobs payload provided' });
    }
    const { syncedCount, skippedCount } = await fetchAndStoreJobs(payloadJobs);
    res.status(201).json({ success: true, syncedCount, skippedCount });
  } catch (err) {
    console.error('syncOpenJobs error:', err);
    res.status(500).json({ success: false, message: 'Open job sync failed' });
  }
}

module.exports = {
  getOpenJobs,
  notifyOpenJob,
  syncOpenJobs
};

