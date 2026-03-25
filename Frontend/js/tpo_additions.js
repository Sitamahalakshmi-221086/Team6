// ═══════════════════════════════════════════════════════════════════
//  CAMPUSPLACE — tpo.js ADDITIONS
//  APPEND ALL OF THIS to the bottom of your existing tpo.js
//  These cover every stage of the new pipeline end-to-end.
// ═══════════════════════════════════════════════════════════════════

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STAGE 1 — Load scraped jobs into the TPO "Open Jobs" panel
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function loadScrapedJobs() {
    const container = document.getElementById('scraped-jobs-list');
    const countEl   = document.getElementById('scraped-jobs-count');
    if (!container) return;

    container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--txmu);">Loading…</div>';
    try {
        const res  = await fetch(`${API_BASE}/scraped-jobs`);
        const data = await res.json();
        const jobs = data.success && Array.isArray(data.jobs) ? data.jobs : [];
        if (countEl) countEl.textContent = String(jobs.length);

        if (!jobs.length) {
            container.innerHTML = `
              <div style="padding:40px;text-align:center;color:var(--txmu);border:1px dashed var(--br);border-radius:12px;margin:8px;">
                No scraped jobs yet — click <strong>Sync Jobs</strong> to fetch from portals.
              </div>`;
            return;
        }

        container.innerHTML = jobs.map(j => scrapedJobCard(j)).join('');
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--R);opacity:.7;">Failed to load scraped jobs</div>';
    }
}

function scrapedJobCard(j) {
    const branches  = Array.isArray(j.branches) && j.branches.length ? j.branches.join(', ') : 'All branches';
    const skills    = Array.isArray(j.skills)   && j.skills.length   ? j.skills.join(', ')   : '—';
    const published = j.publishedToStudents;

    const publishBtn = published
        ? `<span class="pill confirmed" style="font-size:11px;">✓ Published</span>`
        : `<button class="btn sm green" onclick="publishScrapedJob('${j._id}', this)">Publish to Students</button>`;

    const outreachBtn = j.driveRequested
        ? `<span class="pill awaiting" style="font-size:11px;">Drive Requested</span>`
        : `<button class="btn sm sec" onclick="openSendDriveModal('${j._id}')">Send Drive Request</button>`;

    return `
      <div class="oj-card" id="sjc-${j._id}" style="margin-bottom:10px;">
        <div class="oj-top" style="align-items:flex-start;">
          <div class="oj-info" style="flex:1;">
            <div class="oj-title">${j.title || '—'}</div>
            <div class="oj-co">${j.company || '—'}
              ${j.portal ? `<span style="font-size:11px;color:var(--txmu);margin-left:6px;">via ${j.portal}</span>` : ''}
            </div>
            <div class="oj-tags" style="flex-wrap:wrap;gap:4px;margin-top:6px;">
              <span class="oj-tag ctc">${j.stipend || '—'}</span>
              <span class="oj-tag">${j.location || '—'}</span>
              <span class="oj-tag">${j.type || 'Full-time'}</span>
              <span class="oj-tag" style="color:var(--P);">Branches: ${branches}</span>
              ${skills !== '—' ? `<span class="oj-tag">Skills: ${skills}</span>` : ''}
            </div>
          </div>
          <div class="oj-actions" style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;min-width:160px;">
            ${publishBtn}
            ${outreachBtn}
          </div>
        </div>
      </div>`;
}

// ── Publish single scraped job to students ──
async function publishScrapedJob(scrapedJobId, btn) {
    try {
        btn.textContent = 'Publishing…';
        btn.disabled = true;

        const res  = await fetch(`${API_BASE}/publish-job/${scrapedJobId}`, {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify({ tpoId: getTpoId() })
        });
        const data = await res.json();

        if (data.success) {
            showToast(`Job published to ${data.openJob ? 'students' : 'dashboard'}!`);
            // Replace button with "Published" pill
            const card = document.getElementById(`sjc-${scrapedJobId}`);
            if (card) {
                const b = card.querySelector('button.green');
                if (b) b.replaceWith(Object.assign(document.createElement('span'), {
                    className: 'pill confirmed',
                    style    : 'font-size:11px;',
                    textContent: '✓ Published'
                }));
            }
            await renderOpenJobs();   // refresh the Open Jobs tab
        } else {
            btn.textContent = 'Publish to Students';
            btn.disabled = false;
            showToast(data.message || 'Publish failed');
        }
    } catch (e) {
        console.error(e);
        btn.textContent = 'Publish to Students';
        btn.disabled = false;
        showToast('Network error');
    }
}

