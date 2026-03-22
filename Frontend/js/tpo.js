// ── GLOBAL CONSTANTS ──
const TITLES = { 
    home: 'Dashboard', students: 'Students', companies: 'Companies', 
    drives: 'Campus Drives', placements: 'Placements', 
    analytics: 'Analytics', notices: 'Notice Board', 
    reports: 'Reports', profile: 'My Profile', settings: 'Settings' 
};

const P = '#7c3aed', T = '#0aada0', G = '#16a34a', A = '#d97706', R = '#dc2626', B = '#1759d6';
const grid = 'rgba(124,58,237,0.07)', tick = { color: '#6b4a8a', font: { size: 11 } };
const baseChartOptions = { 
    responsive: true, 
    maintainAspectRatio: false, 
    plugins: { legend: { display: false } }, 
    scales: { 
        x: { grid: { color: grid }, ticks: tick }, 
        y: { grid: { color: grid }, ticks: tick, beginAtZero: true } 
    } 
};

// ── INIT ──
window.addEventListener('DOMContentLoaded', () => {
    // Session Greeting
    const h = new Date().getHours();
    const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    const greetMsg = document.getElementById('greet-msg');
    if (greetMsg) greetMsg.textContent = `${g}, Dr. Ramesh Kumar 👋`;

    initDarkMode();
    lucide.createIcons();
    setTimeout(renderHomeCharts, 100);
    setTimeout(loadDrives, 150);
});

// ── NAVIGATION ──
function go(id, btn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
    document.querySelectorAll('.nl').forEach(n => n.classList.remove('on'));
    
    const targetPage = document.getElementById('pg-' + id);
    if (targetPage) targetPage.classList.add('on');
    if (btn) btn.classList.add('on');
    
    document.getElementById('tb-title').textContent = TITLES[id] || id;
    document.getElementById('notif-panel').classList.remove('on');

    if (id === 'analytics' && !window.analyticsDone) setTimeout(renderAnalytics, 80);
    if (id === 'profile' && !window.profilePipeDone) setTimeout(renderProfilePipe, 80);
}

// ── SIDEBAR & UI ──
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('col');
    document.getElementById('main-content').classList.toggle('exp');
}

function toggleNotif() {
    document.getElementById('notif-panel').classList.toggle('on');
}

function openModal(id) { document.getElementById(id).classList.add('on'); }
function closeModal(id) { document.getElementById(id).classList.remove('on'); }

function togglePfEdit() {
    const v = document.getElementById('pf-view'), e = document.getElementById('pf-edit');
    const editing = e.style.display !== 'none';
    v.style.display = editing ? 'block' : 'none';
    e.style.display = editing ? 'none' : 'block';
}

function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.style.display = 'block';
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => { t.style.display = 'none'; }, 3000);
}

function logout() {
    if (confirm('Log out of CampusPlace?')) {
        sessionStorage.clear();
        window.location.href = 'Login.html';
    }
}

// ── TABS ──
const tabGroups = { st: ['all', 'placed', 'active', 'unplaced'], ct: ['requests', 'approved', 'history'] };
function swtab(group, id, btn) {
    tabGroups[group].forEach(t => {
        const panel = document.getElementById(`${group}-${t}`);
        if(panel) panel.classList.remove('on');
    });
    btn.closest('.tabs').querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
    const targetPanel = document.getElementById(`${group}-${id}`);
    if(targetPanel) targetPanel.classList.add('on');
    btn.classList.add('on');
}

// ── DARK MODE ──
function toggleDarkMode(el) {
    if (!el) {
        el = document.getElementById('dark-mode-toggle');
        if (el) el.checked = !el.checked;
    }
    const isDark = el ? el.checked : document.body.classList.toggle('dark');
    document.body.classList.toggle('dark', isDark);
    localStorage.setItem('cp_dark_mode', isDark);
    
    const icon = document.getElementById('theme-icon');
    if (icon) {
        if (isDark) {
            icon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"></line>';
        } else {
            icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
        }
    }
}

function initDarkMode() {
    const darkPref = localStorage.getItem('cp_dark_mode') === 'true';
    const el = document.getElementById('dark-mode-toggle');
    if (el) el.checked = darkPref;
    document.body.classList.toggle('dark', darkPref);
    const icon = document.getElementById('theme-icon');
    if (darkPref && icon) {
        icon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"></line>';
    }
}

