// ── GLOBAL CONSTANTS ──
const TITLES = {
    home: 'Dashboard', students: 'Students', companies: 'Companies',
    drives: 'Campus Drives', placements: 'Placements',
    analytics: 'Analytics', notices: 'Notice Board',
    reports: 'Reports', profile: 'My Profile', settings: 'Settings'
};

const P = '#7c3aed', T = '#0aada0', G = '#16a34a', A = '#d97706', R = '#dc2626', B = '#1759d6';
const grid = 'rgba(124,58,237,0.07)', tick = {
    color: '#6b4a8a',
    font: { size: 10 },
    autoSkip: true,
    maxRotation: 0,
    minRotation: 0
};
const baseChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
        x: { grid: { color: grid }, ticks: { ...tick } },
        y: { grid: { color: grid }, ticks: { ...tick }, beginAtZero: true }
    }
};

function setBadgeCount(id, count) {
    const el = document.getElementById(id);
    if (!el) return;
    const n = Number(count) || 0;
    if (n > 0) {
        el.textContent = String(n);
        el.style.display = 'inline-flex';
    } else {
        el.style.display = 'none';
    }
}

async function refreshSidebarCounters() {
    try {
        const [notifRes, reqRes, drivesRes] = await Promise.all([
            fetch(`${API_ROOT}/api/notifications/count`),
            fetch(`${API_ROOT}/api/tpo/requests/count`),
            fetch(`${API_ROOT}/api/drives/count`)
        ]);

        const notifData = await notifRes.json();
        const reqData = await reqRes.json();
        const drivesData = await drivesRes.json();

        const notifCount = notifData && notifData.success ? Number(notifData.count || 0) : 0;
        const reqCount = reqData && reqData.success ? Number(reqData.count || 0) : 0;
        const driveCount = drivesData && drivesData.success ? Number(drivesData.count || 0) : 0;

        setBadgeCount('sb-badge-notifications', notifCount);
        setBadgeCount('sb-badge-requests', reqCount);
        setBadgeCount('sb-badge-drives', driveCount);

        const dot = document.querySelector('.icon-btn .rdot');
        if (dot) dot.style.display = notifCount > 0 ? 'block' : 'none';
    } catch (e) {
        console.error('refreshSidebarCounters error:', e);
    }
}

// ── INIT ──
window.addEventListener('DOMContentLoaded', async () => {
    if (!getTpoId() || sessionStorage.getItem('userRole') !== 'tpo' || sessionStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'Login.html';
        return;
    }

    const h = new Date().getHours();
    const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    const greetMsg = document.getElementById('greet-msg');
    const nm = sessionStorage.getItem('tpoName') || 'TPO';
    if (greetMsg) greetMsg.textContent = `${g}, ${nm.split(' ')[0]} 👋`;

    try {
        const pr = await fetch(`${API_BASE}/profile/${getTpoId()}`);
        const pd = await pr.json();
        if (pd.success && pd.tpo) {
            applyTPOProfileToDOM(pd.tpo);
            const fn = pd.tpo.fullName || nm;
            if (greetMsg) greetMsg.textContent = `${g}, ${fn.split(' ')[0]} 👋`;
        }
        const [dr, ar] = await Promise.all([
            fetch(`${API_BASE}/dashboard`),
            fetch(`${API_BASE}/analytics`)
        ]);
        const dd = await dr.json();
        const ad = await ar.json();
        if (ad.success && ad.stats && dd.success && dd.stats) {
            window.__tpoStats = { ...ad.stats, ...dd.stats };
            [
                ['tpo-stat-students', dd.stats.totalStudents],
                ['tpo-stat-placed', ad.stats.placedStudents || 0],
                ['tpo-stat-drives', dd.stats.totalDrives],
                ['tpo-greet-students', dd.stats.totalStudents],
                ['tpo-greet-drives', dd.stats.totalDrives]
            ].forEach(([id, v]) => {
                const el = document.getElementById(id);
                if (el) el.textContent = String(v ?? 0);
            });
            updateHomeBatchUI(window.__tpoStats);
            syncTPOProfileHeaderStats();
            await updateHomeOpenJobsStats();
        }
        await refreshSidebarCounters();
    } catch (e) {
        console.error(e);
    }

    initDarkMode();
    lucide.createIcons();
    setTimeout(renderHomeChartsLive, 100);
    // Keep TPO home analytics live as approvals/applications change.
    window.__tpoHomePollTimer = setInterval(async () => {
        if (document.visibilityState !== 'visible') return;
        try {
            const [dr, ar] = await Promise.all([
                fetch(`${API_BASE}/dashboard`),
                fetch(`${API_BASE}/analytics`)
            ]);
            const dd = await dr.json();
            const ad = await ar.json();
            if (ad.success && ad.stats && dd.success && dd.stats) {
                window.__tpoStats = { ...ad.stats, ...dd.stats };
                [
                    ['tpo-stat-students', dd.stats.totalStudents],
                    ['tpo-stat-placed', ad.stats.placedStudents || 0],
                    ['tpo-stat-drives', dd.stats.totalDrives],
                    ['tpo-greet-students', dd.stats.totalStudents],
                    ['tpo-greet-drives', dd.stats.totalDrives]
                ].forEach(([id, v]) => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = String(v ?? 0);
                });
                updateHomeBatchUI(window.__tpoStats);
                syncTPOProfileHeaderStats();
                await updateHomeOpenJobsStats();
                await refreshSidebarCounters();
                renderHomeChartsLive();
            }
        } catch (e) { }
    }, 25000);
    setTimeout(loadDrives, 150);
    setTimeout(() => {
        loadTPOStudentsDirectory();
        loadTPOCompaniesTabs();
        loadTPOFullDrivesPage();
        loadTPOPlacementsPage();
        loadTPONotices();
        loadNotifications();
        renderOpenJobs(); // New feature
    }, 200);
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

    if (id === 'analytics') setTimeout(() => renderAnalytics(true), 80);
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

function dash() {
    return '—';
}

function applyTPOProfileToDOM(t) {
    if (!t) return;
    const d = (v) => (v != null && String(v).trim() !== '' ? String(v).trim() : dash());

    sessionStorage.setItem('tpoName', t.fullName || '');

    const sb = document.getElementById('sb-uname');
    if (sb) sb.textContent = d(t.fullName);
    const tb = document.getElementById('tb-name');
    if (tb) {
        const first = (t.fullName || '').trim().split(/\s+/).filter(Boolean)[0];
        tb.textContent = first || dash();
    }
    const sbd = document.getElementById('sb-udept');
    if (sbd) {
        const meta = [t.designation, t.college].filter((x) => x && String(x).trim());
        sbd.textContent = meta.length ? meta.join(' · ') : dash();
    }

    const hname = document.getElementById('tpo-header-name');
    if (hname) hname.textContent = d(t.fullName);
    const hrole = document.getElementById('tpo-header-role-text');
    if (hrole) {
        const line = [t.designation, t.college].filter((x) => x && String(x).trim());
        hrole.textContent = line.length ? line.join(' · ') : dash();
    }

    const map = [
        ['tpo-pf-fullname', t.fullName],
        ['tpo-pf-designation', t.designation],
        ['tpo-pf-college', t.college],
        ['tpo-pf-department', t.department],
        ['tpo-pf-phone', t.phone],
        ['tpo-pf-location', t.location],
        ['tpo-pf-email', t.email],
        ['tpo-pf-code', t.collegeCode]
    ];
    map.forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = d(val);
    });

    const setIn = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val != null ? String(val) : '';
    };
    setIn('pf-in-name', t.fullName);
    setIn('pf-in-designation', t.designation);
    setIn('pf-in-college', t.college);
    setIn('pf-in-department', t.department);
    setIn('pf-in-phone', t.phone);
    setIn('pf-in-location', t.location);
    setIn('pf-in-email', t.email);
}