// ── Publish ALL unpublished scraped jobs in one click ──
async function publishAllScrapedJobs(btn) {
    try {
        if (btn) { btn.textContent = 'Publishing…'; btn.disabled = true; }

        const res  = await fetch(`${API_BASE}/publish-all-jobs`, {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify({ tpoId: getTpoId() })
        });
        const data = await res.json();

        if (data.success) {
            showToast(data.message || `${data.count} jobs published!`);
            await loadScrapedJobs();
            await renderOpenJobs();
        } else {
            showToast(data.message || 'Bulk publish failed');
        }
    } catch (e) {
        console.error(e);
        showToast('Network error');
    } finally {
        if (btn) { btn.textContent = 'Publish All New'; btn.disabled = false; }
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STAGE 3 — Load applicants for a specific job (TPO view)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function loadJobApplicants(openJobId, jobTitle) {
    const modal   = document.getElementById('applicants-modal');
    const heading = document.getElementById('applicants-modal-title');
    const list    = document.getElementById('applicants-modal-list');
    const countEl = document.getElementById('applicants-modal-count');
    if (!modal || !list) return;

    if (heading) heading.textContent = `Applicants — ${jobTitle || 'Job'}`;
    list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--txmu);">Loading…</div>';
    openModal('applicants-modal');

    try {
        const res  = await fetch(`${API_BASE}/job-applications/${openJobId}`);
        const data = await res.json();
        const apps = data.success && data.applications ? data.applications : [];
        if (countEl) countEl.textContent = String(apps.length);

        if (!apps.length) {
            list.innerHTML = '<div style="padding:24px;text-align:center;color:var(--txmu);">No applications yet for this job.</div>';
            return;
        }

        list.innerHTML = `
          <div class="tbl-head g5">
            <span>Student</span><span>Branch</span><span>CGPA</span><span>Roll No.</span><span>Resume</span>
          </div>
          ${apps.map(a => {
              const st = a.studentId || {};
              const resumeHref = a.resume && a.resume.path ? `${API_ROOT}/${String(a.resume.path).replace(/\\/g,'/')}` : '';
              return `<div class="tbl-row g5">
                <div>
                  <div class="tbl-name">${st.fullName || '—'}</div>
                  <div class="tbl-sub">${st.email || '—'}</div>
                </div>
                <span style="font-size:12.5px;color:var(--txmu);">${st.branch || '—'} · ${st.year || '—'}</span>
                <span style="font-weight:600;">${st.cgpa != null ? st.cgpa : '—'}</span>
                <span style="font-size:12px;">${st.rollNumber || '—'}</span>
                <span>${resumeHref ? `<a href="${resumeHref}" target="_blank" rel="noopener" style="color:var(--P);">View</a>` : '—'}</span>
              </div>`;
          }).join('')}`;
    } catch (e) {
        console.error(e);
        list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--R);opacity:.7;">Failed to load applicants</div>';
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STAGE 5 — Send Drive Request to company WITH shortlisted students
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let _driveReqJobId = null;   // scrapedJobId or openJobId tied to the open modal

// Open the "Send Drive Request" modal, pre-filled from a scraped job
function openSendDriveModal(scrapedJobId) {
    _driveReqJobId = scrapedJobId;
    const j = openJobsCache.find(x => String(x._id) === String(scrapedJobId) || String(x.scrapedJobId) === String(scrapedJobId));

    // Try to pre-fill from the scraped jobs list too
    const fill = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
    fill('dr-company',       j ? j.companyName || j.company || '' : '');
    fill('dr-company-email', j ? j.companyEmail || '' : '');
    fill('dr-role',          j ? j.title || '' : '');
    fill('dr-package',       j ? j.package || j.stipend || '' : '');
    fill('dr-location',      j ? j.location || '' : '');

    const branchesEl = document.getElementById('dr-branches');
    if (branchesEl && j) {
        const br = Array.isArray(j.requiredBranches) ? j.requiredBranches : (Array.isArray(j.branches) ? j.branches : []);
        branchesEl.value = br.join(', ');
    }

    // Load existing applicants for the student selection table
    loadStudentsForDriveModal(scrapedJobId);
    openModal('send-drive-modal');
}

// Load students who applied (for the checkboxes in Stage 5 modal)
async function loadStudentsForDriveModal(openJobId) {
    const table = document.getElementById('dr-students-table');
    if (!table) return;
    table.innerHTML = '<div style="padding:12px;text-align:center;color:var(--txmu);font-size:13px;">Loading applicants…</div>';
    try {
        const res  = await fetch(`${API_BASE}/job-applications/${openJobId}`);
        const data = await res.json();
        const apps = data.success && data.applications ? data.applications : [];

        if (!apps.length) {
            table.innerHTML = `
              <div style="padding:12px;text-align:center;color:var(--txmu);font-size:13px;">
                No applicants yet for this job. You can still send the drive request —
                the company email will mention 0 shortlisted students.
              </div>`;
            return;
        }

        table.innerHTML = `
          <div style="font-size:12px;font-weight:600;color:var(--txmu);margin-bottom:6px;">
            Select students to include in the company email:
          </div>
          <div style="border:1px solid var(--br);border-radius:8px;overflow:hidden;">
            <div style="display:grid;grid-template-columns:32px 1fr 80px 60px 60px;padding:7px 10px;background:var(--bg2);font-size:11px;font-weight:600;color:var(--txmu);">
              <span></span><span>Student</span><span>Branch</span><span>Year</span><span>CGPA</span>
            </div>
            ${apps.map(a => {
                const st = a.studentId || {};
                return `<div style="display:grid;grid-template-columns:32px 1fr 80px 60px 60px;padding:7px 10px;border-top:1px solid var(--br);font-size:12.5px;align-items:center;">
                  <input type="checkbox" class="dr-student-cb" value="${st._id || ''}" checked style="width:14px;height:14px;cursor:pointer;">
                  <div>
                    <div style="font-weight:600;">${st.fullName || '—'}</div>
                    <div style="font-size:11px;color:var(--txmu);">${st.rollNumber || ''}  ${st.email || ''}</div>
                  </div>
                  <span>${st.branch || '—'}</span>
                  <span>${st.year || '—'}</span>
                  <span style="font-weight:600;color:var(--P);">${st.cgpa != null ? st.cgpa : '—'}</span>
                </div>`;
            }).join('')}
          </div>
          <div style="margin-top:6px;font-size:12px;color:var(--txmu);">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
              <input type="checkbox" id="dr-select-all" checked onchange="toggleAllStudentCbs(this.checked)"> Select / deselect all
            </label>
          </div>`;
    } catch (e) {
        console.error(e);
        table.innerHTML = '<div style="padding:12px;text-align:center;color:var(--R);font-size:13px;">Failed to load applicants</div>';
    }
}

function toggleAllStudentCbs(checked) {
    document.querySelectorAll('.dr-student-cb').forEach(cb => { cb.checked = checked; });
}

// Submit the drive request
async function submitSendDriveRequest(btn) {
    const gv = id => (document.getElementById(id)?.value || '').trim();
    const companyName  = gv('dr-company');
    const companyEmail = gv('dr-company-email');
    const role         = gv('dr-role');
    const driveDate    = gv('dr-date');
    const location     = gv('dr-location');
    const pkg          = gv('dr-package');
    const message      = gv('dr-message');
    const branchesRaw  = gv('dr-branches');
    const branches     = branchesRaw ? branchesRaw.split(',').map(b => b.trim()).filter(Boolean) : [];

    if (!companyName || !companyEmail || !role) {
        showToast('Company name, email, and role are required');
        return;
    }

    // Collect checked student IDs
    const studentIds = Array.from(document.querySelectorAll('.dr-student-cb:checked'))
        .map(cb => cb.value)
        .filter(Boolean);

    btn.textContent = 'Sending…';
    btn.disabled    = true;

    try {
        const res  = await fetch(`${API_BASE}/send-drive-request`, {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify({
                companyName, companyEmail, role, driveDate, location,
                package: pkg, message, branches,
                scrapedJobId: _driveReqJobId,
                tpoId       : getTpoId(),
                studentIds
            })
        });
        const data = await res.json();

        if (data.success) {
            closeModal('send-drive-modal');
            showToast(`Drive request sent to ${companyName} with ${studentIds.length} students!`);
            _driveReqJobId = null;
            await renderOpenJobs();
            await loadScrapedJobs();
            await loadTPOCompaniesTabs();
            refreshSidebarCounters();
        } else {
            showToast(data.message || 'Send failed');
        }
    } catch (e) {
        console.error(e);
        showToast('Network error');
    } finally {
        btn.textContent = 'Send Drive Request';
        btn.disabled    = false;
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STAGE 7 — TPO Notification panel: company replies
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function loadTPONotificationsPanel() {
    const list  = document.getElementById('tpo-notifications-list');
    const badge = document.getElementById('notif-badge');
    if (!list) return;

    try {
        const res  = await fetch(`${API_BASE}/notifications`);
        const data = await res.json();
        const notifs = data.success && Array.isArray(data.notifications) ? data.notifications : [];

        const unread = notifs.filter(n => !n.read).length;
        if (badge) {
            badge.textContent = String(unread);
            badge.style.display = unread > 0 ? 'inline-flex' : 'none';
        }
        const rdot = document.querySelector('.icon-btn .rdot');
        if (rdot) rdot.style.display = unread > 0 ? 'block' : 'none';

        if (!notifs.length) {
            list.innerHTML = '<div style="padding:24px;text-align:center;color:var(--txmu);font-size:12px;font-weight:500;">No new notifications</div>';
            return;
        }

        list.innerHTML = notifs.map(n => {
            const isCompanyReply = n.type === 'company_reply';
            const accepted       = n.message && n.message.includes('accepted');
            const dotClass       = n.read ? '' : 'u';
            const pillColor      = isCompanyReply ? (accepted ? 'var(--G)' : 'var(--R)') : 'var(--P)';
            const icon           = isCompanyReply ? (accepted ? '✅' : '❌') : '🔔';

            return `<div class="notif-item${n.read ? '' : ' unread'}" onclick="markTPONotifRead('${n._id}', this)">
              <span class="n-dot ${dotClass}" style="background:${pillColor};"></span>
              <div style="flex:1;">
                <div class="n-text">${icon} ${n.message || 'Notification'}</div>
                <div class="n-time">${n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</div>
                ${isCompanyReply && accepted && n.companyRequestId
                    ? `<button class="btn sm green" style="margin-top:6px;" onclick="openShareDriveModal('${n.companyRequestId}');event.stopPropagation();">Share to Students</button>`
                    : ''}
              </div>
            </div>`;
        }).join('');
    } catch (e) {
        console.error(e);
        list.innerHTML = '<div style="padding:24px;text-align:center;color:var(--txmu);font-size:12px;">No new notifications</div>';
    }
}

async function markTPONotifRead(notifId, el) {
    if (!notifId || notifId === 'undefined') return;
    el && el.classList.remove('unread');
    const dot = el && el.querySelector('.n-dot');
    if (dot) dot.classList.remove('u');
    try {
        await fetch(`${API_BASE}/notifications/${notifId}/read`, { method: 'PATCH' });
        await loadTPONotificationsPanel(); // refresh badge count
    } catch (e) { /* silent */ }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STAGE 8 — Share accepted drive info to students
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let _shareDriveCompanyReqId = null;

function openShareDriveModal(companyRequestId) {
    _shareDriveCompanyReqId = companyRequestId;
    openModal('share-drive-modal');
}

async function submitShareDriveToStudents(btn) {
    const gv = id => (document.getElementById(id)?.value || '').trim();
    const title        = gv('sd-title');
    const content      = gv('sd-content');
    const venue        = gv('sd-venue');
    const dateTime     = gv('sd-datetime');
    const documents    = gv('sd-documents');
    const instructions = gv('sd-instructions');
    const sendEmail    = document.getElementById('sd-send-email')?.checked ?? false;

    if (!title) { showToast('Please enter a notice title'); return; }

    btn.textContent = 'Sharing…';
    btn.disabled    = true;

    try {
        const res  = await fetch(`${API_BASE}/share-drive-to-students`, {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify({
                companyRequestId: _shareDriveCompanyReqId,
                title, content, venue, dateTime,
                documents, instructions, sendEmail,
                tpoId: getTpoId()
            })
        });
        const data = await res.json();

        if (data.success) {
            closeModal('share-drive-modal');
            showToast(data.message || 'Drive shared to students!');
            _shareDriveCompanyReqId = null;
            loadTPONotices();
            loadTPOFullDrivesPage();
        } else {
            showToast(data.message || 'Share failed');
        }
    } catch (e) {
        console.error(e);
        showToast('Network error');
    } finally {
        btn.textContent = 'Share to Students';
        btn.disabled    = false;
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PATCH existing loadNotifications to use the new full panel loader
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Override the old loadNotifications with the richer version
async function loadNotifications() {
    await loadTPONotificationsPanel();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PATCH refreshSidebarCounters to also refresh notif panel
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const _origRefresh = refreshSidebarCounters;
refreshSidebarCounters = async function() {
    await _origRefresh();
    await loadTPONotificationsPanel();
};