// ── CHARTS ──
function renderHomeCharts() {
    const progCtx = document.getElementById('chart-home-progress');
    if (progCtx) {
        new Chart(progCtx, {
            type: 'bar',
            data: {
                labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
                datasets: [
                    { label: 'Placed', data: [12, 18, 24, 15, 22, 28, 19], backgroundColor: P + 'bb', borderRadius: 6, borderSkipped: false },
                    { label: 'In Process', data: [8, 10, 14, 9, 12, 10, 8], backgroundColor: T + 'bb', borderRadius: 6, borderSkipped: false }
                ]
            },
            options: baseChartOptions
        });
    }

    const branchCtx = document.getElementById('chart-home-branch');
    if (branchCtx) {
        new Chart(branchCtx, {
            type: 'bar',
            data: {
                labels: ['CSE', 'IT', 'ECE', 'EEE', 'MECH'],
                datasets: [{ data: [68, 22, 14, 7, 5], backgroundColor: [P, T, G, A, B].map(c => c + 'cc'), borderRadius: 6, borderSkipped: false }]
            },
            options: { ...baseChartOptions, indexAxis: 'y', scales: { x: { grid: { color: grid }, ticks: tick, beginAtZero: true }, y: { grid: { display: false }, ticks: tick } } }
        });
    }
}