function syncTPOProfileHeaderStats() {
    const s = window.__tpoStats || {};
    const total = s.totalStudents ?? 0;
    const placed = s.placedStudents ?? 0;
    const rate = total ? Math.round((placed / total) * 100) : 0;
    const set = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.textContent = v;
    };
    set('tpo-tph-stat-students', String(total));
    set('tpo-tph-stat-placed', String(placed));
    set('tpo-tph-stat-pkg', dash());
    set('tpo-tph-stat-rate', `${rate}%`);
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
        if (panel) panel.classList.remove('on');
    });
    btn.closest('.tabs').querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
    const targetPanel = document.getElementById(`${group}-${id}`);
    if (targetPanel) targetPanel.classList.add('on');
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
function updateHomeBatchUI(s) {
    const total = s.totalStudents || 0;
    const placed = s.placedStudents || 0;
    const proc = s.inProcessStudents || 0;
    const na = s.notAppliedStudents || 0;
    const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
    const elP = document.getElementById('tpo-home-placed-text');
    const elPr = document.getElementById('tpo-home-proc-text');
    const elN = document.getElementById('tpo-home-na-text');
    const barP = document.getElementById('tpo-home-bar-placed');
    const barPr = document.getElementById('tpo-home-bar-proc');
    const barN = document.getElementById('tpo-home-bar-na');
    if (elP) elP.innerHTML = `<span style="font-weight:700;color:var(--G);">${placed} / ${total}</span>`;
    if (elPr) elPr.innerHTML = `<span style="font-weight:700;color:var(--A);">${proc} / ${total}</span>`;
    if (elN) elN.innerHTML = `<span style="font-weight:700;color:var(--txmu);">${na} / ${total}</span>`;
    if (barP) barP.style.width = `${pct(placed)}%`;
    if (barPr) barPr.style.width = `${pct(proc)}%`;
    if (barN) barN.style.width = `${pct(na)}%`;
    const avgEl = document.getElementById('tpo-home-pkg-avg');
    const hiEl = document.getElementById('tpo-home-pkg-high');
    const rateEl = document.getElementById('tpo-home-place-rate');
    if (avgEl) avgEl.textContent = '—';
    if (hiEl) hiEl.textContent = '—';
    if (rateEl) rateEl.textContent = total ? `${Math.round((placed / total) * 100)}%` : '0%';
}

function renderHomeChartsLive() {
    // When re-drawing (polling), destroy existing Chart.js instances first.
    try {
        const p = document.getElementById('chart-home-progress');
        if (p && typeof Chart !== 'undefined' && Chart.getChart(p)) Chart.getChart(p).destroy();
        const b = document.getElementById('chart-home-branch');
        if (b && typeof Chart !== 'undefined' && Chart.getChart(b)) Chart.getChart(b).destroy();
    } catch (e) { }

    const s = window.__tpoStats || {};
    const sum = (s.totalStudents || 0) + (s.totalCompanies || 0) + (s.totalDrives || 0);
    const progCtx = document.getElementById('chart-home-progress');
    if (progCtx && progCtx.parentElement) {
        if (sum === 0) {
            progCtx.style.display = 'none';
            let msg = progCtx.parentElement.querySelector('.chart-empty-state');
            if (!msg) {
                msg = document.createElement('p');
                msg.className = 'empty-state chart-empty-state';
                msg.style.padding = '20px';
                msg.style.textAlign = 'center';
                msg.style.color = 'var(--txmu)';
                msg.textContent = 'No analytics data available';
                progCtx.parentElement.appendChild(msg);
            } else {
                msg.style.display = 'block';
            }
        } else {
            progCtx.style.display = 'block';
            const msg = progCtx.parentElement.querySelector('.chart-empty-state');
            if (msg) msg.remove();
            new Chart(progCtx, {
                type: 'bar',
                data: {
                    labels: ['Students', 'Companies', 'Drives'],
                    datasets: [
                        {
                            label: 'Live',
                            data: [s.totalStudents || 0, s.totalCompanies || 0, s.totalDrives || 0],
                            backgroundColor: [P + 'bb', T + 'bb', G + 'bb'],
                            borderRadius: 6,
                            borderSkipped: false
                        }
                    ]
                },
                options: baseChartOptions
            });
        }
    }

    const branchCtx = document.getElementById('chart-home-branch');
    if (branchCtx && branchCtx.parentElement) {
        if (sum === 0) {
            branchCtx.style.display = 'none';
            let msg = branchCtx.parentElement.querySelector('.chart-empty-state');
            if (!msg) {
                msg = document.createElement('p');
                msg.className = 'empty-state chart-empty-state';
                msg.style.padding = '20px';
                msg.style.textAlign = 'center';
                msg.style.color = 'var(--txmu)';
                msg.textContent = 'No analytics data available';
                branchCtx.parentElement.appendChild(msg);
            } else {
                msg.style.display = 'block';
            }
        } else {
            branchCtx.style.display = 'block';
            const msg = branchCtx.parentElement.querySelector('.chart-empty-state');
            if (msg) msg.remove();
            new Chart(branchCtx, {
                type: 'bar',
                data: {
                    labels: ['Students', 'Companies', 'Drives'],
                    datasets: [{ data: [s.totalStudents || 0, s.totalCompanies || 0, s.totalDrives || 0], backgroundColor: [P, T, G].map((c) => c + 'cc'), borderRadius: 6, borderSkipped: false }]
                },
                options: { ...baseChartOptions, indexAxis: 'y', scales: { x: { grid: { color: grid }, ticks: tick, beginAtZero: true }, y: { grid: { display: false }, ticks: tick } } }
            });
        }
    }
}

function destroyTPOAnalyticsCharts() {
    if (!window.__tpoAnCharts) window.__tpoAnCharts = [];
    window.__tpoAnCharts.forEach((c) => {
        try {
            c.destroy();
        } catch (e) { }
    });
    window.__tpoAnCharts = [];
}

function fillAnalyticsChartWrap(wrapId, canvasId, heightPx, emptyMessage) {
    const w = document.getElementById(wrapId);
    if (!w) return null;
    if (emptyMessage) {
        w.innerHTML = `<p class="empty-state" style="padding:20px;text-align:center;color:var(--txmu);">${emptyMessage}</p>`;
        return null;
    }
    w.innerHTML = '';
    w.style.position = 'relative';
    if (heightPx) w.style.height = `${heightPx}px`;
    const c = document.createElement('canvas');
    c.id = canvasId;
    w.appendChild(c);
    return c;
}

function renderAnalytics(force) {
    if (!force && window.analyticsDone) return;
    window.analyticsDone = true;
    destroyTPOAnalyticsCharts();

    const s = window.__tpoStats || {};
    const setTxt = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.textContent = v;
    };
    setTxt('tpo-an-eligible', String(s.totalStudents ?? 0));
    setTxt('tpo-an-placed', String(s.placedStudents ?? 0));
    setTxt('tpo-an-pkg', '—');
    setTxt('tpo-an-cos', String(s.totalCompanies ?? 0));
    const donut = document.getElementById('tpo-an-placed-donut');
    if (donut) donut.textContent = String(s.placedStudents ?? 0);

    const newC = awaitOrSyncCounts(s);
    const trendCtx = fillAnalyticsChartWrap(
        'tpo-wrap-a-trend',
        'chart-a-trend',
        210,
        newC.sumPipe === 0 ? 'No analytics data available' : ''
    );
    if (trendCtx) {
        window.__tpoAnCharts.push(
            new Chart(trendCtx, {
                type: 'bar',
                data: {
                    labels: ['Applied', 'Shortlisted', 'Interview', 'Offers'],
                    datasets: [
                        {
                            label: 'Live',
                            data: [newC.applied, s.shortlisted || 0, s.interviews || 0, s.offers || 0],
                            backgroundColor: [P + 'bb', B + 'bb', A + 'bb', G + 'bb'],
                            borderRadius: 6,
                            borderSkipped: false
                        }
                    ]
                },
                options: { ...baseChartOptions, plugins: { legend: { display: false } } }
            })
        );
    }

    const br = s.branchPlacement || [];
    const brSum = br.reduce((a, b) => a + (b.rate || 0), 0);
    const branchCtx = fillAnalyticsChartWrap(
        'tpo-wrap-a-branch',
        'chart-a-branch',
        250,
        !br.length || brSum === 0 ? 'No analytics data available' : ''
    );
    if (branchCtx) {
        window.__tpoAnCharts.push(
            new Chart(branchCtx, {
                type: 'bar',
                data: {
                    labels: br.map((x) => x.branch),
                    datasets: [
                        {
                            data: br.map((x) => x.rate),
                            backgroundColor: br.map((_, i) => [P, T, G, A, B, R][i % 6] + 'cc'),
                            borderRadius: 5,
                            borderSkipped: false
                        }
                    ]
                },
                options: {
                    ...baseChartOptions,
                    indexAxis: 'y',
                    scales: {
                        x: { grid: { color: grid }, ticks: tick, max: 100, beginAtZero: true },
                        y: { grid: { display: false }, ticks: tick }
                    }
                }
            })
        );
    }

    const pkgLeg = document.getElementById('pkg-legend-a');
    if (pkgLeg) pkgLeg.innerHTML = '';
    fillAnalyticsChartWrap('tpo-wrap-a-pkg', 'chart-a-pkg', 160, 'No analytics data available');

    const hires = s.companyHires || [];
    const coCtx = fillAnalyticsChartWrap(
        'tpo-wrap-a-companies',
        'chart-a-companies',
        180,
        !hires.length ? 'No analytics data available' : ''
    );
    if (coCtx) {
        window.__tpoAnCharts.push(
            new Chart(coCtx, {
                type: 'bar',
                data: {
                    labels: hires.map((x) => x.name),
                    datasets: [
                        {
                            data: hires.map((x) => x.hires),
                            backgroundColor: hires.map((_, i) => [P, T, G, A, B, R][i % 6] + 'bb'),
                            borderRadius: 6,
                            borderSkipped: false
                        }
                    ]
                },
                options: baseChartOptions
            })
        );
    }

    fillAnalyticsChartWrap('tpo-wrap-a-yoy', 'chart-a-yoy', 200, 'No analytics data available');
    const rl = document.getElementById('roles-legend-a');
    if (rl) rl.innerHTML = '';
    fillAnalyticsChartWrap('tpo-wrap-a-roles', 'chart-a-roles', 180, 'No analytics data available');
}

function awaitOrSyncCounts(s) {
    const applied = s.totalApplications || 0;
    const sumPipe = applied + (s.shortlisted || 0) + (s.interviews || 0) + (s.offers || 0);
    return { applied, sumPipe };
}

function renderProfilePipe() {
    if (window.profilePipeDone) return;
    window.profilePipeDone = true;
    const pipeCtx = document.getElementById('chart-profile-pipe');
    if (!pipeCtx || !pipeCtx.parentElement) return;
    const s = window.__tpoStats || {};
    const total = s.totalStudents || 0;
    const applied = s.totalApplications || 0;
    const sh = s.shortlisted || 0;
    const inv = s.interviews || 0;
    const pl = s.placedStudents || 0;
    const sum = total + applied + sh + inv + pl;
    if (sum === 0) {
        pipeCtx.parentElement.innerHTML =
            '<p class="empty-state" style="padding:20px;text-align:center;color:var(--txmu);">No analytics data available</p>';
        return;
    }
    window.__tpoProfileChart = new Chart(pipeCtx, {
        type: 'bar',
        data: {
            labels: ['Registered', 'Applied', 'Shortlisted', 'Interview', 'Placed'],
            datasets: [
                {
                    data: [total, applied, sh, inv, pl],
                    backgroundColor: [P + 'cc', B + 'cc', A + 'cc', T + 'cc', G + 'cc'],
                    borderRadius: 7,
                    borderSkipped: false
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: grid }, ticks: tick, beginAtZero: true },
                y: { grid: { display: false }, ticks: tick }
            }
        }
    });
}

async function loadTPOStudentsDirectory() {
    const all = document.getElementById('tpo-st-all-rows');
    const placed = document.getElementById('tpo-st-placed-rows');
    const active = document.getElementById('tpo-st-active-rows');
    const unplaced = document.getElementById('tpo-st-unplaced-rows');
    if (!all) return;
    try {
        const res = await fetch(`${API_BASE}/students`);
        const data = await res.json();
        const list = data.success && data.students ? data.students : [];
        const c = { placed: 0, active: 0, unplaced: 0 };
        list.forEach((st) => {
            c[st.category] = (c[st.category] || 0) + 1;
        });
        const tabAll = document.getElementById('tpo-tab-count-all');
        const tabPl = document.getElementById('tpo-tab-count-placed');
        const tabAc = document.getElementById('tpo-tab-count-active');
        const tabUn = document.getElementById('tpo-tab-count-unplaced');
        if (tabAll) tabAll.textContent = String(list.length);
        if (tabPl) tabPl.textContent = String(c.placed || 0);
        if (tabAc) tabAc.textContent = String(c.active || 0);
        if (tabUn) tabUn.textContent = String(c.unplaced || 0);

        const row = (st, extra) => {
            const status =
                st.category === 'placed'
                    ? '<span class="pill placed">Placed</span>'
                    : st.category === 'active'
                        ? '<span class="pill active">In process</span>'
                        : '<span class="pill closed">Not applied</span>';
            return `<div class="tbl-row g5">
              <div><div class="tbl-name">${st.fullName || '—'}</div><div class="tbl-sub">Roll: ${st.rollNumber || '—'}</div></div>
              <span style="font-size:12.5px;color:var(--txmu);">${st.branch || '—'} · ${st.year || '—'}</span>
              <span style="font-weight:600;">${st.cgpa != null ? st.cgpa : '—'}</span>
              ${extra || status}
              <button class="btn sm sec" type="button">View</button>
            </div>`;
        };

        const rowPlaced = (st) =>
            `<div class="tbl-row g4">
              <div><div class="tbl-name">${st.fullName || '—'}</div><div class="tbl-sub">Roll: ${st.rollNumber || '—'}</div></div>
              <span style="font-size:12.5px;color:var(--txmu);">${st.branch || '—'} · ${st.cgpa != null ? st.cgpa : '—'}</span>
              <span style="font-weight:600;">—</span>
              <span style="font-weight:700;color:var(--G);">—</span>
            </div>`;

        const rowActive = (st) =>
            `<div class="tbl-row g4">
              <div><div class="tbl-name">${st.fullName || '—'}</div><div class="tbl-sub">Roll: ${st.rollNumber || '—'}</div></div>
              <span style="font-size:12.5px;color:var(--txmu);">${st.branch || '—'} · ${st.cgpa != null ? st.cgpa : '—'}</span>
              <span>Applications: ${st.applicationCount || 0}</span>
              <span class="pill active">In process</span>
            </div>`;

        const rowUn = (st) =>
            `<div class="tbl-row g3">
              <div><div class="tbl-name">${st.fullName || '—'}</div><div class="tbl-sub">Roll: ${st.rollNumber || '—'}</div></div>
              <span style="font-size:12.5px;color:var(--txmu);">${st.branch || '—'} · ${st.cgpa != null ? st.cgpa : '—'}</span>
              <button class="btn sm" type="button" onclick="sendReminderData('${(st.fullName || '').replace(/'/g, "\\'")}', '${st.email || ''}', this)">Send Reminder</button>
            </div>`;

        all.innerHTML = list.length
            ? list.map((st) => row(st)).join('')
            : '<div style="padding:20px;text-align:center;color:var(--txmu);font-size:13px;">No students registered in the directory</div>';
        const plList = list.filter((x) => x.category === 'placed');
        const acList = list.filter((x) => x.category === 'active');
        const unList = list.filter((x) => x.category === 'unplaced');
        if (placed)
            placed.innerHTML = plList.length
                ? plList.map(rowPlaced).join('')
                : '<div style="padding:20px;text-align:center;color:var(--txmu);font-size:13px;">No students found in this category</div>';
        if (active)
            active.innerHTML = acList.length
                ? acList.map(rowActive).join('')
                : '<div style="padding:20px;text-align:center;color:var(--txmu);font-size:13px;">No students found in this category</div>';
        if (unplaced)
            unplaced.innerHTML = unList.length
                ? unList.map(rowUn).join('')
                : '<div style="padding:20px;text-align:center;color:var(--txmu);font-size:13px;">No students found in this category</div>';
    } catch (e) {
        console.error(e);
        all.innerHTML = '<p class="empty-state" style="padding:24px;">No data available</p>';
    }
}