function renderAnalytics() {
    if (window.analyticsDone) return;
    window.analyticsDone = true;

    new Chart(document.getElementById('chart-a-trend'), {
        type: 'bar',
        data: {
            labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'],
            datasets: [
                { type: 'bar', label: 'Placed', data: [8, 12, 18, 24, 15, 22, 28, 19, 12, 5], backgroundColor: P + 'bb', borderRadius: 5, borderSkipped: false, order: 2 },
                { type: 'line', label: 'In Process', data: [14, 18, 22, 16, 18, 14, 10, 8, 6, 4], borderColor: T, backgroundColor: 'transparent', tension: .4, pointRadius: 4, pointBackgroundColor: T, borderWidth: 2.5, order: 1 }
            ]
        },
        options: baseChartOptions
    });

    new Chart(document.getElementById('chart-a-branch'), {
        type: 'bar',
        data: {
            labels: ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'],
            datasets: [{ data: [72, 58, 44, 35, 28, 18], backgroundColor: [P, T, G, A, B, R + '99'].map(c => c + 'cc'), borderRadius: 5, borderSkipped: false }]
        },
        options: { ...baseChartOptions, indexAxis: 'y', scales: { x: { grid: { color: grid }, ticks: tick, max: 100 }, y: { grid: { display: false }, ticks: tick } } }
    });

    const pkgData = { labels: ['<5 LPA', '5–10 LPA', '10–15 LPA', '15–20 LPA', '20–25 LPA', '25+ LPA'], vals: [12, 38, 48, 24, 11, 5] };
    const pkgColors = [P + 'cc', B + 'cc', T + 'cc', G + 'cc', A + 'cc', R + 'cc'];
    new Chart(document.getElementById('chart-a-pkg'), {
        type: 'doughnut',
        data: { labels: pkgData.labels, datasets: [{ data: pkgData.vals, backgroundColor: pkgColors, borderWidth: 3, borderColor: '#fff' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '60%' }
    });
    
    const pl = document.getElementById('pkg-legend-a');
    if (pl) pl.innerHTML = pkgData.labels.map((l, i) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;"><div style="display:flex;align-items:center;gap:7px;"><span style="width:9px;height:9px;border-radius:2px;background:${pkgColors[i]};display:inline-block;"></span><span style="font-size:12px;color:var(--txmu);">${l}</span></div><span style="font-size:12px;font-weight:700;">${pkgData.vals[i]}</span></div>`).join('');

    new Chart(document.getElementById('chart-a-companies'), {
        type: 'bar',
        data: {
            labels: ['TCS', 'Infosys', 'Wipro', 'HCL', 'Cognizant', 'Others'],
            datasets: [{ data: [32, 28, 18, 14, 12, 34], backgroundColor: [P, T, G, A, B, R + '99'].map(c => c + 'bb'), borderRadius: 6, borderSkipped: false }]
        },
        options: baseChartOptions
    });

    new Chart(document.getElementById('chart-a-yoy'), {
        type: 'line',
        data: {
            labels: ['2021', '2022', '2023', '2024', '2025'],
            datasets: [
                { data: [32, 38, 43, 48, 56], borderColor: P, backgroundColor: P + '18', fill: true, tension: .4, pointRadius: 5, pointBackgroundColor: P, borderWidth: 2.5, label: 'JNTU' },
                { data: [35, 40, 44, 47, 52], borderColor: T, backgroundColor: 'transparent', borderDash: [5, 4], tension: .4, pointRadius: 4, pointBackgroundColor: T, borderWidth: 2, label: 'Industry Avg' }
            ]
        },
        options: baseChartOptions
    });

    const roles = { labels: ['SDE / SWE', 'Data / ML', 'Systems Engr', 'DevOps', 'Consulting', 'Others'], data: [38, 20, 18, 10, 9, 5] };
    const rColors = [P, T, G, A, B, R + '99'];
    new Chart(document.getElementById('chart-a-roles'), {
        type: 'doughnut',
        data: { datasets: [{ data: roles.data, backgroundColor: rColors, borderWidth: 3, borderColor: '#fff' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '55%' }
    });
    const rl = document.getElementById('roles-legend-a');
    if (rl) rl.innerHTML = roles.labels.map((l, i) => `<div style="display:flex;align-items:center;gap:7px;"><span style="width:9px;height:9px;border-radius:2px;background:${rColors[i]};flex-shrink:0;"></span><span style="color:var(--txmu);">${l} <strong style="color:var(--tx);">${roles.data[i]}%</strong></span></div>`).join('');
}

function renderProfilePipe() {
    if (window.profilePipeDone) return;
    window.profilePipeDone = true;
    const pipeCtx = document.getElementById('chart-profile-pipe');
    if (pipeCtx) {
        new Chart(pipeCtx, {
            type: 'bar',
            data: {
                labels: ['Registered', 'Applied', 'Shortlisted', 'Interview', 'Placed'],
                datasets: [{ data: [320, 184, 72, 38, 138], backgroundColor: [P + 'cc', B + 'cc', A + 'cc', T + 'cc', G + 'cc'], borderRadius: 7, borderSkipped: false }]
            },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: grid }, ticks: tick, beginAtZero: true }, y: { grid: { display: false }, ticks: tick } } }
        });
    }
}

// Global Click Closer
document.addEventListener('click', e => {
    const panel = document.getElementById('notif-panel');
    if (panel && panel.classList.contains('on') && !panel.contains(e.target) && !e.target.closest('[onclick*=toggleNotif]')) {
        panel.classList.remove('on');
    }
});

// ── API INTEGRATION ──
const API_BASE = 'http://localhost:5000/api/tpo';
const TEMP_TPO_ID = '65e0a0a0a0a0a0a0a0a0a0a0'; // Mock ID since auth is not fully hooked up

async function postNoticeData() {
    const title = document.getElementById('notice-title').value;
    const dept = document.getElementById('notice-dept').value;
    const content = document.getElementById('notice-content').value;

    if(!title || !content) return showToast('Please fill required fields');

    try {
        const res = await fetch(`${API_BASE}/notices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, department: dept, priority: 'Normal', content, tpoId: TEMP_TPO_ID })
        });
        const data = await res.json();
        if(data.success) {
            closeModal('notice-modal');
            showToast('Notice posted successfully!');
            document.getElementById('notice-title').value = '';
            document.getElementById('notice-content').value = '';
        } else {
            showToast(data.message || 'Error posting notice');
        }
    } catch (err) {
        showToast('Network error');
    }
}

async function scheduleDriveData() {
    const companyName = document.getElementById('drive-company').value;
    const date = document.getElementById('drive-date').value;
    const roles = document.getElementById('drive-roles').value || 'Not specified';
    const eligibility = document.getElementById('drive-eligibility').value || 'Any';

    if(!companyName || !date) return showToast('Please fill company and date');

    try {
        const res = await fetch(`${API_BASE}/drives`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyName, date, eligibility, roles, tpoId: TEMP_TPO_ID })
        });
        const data = await res.json();
        if(data.success) {
            closeModal('drive-modal');
            showToast('Drive scheduled successfully!');
            if (typeof loadDrives === 'function') setTimeout(loadDrives, 500);
        } else {
            showToast(data.message || 'Error scheduling drive');
        }
    } catch (err) {
        showToast('Network error');
    }
}

async function approveDriveData(id, btn) {
    try {
        btn.textContent = 'Approving...';
        btn.disabled = true;
        const res = await fetch(`${API_BASE}/drives/${id}/approve`, { method: 'PUT' });
        const data = await res.json();
        
        if (data.success) {
            btn.textContent = 'Approved';
            btn.classList.replace('green', 'sec');
            showToast('Drive approved successfully.');
            setTimeout(loadDrives, 1500); // refresh the list
        } else {
            btn.textContent = 'Approve';
            btn.disabled = false;
            showToast(data.message || 'Error approving drive');
        }
    } catch (err) {
        btn.textContent = 'Approve';
        btn.disabled = false;
        showToast('Network error');
    }
}

async function loadDrives() {
    try {
        const res = await fetch(`${API_BASE}/drives`);
        const data = await res.json();
        if(data.success) {
            const pendingContainer = document.getElementById('pending-drives-container');
            const approvedContainer = document.getElementById('upcoming-drives-container');
            const notifContainer = document.getElementById('notif-list-container');
            const notifDot = document.querySelector('.icon-btn .rdot');
            
            if (!pendingContainer || !approvedContainer) return;

            pendingContainer.innerHTML = '';
            approvedContainer.innerHTML = '';
            if (notifContainer) notifContainer.innerHTML = '';

            const drives = data.drives;
            const pending = drives.filter(d => d.status === 'Pending');
            const approved = drives.filter(d => d.status === 'Approved');

            // --- NOTIFICATIONS & PENDING LIST ---
            if (pending.length === 0) {
                pendingContainer.innerHTML = '<div style="padding:20px;text-align:center;color:var(--txmu);">No pending requests</div>';
                if (notifContainer) notifContainer.innerHTML = '<div style="padding:16px;text-align:center;color:var(--txmu);font-size:12px;">No new notifications</div>';
                if (notifDot) notifDot.style.display = 'none';
            } else {
                if (notifDot) notifDot.style.display = 'block';
                pending.forEach(d => {
                    const dateObj = new Date(d.date);
                    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    
                    pendingContainer.innerHTML += `
                    <div class="req-card">
                        <div class="req-top"><span class="req-co">${d.companyName}</span><span class="pill pending">Pending</span></div>
                        <div class="req-meta">Drive request &middot; ${dateStr} &middot; Roles: ${d.roles}</div>
                        <div class="req-actions">
                            <button class="btn sm green" onclick="approveDriveData('${d._id}', this)">Approve</button>
                            <button class="btn sm red" onclick="showToast('Declined')">Decline</button>
                        </div>
                    </div>`;

                    if (notifContainer) {
                        notifContainer.innerHTML += `
                        <div class="notif-item unread"><span class="n-dot u"></span>
                          <div>
                            <div class="n-text"><strong>${d.companyName}</strong> requested a campus drive for ${dateStr}.</div>
                            <div class="n-time">Just now</div>
                          </div>
                        </div>`;
                    }
                });
            }

            // --- APPROVED LIST ---
            if (approved.length === 0) {
                approvedContainer.innerHTML = '<div style="padding:20px;text-align:center;color:var(--txmu);">No upcoming drives</div>';
            } else {
                approved.forEach(d => {
                    const dateObj = new Date(d.date);
                    const dd = dateObj.getDate();
                    const dm = dateObj.toLocaleDateString('en-US', { month: 'short' });
                    
                    approvedContainer.innerHTML += `
                    <div class="drive-row">
                        <div class="dr-date"><div class="dr-dd">${dd}</div><div class="dr-dm">${dm}</div></div>
                        <div class="dr-info">
                            <div class="dr-name">${d.companyName}</div>
                            <div class="dr-meta">Roles: ${d.roles} &middot; Eligibility: ${d.eligibility}</div>
                        </div>
                        <span class="pill active">Approved</span>
                    </div>`;
                });
            }
        }
    } catch (err) {
        console.error('Failed to load drives', err);
    }
}

async function sendReminderData(studentName, email, btn) {
    try {
        btn.textContent = 'Sending...';
        btn.disabled = true;
        
        const res = await fetch(`${API_BASE}/reminders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: email || 'bommunikhilreddy2004@gmail.com', // Using a test email
                studentName, 
                message: 'Please update your placement profile and check pending drive registrations.' 
            })
        });
        const data = await res.json();
        if(data.success) {
            btn.textContent = 'Sent';
            showToast(`Reminder sent to ${studentName}`);
        } else {
            btn.textContent = 'Send Reminder';
            btn.disabled = false;
            showToast('Error sending reminder');
        }
    } catch (err) {
        btn.textContent = 'Send Reminder';
        btn.disabled = false;
        showToast('Network error while sending');
    }
}

async function saveTPOProfile() {
    const tpoId = sessionStorage.getItem('tpoId') || TEMP_TPO_ID;
    const inputs = document.querySelectorAll('#pf-edit input');
    
    const updates = {
        fullName: inputs[0].value,
        designation: inputs[1].value,
        college: inputs[2].value,
        department: inputs[3].value,
        phone: inputs[4].value,
        location: inputs[5].value,
        email: inputs[6].value
    };

    try {
        const res = await fetch(`${API_BASE}/profile/${tpoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        const data = await res.json();
        
        if (data.success) {
            showToast('Profile updated successfully!');
            // Update view mode
            const p = document.querySelectorAll('#pf-view p');
            p[0].textContent = updates.fullName;
            p[1].textContent = updates.designation;
            p[2].textContent = updates.college;
            p[3].textContent = updates.department;
            p[4].textContent = updates.phone;
            p[5].textContent = updates.location;
            p[6].textContent = updates.email;
            
            togglePfEdit();
        } else {
            showToast(data.message || 'Update failed');
        }
    } catch (err) {
        showToast('Network error');
        console.error(err);
    }
}