async function loadTPOCompaniesTabs() {
    const reqEl = document.getElementById('tpo-ct-requests');
    const apprEl = document.getElementById('tpo-ct-approved');
    const histEl = document.getElementById('tpo-ct-history');
    const badge = document.getElementById('tpo-ct-req-badge');
    try {
        const [reqRes, coRes] = await Promise.all([
            fetch(`${API_BASE}/requests`),
            fetch(`${API_BASE}/companies-list`)
        ]);
        const reqData = await reqRes.json();
        const coData = await coRes.json();
        const pendingJ = reqData.success ? reqData.pendingJobs || [] : [];
        const pendingD = reqData.success ? reqData.pendingDrives || [] : [];
        const n = pendingJ.length + pendingD.length;
        if (badge) badge.textContent = String(n);

        if (reqEl) {
            if (n === 0) {
                reqEl.innerHTML = '<div style="padding:24px;text-align:center;color:var(--txmu);font-size:13px;">No pending requests</div>';
            } else {
                let html = '';
                pendingJ.forEach((j) => {
                    const co =
                        j.companyId && j.companyId.companyName ? j.companyId.companyName : j.companyName || 'Company';
                    html += `<div class="req-card">
                      <div class="req-top"><span class="req-co">${co}</span><span class="pill pending">Job</span></div>
                      <div class="req-meta">${j.title || ''} · ${j.location || ''}</div>
                      <div class="req-actions">
                        <button class="btn sm green" type="button" onclick="approveTPO('job','${j._id}',this)">Approve</button>
                        <button class="btn sm red" type="button" onclick="rejectTPO('job','${j._id}',this)">Decline</button>
                      </div>
                    </div>`;
                });
                pendingD.forEach((d) => {
                    html += `<div class="req-card">
                      <div class="req-top"><span class="req-co">${d.companyName}</span><span class="pill pending">Drive</span></div>
                      <div class="req-meta">Drive · ${new Date(d.date).toLocaleDateString()}</div>
                      <div class="req-actions">
                        <button class="btn sm green" type="button" onclick="approveTPO('drive','${d._id}',this)">Approve</button>
                        <button class="btn sm red" type="button" onclick="rejectTPO('drive','${d._id}',this)">Decline</button>
                      </div>
                    </div>`;
                });
                reqEl.innerHTML = html;
            }
        }

        const companies = coData.success && coData.companies ? coData.companies : [];
        if (apprEl) {
            if (!companies.length) {
                apprEl.innerHTML =
                    '<div class="tbl-head g4"><span>Company</span><span>Email</span><span>Industry</span><span>Status</span></div><div style="padding:24px;text-align:center;color:var(--txmu);font-size:13px;">No registered companies yet</div>';
            } else {
                let h =
                    '<div class="tbl-head g4"><span>Company</span><span>Email</span><span>Industry</span><span>Status</span></div>';
                companies.forEach((c) => {
                    h += `<div class="tbl-row g4">
                      <div><div class="tbl-name">${c.companyName || '—'}</div><div class="tbl-sub">${c.contactPerson || ''}</div></div>
                      <span style="font-size:12.5px;color:var(--txmu);">${c.email || '—'}</span>
                      <span style="font-size:12.5px;color:var(--txmu);">${c.industry || '—'}</span>
                      <span class="pill confirmed">Registered</span>
                    </div>`;
                });
                apprEl.innerHTML = h;
            }
        }
        if (histEl) {
            histEl.innerHTML =
                '<div class="tbl-head g4"><span>Company</span><span>Visited</span><span>Students Hired</span><span>Avg Package</span></div><div style="padding:24px;text-align:center;color:var(--txmu);font-size:13px;">No placement history available</div>';
        }
    } catch (e) {
        console.error(e);
    }
}

async function loadTPOFullDrivesPage() {
    const up = document.getElementById('tpo-page-upcoming-list');
    const done = document.getElementById('tpo-page-completed-list');
    const ds1 = document.getElementById('tpo-ds-upcoming');
    const ds2 = document.getElementById('tpo-ds-participation');
    const ds3 = document.getElementById('tpo-ds-pkg');
    if (!up || !done) return;
    try {
        const res = await fetch(`${API_BASE}/drives`);
        const data = await res.json();
        const drives = data.success && data.drives ? data.drives : [];
        const now = new Date();
        const upcoming = [];
        const completed = [];
        drives.forEach((d) => {
            const dt = new Date(d.date);
            const row = `<div class="drive-row">
            <div class="dr-date"><div class="dr-dd">${isNaN(dt.getTime()) ? '—' : dt.getDate()}</div><div class="dr-dm">${isNaN(dt.getTime()) ? '' : dt.toLocaleString(undefined, { month: 'short' })}</div></div>
            <div class="dr-info"><div class="dr-name">${d.companyName || ''}</div><div class="dr-meta">${d.roles || ''} · ${d.eligibility || ''}</div></div>
            <span class="pill ${d.status === 'Approved' ? 'active' : d.status === 'Rejected' ? 'closed' : 'pending'}">${d.status}</span>
          </div>`;
            if (!isNaN(dt.getTime()) && dt >= now && d.status !== 'Rejected') upcoming.push(row);
            else completed.push(row);
        });
        if (ds1) ds1.textContent = String(upcoming.length);
        if (ds2) ds2.textContent = '0%';
        if (ds3) ds3.textContent = '—';
        up.innerHTML = upcoming.length
            ? upcoming.join('')
            : '<div style="padding:40px;text-align:center;color:var(--txmu);font-size:13px;border:1px dashed var(--br);border-radius:12px;margin:10px;">No upcoming drives scheduled</div>';
        done.innerHTML = completed.length
            ? completed.join('')
            : '<div style="padding:20px;text-align:center;color:var(--txmu);font-size:13px;">No past drives in history</div>';
    } catch (e) {
        up.innerHTML = '<div style="padding:20px;text-align:center;color:var(--R);opacity:0.7;">Unable to load drives</div>';
        done.innerHTML = '';
    }
}

async function loadTPOPlacementsPage() {
    const tb = document.getElementById('tpo-placements-tbody');
    if (!tb) return;
    try {
        const res = await fetch(`${API_BASE}/placement-records`);
        const data = await res.json();
        const rows = data.success && data.records ? data.records : [];
        const set = (id, v) => {
            const el = document.getElementById(id);
            if (el) el.textContent = v;
        };
        set('tpo-pl-st-placed', String(rows.length));
        set('tpo-pl-avgpkg', '—');
        set('tpo-pl-cos', window.__tpoStats ? String(window.__tpoStats.totalCompanies || 0) : '0');
        const ts = window.__tpoStats || {};
        const rate =
            ts.totalStudents > 0 ? `${Math.round(((ts.placedStudents || 0) / ts.totalStudents) * 100)}%` : '0%';
        set('tpo-pl-rate', rate);

        if (!rows.length) {
            tb.innerHTML =
                '<p class="empty-state" style="padding:24px;text-align:center;">No data available</p>';
            return;
        }
        tb.innerHTML = rows
            .map((r) => {
                const st = r.studentId || {};
                const co = r.companyId || {};
                const job = r.jobId || {};
                const pkg = job.salary ? job.salary : '—';
                return `<div class="tbl-row g5">
                <div><div class="tbl-name">${st.fullName || '—'}</div></div>
                <span style="color:var(--txmu);">${st.branch || '—'}</span>
                <span style="font-weight:600;">${co.companyName || '—'}</span>
                <span>${job.title || '—'}</span>
                <span style="font-weight:700;color:var(--G);">${pkg}</span>
              </div>`;
            })
            .join('');
    } catch (e) {
        tb.innerHTML = '<p class="empty-state" style="padding:24px;">No data available</p>';
    }
}

async function loadTPONotices() {
    const act = document.getElementById('tpo-notices-active');
    const past = document.getElementById('tpo-notices-past');
    if (!act) return;
    try {
        const res = await fetch(`${API_BASE}/notices`);
        const data = await res.json();
        const list = data.success && data.notices ? data.notices : [];

        const now = new Date();
        const activeList = list.filter(n => !n.postedAt || (now - new Date(n.postedAt)) < (7 * 24 * 60 * 60 * 1000));
        const archivedList = list.filter(n => n.postedAt && (now - new Date(n.postedAt)) >= (7 * 24 * 60 * 60 * 1000));

        const renderNotice = (n) => `<div class="notice-row"><span class="notice-dot" style="background:var(--P);"></span>
            <div style="flex:1;">
              <div style="font-size:13.5px;font-weight:600;margin-bottom:3px;">${n.title || ''}</div>
              <div class="notice-body">${n.content || ''}</div>
              <div class="notice-time">${n.department || ''} · ${n.postedAt ? new Date(n.postedAt).toLocaleString() : ''}</div>
            </div></div>`;

        if (!activeList.length) {
            act.innerHTML = '<div style="padding:32px;text-align:center;color:var(--txmu);font-size:13px;border:1px dashed var(--br);border-radius:12px;margin:10px;">No active notices at the moment</div>';
        } else {
            act.innerHTML = activeList.map(renderNotice).join('');
        }

        if (past) {
            if (!archivedList.length) {
                past.innerHTML = '<div style="padding:20px;text-align:center;color:var(--txmu);font-size:13px;">Notice archives are empty</div>';
            } else {
                past.innerHTML = archivedList.map(renderNotice).join('');
            }
        }
    } catch (e) {
        act.innerHTML = '<div style="padding:20px;text-align:center;color:var(--R);opacity:0.7;">Notice board unavailable</div>';
    }
}

async function loadNotifications() {
    const list = document.getElementById('tpo-notifications-list');
    if (!list) return;
    try {
        const res = await fetch(`${API_ROOT}/api/notifications/count`);
        const data = await res.json();
        const count = data && data.success ? Number(data.count || 0) : 0;

        if (count > 0) {
            list.innerHTML = `<div class="notif-item unread"><span class="n-dot u"></span><div><div class="n-text"><strong>${count}</strong> pending placement updates</div><div class="n-time">Live</div></div></div>`;
        } else {
            list.innerHTML = '<div style="padding:24px;text-align:center;color:var(--txmu);font-size:12px;font-weight:500;">No new notifications</div>';
        }
    } catch (e) {
        list.innerHTML = '<div style="padding:24px;text-align:center;color:var(--txmu);font-size:12px;font-weight:500;">No new notifications</div>';
    }
}

function exportTPOAnalyticsCsv() {
    const s = window.__tpoStats || {};
    const lines = [
        'metric,value',
        `totalStudents,${s.totalStudents || 0}`,
        `totalCompanies,${s.totalCompanies || 0}`,
        `totalDrives,${s.totalDrives || 0}`,
        `totalApplications,${s.totalApplications || 0}`,
        `placedStudents,${s.placedStudents || 0}`
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tpo-analytics.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Report exported.');
}

// Global Click Closer
document.addEventListener('click', e => {
    const panel = document.getElementById('notif-panel');
    if (panel && panel.classList.contains('on') && !panel.contains(e.target) && !e.target.closest('[onclick*=toggleNotif]')) {
        panel.classList.remove('on');
    }
});

// ── API INTEGRATION ──
const API_ROOT = (window.CAMPUS_API_BASE || sessionStorage.getItem('CAMPUS_API_BASE') || 'http://127.0.0.1:5000').replace(/\/$/, '');
const API_BASE = `${API_ROOT}/api/tpo`;

function getTpoId() {
    return sessionStorage.getItem('tpoId');
}

async function postNoticeData() {
    const title = document.getElementById('notice-title').value;
    const dept = document.getElementById('notice-dept').value;
    const content = document.getElementById('notice-content').value;

    if (!title || !content) return showToast('Please fill required fields');

    try {
        const res = await fetch(`${API_BASE}/notices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, department: dept || 'General', priority: 'Normal', content, tpoId: getTpoId() })
        });
        const data = await res.json();
        if (data.success) {
            closeModal('notice-modal');
            showToast('Notice posted successfully!');
            document.getElementById('notice-title').value = '';
            document.getElementById('notice-content').value = '';
            loadTPONotices();
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

    if (!companyName || !date) return showToast('Please fill company and date');

    try {
        const res = await fetch(`${API_BASE}/drives`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyName, date, eligibility, roles, tpoId: getTpoId() })
        });
        const data = await res.json();
        if (data.success) {
            closeModal('drive-modal');
            showToast('Drive scheduled successfully!');
            if (typeof loadDrives === 'function') setTimeout(loadDrives, 500);
            loadTPOFullDrivesPage();
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

async function approveTPO(resourceType, id, btn) {
    try {
        if (btn) {
            btn.disabled = true;
            btn.textContent = '…';
        }
        const res = await fetch(`${API_BASE}/approve/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resourceType })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Approved');
            loadDrives();
            loadTPOFullDrivesPage();
            loadTPOCompaniesTabs();
        } else {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Approve';
            }
            showToast(data.message || 'Error');
        }
    } catch (err) {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Approve';
        }
        showToast('Network error');
    }
}

async function rejectTPO(resourceType, id, btn) {
    try {
        if (btn) {
            btn.disabled = true;
            btn.textContent = '…';
        }
        const res = await fetch(`${API_BASE}/reject/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resourceType })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Rejected');
            loadDrives();
            loadTPOFullDrivesPage();
            loadTPOCompaniesTabs();
        } else {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Reject';
            }
            showToast(data.message || 'Error');
        }
    } catch (err) {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Reject';
        }
        showToast('Network error');
    }
}

async function loadDrives() {
    try {
        const jobsBox = document.getElementById('pending-jobs-container');
        const pendingContainer = document.getElementById('pending-drives-container');
        const approvedContainer = document.getElementById('upcoming-drives-container');
        const notifContainer = document.getElementById('notif-list-container');
        const notifDot = document.querySelector('.icon-btn .rdot');

        if (jobsBox) jobsBox.innerHTML = '';
        if (pendingContainer) pendingContainer.innerHTML = '';
        if (approvedContainer) approvedContainer.innerHTML = '';
        if (notifContainer) notifContainer.innerHTML = '';

        const reqRes = await fetch(`${API_BASE}/requests`);
        const reqData = await reqRes.json();
        const pendingJobs = reqData.success ? reqData.pendingJobs || [] : [];
        const pendingDrivesReq = reqData.success ? reqData.pendingDrives || [] : [];
        const pendingCompanyRequests = reqData.success ? reqData.pendingCompanyRequests || [] : [];
        const pendingCount = pendingJobs.length + pendingDrivesReq.length + pendingCompanyRequests.length;
        window.__tpoPendingRequestsCount = pendingCount;
        const pe = document.getElementById('tpo-stat-pending');
        if (pe) pe.textContent = String(pendingCount);
        const gr = document.getElementById('tpo-greet-requests');
        if (gr) gr.textContent = String(pendingCount);
        const gs = document.getElementById('greet-sub');
        if (gs) gs.textContent = `${pendingCount} requests pending`;

        if (jobsBox) {
            if (!pendingCompanyRequests.length) {
                jobsBox.innerHTML = '<div style="padding:20px;text-align:center;color:var(--txmu);">No pending requests</div>';
            } else {
                pendingCompanyRequests.forEach((cr) => {
                    const dateObj = cr.createdAt ? new Date(cr.createdAt) : null;
                    const dateStr = dateObj && !isNaN(dateObj.getTime())
                        ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : '—';

                    const msg = cr.message ? String(cr.message).trim() : '';
                    const snippet = msg.length > 120 ? msg.slice(0, 120) + '…' : msg;

                    jobsBox.innerHTML += `
                    <div class="req-card">
                        <div class="req-top">
                          <span class="req-co">${cr.companyName || 'Company'}</span>
                          <span class="pill pending">Pending</span>
                        </div>
                        <div class="req-meta">${cr.role || ''} &middot; Requested ${dateStr}</div>
                        ${snippet ? `<div style="color:var(--txmu);font-size:12px;line-height:1.35;margin-top:6px;">${snippet}</div>` : ''}
                    </div>`;
                });
            }
        }

        if (pendingContainer) {
            if (!pendingDrivesReq.length) {
                pendingContainer.innerHTML = '<div style="padding:20px;text-align:center;color:var(--txmu);">No pending drive requests</div>';
            } else {
                pendingDrivesReq.forEach((d) => {
                    const dateObj = new Date(d.date);
                    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    pendingContainer.innerHTML += `
                    <div class="req-card">
                        <div class="req-top"><span class="req-co">${d.companyName}</span><span class="pill pending">Drive</span></div>
                        <div class="req-meta">Drive request &middot; ${dateStr} &middot; Roles: ${d.roles}</div>
                        <div class="req-actions">
                            <button class="btn sm green" onclick="approveTPO('drive','${d._id}',this)">Approve</button>
                            <button class="btn sm red" onclick="rejectTPO('drive','${d._id}',this)">Reject</button>
                        </div>
                    </div>`;
                });
            }
        }

        if (notifContainer) {
            if (pendingCount === 0) {
                notifContainer.innerHTML = '<div style="padding:16px;text-align:center;color:var(--txmu);font-size:12px;">No new notifications</div>';
                if (notifDot) notifDot.style.display = 'none';
            } else {
                if (notifDot) notifDot.style.display = 'block';
                pendingJobs.forEach((j) => {
                    const co = j.companyId && j.companyId.companyName ? j.companyId.companyName : j.companyName || 'Company';
                    notifContainer.innerHTML += `<div class="notif-item unread"><span class="n-dot u"></span><div><div class="n-text"><strong>${co}</strong> — job: ${j.title || ''}</div><div class="n-time">Pending</div></div></div>`;
                });
                pendingDrivesReq.forEach((d) => {
                    const dateObj = new Date(d.date);
                    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    notifContainer.innerHTML += `<div class="notif-item unread"><span class="n-dot u"></span><div><div class="n-text"><strong>${d.companyName}</strong> — drive ${dateStr}</div><div class="n-time">Pending</div></div></div>`;
                });
            }
        }

        const res = await fetch(`${API_BASE}/drives`);
        const data = await res.json();
        if (data.success && approvedContainer) {
            const approved = (data.drives || []).filter((d) => d.status === 'Approved' || d.status === 'scheduled');
            if (approved.length === 0) {
                approvedContainer.innerHTML = '<div style="padding:20px;text-align:center;color:var(--txmu);">No drives scheduled</div>';
            } else {
                approved.forEach((d) => {
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
                        <span class="pill active">Scheduled</span>
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
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showToast('Student email missing');
            return;
        }
        btn.textContent = 'Sending...';
        btn.disabled = true;

        const res = await fetch(`${API_BASE}/reminders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                studentName,
                message: 'Please update your placement profile and check pending drive registrations.'
            })
        });
        const data = await res.json();
        if (data.success) {
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
    const tpoId = getTpoId();
    if (!tpoId) {
        showToast('Session expired — please log in again');
        return;
    }
    const gv = (id) => (document.getElementById(id)?.value ?? '').trim();

    const updates = {
        fullName: gv('pf-in-name'),
        designation: gv('pf-in-designation'),
        college: gv('pf-in-college'),
        department: gv('pf-in-department'),
        phone: gv('pf-in-phone'),
        location: gv('pf-in-location'),
        email: gv('pf-in-email')
    };

    try {
        const res = await fetch(`${API_BASE}/profile/${tpoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        const data = await res.json();

        if (data.success && data.tpo) {
            showToast('Profile updated successfully!');
            applyTPOProfileToDOM(data.tpo);
            togglePfEdit();
        } else {
            showToast(data.message || 'Update failed');
        }
    } catch (err) {
        showToast('Network error');
        console.error(err);
    }
}

// ════════════════════════════════
// ── OPEN JOBS ENGINE (CareerSpace) ──
// ════════════════════════════════
// Open jobs are fetched from backend (no dummy data).
const OPEN_JOBS = [];

const COLLEGE_BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];
let activeOJBranch = 'all';
let openJobsCache = [];

function filterByBranch(branch, btn) {
    activeOJBranch = branch;
    document.querySelectorAll('.branch-pill').forEach(p => p.classList.remove('on'));
    if (btn) btn.classList.add('on');
    renderOpenJobs();
}

function jobMatchesBranch(job, branch) {
    if (branch === 'all') return true;
    const req = Array.isArray(job.requiredBranches) ? job.requiredBranches : [];
    if (!req.length) return true;
    return req.includes(branch);
}

async function renderOpenJobs() {
    const q = (document.getElementById('oj-search')?.value || '').toLowerCase().trim();

    try {
        const res = await fetch(`${API_ROOT}/api/open-jobs`);
        const data = await res.json();
        openJobsCache = data && data.success && Array.isArray(data.openJobs) ? data.openJobs : [];
    } catch (e) {
        console.error(e);
        openJobsCache = [];
    }

    const allFiltered = openJobsCache.filter((j) => {
        const text = `${j.title || ''} ${j.companyName || ''} ${j.description || ''} ${j.location || ''} ${j.package || ''}`.toLowerCase();
        return jobMatchesBranch(j, activeOJBranch) && (!q || text.includes(q));
    });

    const slFiltered = allFiltered.filter((j) => j.isNotified);
    const sentFiltered = allFiltered.filter((j) => j.outreachStatus && j.outreachStatus !== 'rejected');

    const allList = document.getElementById('oj-all-list');
    const slList = document.getElementById('oj-shortlisted-list');

    if (allList) {
        allList.innerHTML = allFiltered.length ? allFiltered.map(ojCard).join('') : '<div class="empty-state">No jobs available</div>';
    }
    if (slList) {
        slList.innerHTML = slFiltered.length ? slFiltered.map(ojCard).join('') : '<div class="empty-state">No open jobs notified yet</div>';
    }

    const ac = document.getElementById('oj-all-count');
    const sc = document.getElementById('oj-sl-count');
    const sentC = document.getElementById('oj-sent-count');
    if (ac) ac.textContent = `(${allFiltered.length})`;
    if (sc) sc.textContent = `(${slFiltered.length})`;
    if (sentC) sentC.textContent = `(${sentFiltered.length})`;

    // Render outreach/sent tab rows
    const sentCard = document.querySelector('#oj-sent .card');
    if (sentCard) {
        const rows = sentFiltered
            .map((j) => {
                const status = j.outreachStatus || 'pending';
                const pillClass = status === 'accepted' ? 'confirmed' : status === 'rejected' ? 'declined' : 'awaiting';
                const branchStr = Array.isArray(j.requiredBranches) && j.requiredBranches.length ? j.requiredBranches.join(', ') : 'All branches';
                const dt = j.outreachCreatedAt ? new Date(j.outreachCreatedAt) : null;
                const sentOn = dt && !isNaN(dt.getTime()) ? dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—';
                const action =
                    status === 'accepted'
                        ? `<button class="btn sm teal" onclick="scheduleDriveFromAcceptedOpenJob('${j._id}', this)">Schedule Drive</button>`
                        : `<span style="font-size:12px;color:var(--txmu);">Awaiting TPO response</span>`;

                return `<div class="tbl-row outreach-table">
                    <div>
                      <div style="font-size:13px;font-weight:750;color:var(--txm);">${j.companyName || '—'} – ${j.title || ''}</div>
                      <div class="tbl-sub">${j.package || ''} · ${branchStr}</div>
                    </div>
                    <span style="font-size:12px;color:var(--txmu);">${branchStr}</span>
                    <span style="font-size:12px;">${sentOn}</span>
                    <span class="pill ${pillClass}">${status === 'pending' ? 'Pending' : status === 'accepted' ? 'Accepted' : 'Rejected'}</span>
                    <div style="display:flex;justify-content:flex-end;gap:8px;">${action}</div>
                  </div>`;
            })
            .join('');

        sentCard.innerHTML = `
          <div class="tbl-head outreach-table"><span>Company · Role</span><span>Branches</span><span>Sent On</span><span>Status</span><span>Action</span></div>
          ${rows || '<div style="padding:24px;text-align:center;color:var(--txmu);">No outreach requests yet</div>'}
        `;
    }
}

function modeColor(mode) {
    if (mode === 'Remote') return 'color:var(--T);';
    if (mode === 'Offline') return 'color:var(--A);';
    if (mode === 'Hybrid') return 'color:var(--B);';
    return 'color:var(--P);';
}

async function updateHomeOpenJobsStats() {
    const statEl = document.getElementById('tpo-stat-companies'); // Open Jobs count on home
    const noteEl = document.getElementById('tpo-outreach-sent-note'); // outreach sent note on home
    const acceptedBox = document.getElementById('home-accepted-outreach-container');
    if (!statEl && !noteEl && !acceptedBox) return;

    try {
        const res = await fetch(`${API_ROOT}/api/open-jobs`);
        const data = await res.json();
        const jobs = data && data.success && Array.isArray(data.openJobs) ? data.openJobs : [];
        openJobsCache = jobs;

        const outreachSent = jobs.filter((j) => j.outreachStatus && j.outreachStatus !== 'rejected').length;
        if (statEl) statEl.textContent = String(jobs.length);
        if (noteEl) noteEl.textContent = `${outreachSent} outreach sent`;

        if (acceptedBox) {
            const accepted = jobs.filter((j) => j.outreachStatus === 'accepted');
            if (!accepted.length) {
                acceptedBox.innerHTML = '<div style="padding:20px;text-align:center;color:var(--txmu);">No outreach accepted yet</div>';
                const mainEl = document.getElementById('tpo-next-major-main');
                const subEl = document.getElementById('tpo-next-major-sub');
                const btnEl = document.getElementById('tpo-next-major-schedule-btn');
                if (mainEl) mainEl.innerHTML = '<strong>—</strong> Campus Drive — Accepted';
                if (subEl) subEl.textContent = 'No accepted outreach yet';
                if (btnEl) { btnEl.onclick = null; btnEl.disabled = true; }
            } else {
                acceptedBox.innerHTML = accepted.map((j) => {
                    const branchStr = Array.isArray(j.requiredBranches) && j.requiredBranches.length ? j.requiredBranches.join(', ') : 'All branches';
                    const dt = j.outreachCreatedAt ? new Date(j.outreachCreatedAt) : null;
                    const sentOn = dt && !isNaN(dt.getTime()) ? dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—';
                    return `
                    <div class="req-card">
                      <div class="req-top">
                        <span class="req-co">${j.companyName || '—'} – ${j.title || ''}</span>
                        <span class="pill confirmed">Accepted</span>
                      </div>
                      <div class="req-meta">Via CareerSpace · ${j.package || ''} · ${branchStr} · Outreach sent ${sentOn}</div>
                      <div class="req-actions">
                        <button class="btn sm teal" onclick="scheduleDriveFromAcceptedOpenJob('${String(j._id)}')">Schedule Drive</button>
                      </div>
                    </div>`;
                }).join('');

                const mainEl = document.getElementById('tpo-next-major-main');
                const subEl = document.getElementById('tpo-next-major-sub');
                const btnEl = document.getElementById('tpo-next-major-schedule-btn');
                const first = accepted[0];
                const firstBranch = Array.isArray(first.requiredBranches) && first.requiredBranches.length ? first.requiredBranches.join(', ') : 'All branches';
                if (mainEl) mainEl.innerHTML = `<strong>${first.companyName || '—'}</strong> Campus Drive — Accepted`;
                if (subEl) subEl.textContent = `Schedule the drive now · ${firstBranch}`;
                if (btnEl) { btnEl.onclick = () => scheduleDriveFromAcceptedOpenJob(String(first._id)); btnEl.disabled = false; }
            }

            const gs = document.getElementById('greet-sub');
            if (gs) {
                const pendingCount = window.__tpoPendingRequestsCount ?? 0;
                const placedStudents = window.__tpoStats?.placedStudents ?? 0;
                gs.textContent = `${pendingCount} requests pending · ${accepted.length} outreach accepted · ${placedStudents} students placed`;
            }
        }
    } catch (e) {
        console.error(e);
        if (statEl) statEl.textContent = '0';
        if (noteEl) noteEl.textContent = `0 outreach sent`;
        if (acceptedBox) acceptedBox.innerHTML = '<div style="padding:20px;text-align:center;color:var(--txmu);">No outreach accepted yet</div>';
    }
}

function ojCard(j) {
    const company = j.companyName || '—';
    const pkg = j.package || '—';
    const loc = j.location || '—';

    const notifyBtn = j.isNotified
        ? `<span class="pill notified" style="font-size:10px;">✓ Notified</span>`
        : `<button class="btn sm green" onclick="notifyStudents('${String(j._id)}')">Notify Students</button>`;

    let outreachBtn = '';
    if (j.outreachStatus) {
        const label = j.outreachStatus === 'accepted' ? 'Accepted' : j.outreachStatus === 'rejected' ? 'Rejected' : 'Pending';
        const pillClass = j.outreachStatus === 'accepted' ? 'confirmed' : j.outreachStatus === 'rejected' ? 'declined' : 'awaiting';
        outreachBtn = `<span class="pill ${pillClass}" style="font-size:10px;">${label}</span>`;
    } else {
        outreachBtn = `<button class="btn sm sec" onclick="sendOutreach('${String(j._id)}')">Contact Company</button>`;
    }

    return `<div class="oj-card" id="ojc-${String(j._id)}">
        <div class="oj-top">
            <div class="oj-info">
                <div class="oj-title">${j.title || '—'}</div>
                <div class="oj-co">${company}</div>
                <div class="oj-tags">
                  <span class="oj-tag ctc">${pkg}</span>
                  <span class="oj-tag">${loc}</span>
                </div>
            </div>
            <div class="oj-actions">${notifyBtn}${outreachBtn}</div>
        </div>
    </div>`;
}

function notifyStudents(openJobId) {
    const j = openJobsCache.find((x) => String(x._id) === String(openJobId));
    if (!j) return;

    const el = document.getElementById('notify-job-info');
    if (el) {
        const branches = Array.isArray(j.requiredBranches) && j.requiredBranches.length ? j.requiredBranches.join(', ') : 'All branches';
        el.innerHTML = `<strong style="font-size:14px;">${j.title}</strong> <span style="color:var(--txmu);">at</span> <strong>${j.companyName}</strong><br>` +
            `<span style="color:var(--G);font-weight:700;">${j.package || '—'}</span> · ${j.location || '—'}<br>` +
            `Branches: <strong>${branches}</strong>`;
    }

    const btn = document.getElementById('notify-send-btn');
    if (btn) {
        btn.onclick = async () => {
            try {
                const modal = document.getElementById('notify-modal');
                const checks = modal ? modal.querySelectorAll('.cb-item input[type="checkbox"]') : [];
                const channels = [];
                let sendEmail = false;
                checks.forEach((input) => {
                    const label = input.closest('label');
                    const text = (label ? label.textContent : '').toLowerCase();
                    if (!input.checked) return;
                    if (text.includes('email')) {
                        sendEmail = true;
                        channels.push('email');
                    } else {
                        // dashboard / notice board both show in dashboard
                        channels.push('dashboard');
                    }
                });

                const res = await fetch(`${API_ROOT}/api/open-jobs/notify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ openJobId: j._id, channels, sendEmail })
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.message || 'Notify failed');

                closeModal('notify-modal');
                showToast(`Students notified for ${j.companyName} — ${j.title}`);
                await renderOpenJobs();
            } catch (e) {
                console.error(e);
                showToast('Failed to notify students');
            }
        };
    }

    openModal('notify-modal');
}

function scheduleDriveFromAcceptedOpenJob(openJobId) {
    const j = openJobsCache.find((x) => String(x._id) === String(openJobId));
    if (!j) return;

    const companyEl = document.getElementById('drive-company');
    const rolesEl = document.getElementById('drive-roles');
    const dateEl = document.getElementById('drive-date');
    const eligEl = document.getElementById('drive-eligibility');

    if (companyEl) companyEl.value = j.companyName || '';
    if (rolesEl) rolesEl.value = j.title || '';
    if (dateEl) dateEl.value = dateEl.value || new Date().toISOString().slice(0, 10);
    if (eligEl) eligEl.value = (j.requiredBranches || []).join(', ') || '';

    openModal('drive-modal');
}

let contactOpenJobId = null;

function openContactCompanyModal() {
    contactOpenJobId = null;
    const coEl = document.getElementById('c-company');
    const roleEl = document.getElementById('c-role');
    const msgEl = document.getElementById('c-msg');
    if (coEl) coEl.value = '';
    if (roleEl) roleEl.value = '';
    if (msgEl) msgEl.value = '';
    openModal('contact-modal');
}

async function submitContactCompanyRequest() {
    try {
        const coEl = document.getElementById('c-company');
        const roleEl = document.getElementById('c-role');
        const msgEl = document.getElementById('c-msg');

        const companyName = (coEl?.value || '').trim();
        const role = (roleEl?.value || '').trim();
        let message = (msgEl?.value || '').trim();
        if (!message) message = (msgEl?.placeholder || '').trim(); // fallback to placeholder text

        if (!companyName || !role || !message) {
            showToast('Please fill company name, role, and message.');
            return;
        }

        const payload = {
            companyName,
            role,
            message,
            openJobId: contactOpenJobId || null
        };

        const res = await fetch(`${API_ROOT}/api/tpo/request-company`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Request failed');

        closeModal('contact-modal');
        showToast(`Company request sent: ${companyName}`);
        await renderOpenJobs();
    } catch (e) {
        console.error(e);
        showToast('Failed to send company request');
    }
}

function sendOutreach(openJobId) {
    const j = openJobsCache.find((x) => String(x._id) === String(openJobId));
    if (!j) return;
    contactOpenJobId = openJobId;

    const coEl = document.getElementById('c-company');
    const roleEl = document.getElementById('c-role');
    const msgEl = document.getElementById('c-msg');

    if (coEl) coEl.value = j.companyName || '';
    if (roleEl) roleEl.value = j.title || '';

    if (msgEl) {
        const branches = Array.isArray(j.requiredBranches) && j.requiredBranches.length ? j.requiredBranches.join(', ') : 'eligible branches';
        msgEl.value =
            `Dear Hiring Team at ${j.companyName},\n\n` +
            `We at our T&P Cell would like to invite your organization to conduct a campus recruitment drive for the role of ${j.title}.\n\n` +
            `This opportunity has been matched to students from: ${branches}.\n` +
            `${j.location ? `Location preference: ${j.location}.\n` : ''}\n` +
            `We would appreciate your confirmation of availability and preferred dates.\n\n` +
            `Warm regards,\nTPO / Placement Office`;
    }

    openModal('contact-modal');
}

async function syncOpenJobsNow() {
    try {
        showToast('Syncing open jobs…');
        const res = await fetch(`${API_ROOT}/api/open-jobs/sync`, { method: 'POST' });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Sync failed');
        await renderOpenJobs();
        showToast(`Open jobs synced (${data.syncedCount || 0}).`);
    } catch (e) {
        console.error(e);
        showToast('Open jobs sync failed');
    }
}
