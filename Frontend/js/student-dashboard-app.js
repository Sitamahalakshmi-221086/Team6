/* global Chart, lucide, showEmpty, CAMPUS_API_BASE */
(function () {
  const API = typeof CAMPUS_API_BASE !== 'undefined' ? CAMPUS_API_BASE : 'http://localhost:5001';

  let jobs = [];
  let applications = [];
  let drives = [];
  let analyticsStats = { totalApplications: 0, shortlisted: 0, interviews: 0, offers: 0 };
  let currentJob = null;
  let studentProfile = null;
  let homeChartsDrawn = false;
  let analyticsDrawn = false;

  function studentId() {
    return sessionStorage.getItem('studentId');
  }

  function savedKey() {
    return `campus_saved_jobs_${studentId()}`;
  }

  function loadSavedSet() {
    try {
      return new Set(JSON.parse(localStorage.getItem(savedKey()) || '[]'));
    } catch {
      return new Set();
    }
  }

  function saveSavedSet(set) {
    localStorage.setItem(savedKey(), JSON.stringify([...set]));
  }

  let savedJobIds = loadSavedSet();

  function parseSalaryNum(s) {
    if (!s || typeof s !== 'string') return 0;
    const m = s.match(/(\d+(\.\d+)?)/);
    return m ? parseFloat(m[1]) : 0;
  }

  function formatShortDate(d) {
    if (!d) return '—';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return '—';
    return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function mapApiJob(j, studentSkills) {
    const id = String(j._id);
    const skills = Array.isArray(j.requirements) && j.requirements.length ? j.requirements : [];
    const st = (studentSkills || []).map((x) => String(x).toLowerCase());
    const reco =
      st.length > 0 &&
      skills.some((sk) => st.some((s) => String(sk).toLowerCase().includes(s) || s.includes(String(sk).toLowerCase())));
    return {
      _id: id,
      id,
      title: j.title,
      company: j.companyName,
      loc: j.location || '—',
      type: j.jobType || 'Full Time',
      ctc: j.salary || '—',
      ctcVal: parseSalaryNum(j.salary),
      dl: j.deadline ? formatShortDate(j.deadline) : 'Open',
      deadlineDate: j.deadline ? new Date(j.deadline) : null,
      cgpa: '—',
      branch: '—',
      desc: j.description || '',
      skills,
      reco,
      intern: String(j.jobType || '').toLowerCase().includes('intern'),
      applied: false,
      saved: savedJobIds.has(id),
      logo: (j.companyName || 'CO').slice(0, 3).toUpperCase(),
      col: '#1759d6',
      applicantsCount: j.applicantsCount || 0
    };
  }

  function appStatusMeta(status) {
    const map = {
      New: { label: 'Under Review', cls: 'review', stage: 1 },
      Reviewed: { label: 'Under Review', cls: 'review', stage: 1 },
      Shortlisted: { label: 'Shortlisted', cls: 'short', stage: 2 },
      Interview: { label: 'Interview', cls: 'interview', stage: 3 },
      Offered: { label: 'Offer', cls: 'registered', stage: 4 },
      Hired: { label: 'Hired', cls: 'registered', stage: 5 },
      Rejected: { label: 'Rejected', cls: 'rejected', stage: -1 }
    };
    return map[status] || map.New;
  }

  function mapApplication(a) {
    const job = a.jobId || {};
    const meta = appStatusMeta(a.status);
    return {
      id: String(a._id),
      jobId: String(a.jobId?._id || a.jobId),
      title: job.title || '—',
      company: job.companyName || '—',
      type: job.jobType || '—',
      ctc: job.salary || '—',
      date: formatShortDate(a.appliedAt),
      statusLabel: meta.label,
      statusClass: meta.cls,
      stage: meta.stage
    };
  }

  function syncSessionFromProfile(s) {
    sessionStorage.setItem('studentName', s.fullName || '');
    sessionStorage.setItem('studentEmail', s.email || '');
    sessionStorage.setItem('studentPhone', s.phone || '');
    sessionStorage.setItem('studentBranch', s.branch || '');
    sessionStorage.setItem('studentYear', s.year || '');
    sessionStorage.setItem('studentCGPA', s.cgpa != null ? String(s.cgpa) : '');
    sessionStorage.setItem('studentRoll', s.rollNumber || '');
    sessionStorage.setItem('studentLinkedin', s.linkedin || '');
    sessionStorage.setItem('studentGithub', s.github || '');
    sessionStorage.setItem('studentLocation', s.preferredLocation || '');
    sessionStorage.setItem('studentSkills', JSON.stringify(s.skills || []));
  }

  function profileCompletenessPct(s) {
    if (!s) return 0;
    let n = 0;
    if ((s.fullName || '').trim()) n += 1;
    if ((s.phone || '').trim()) n += 1;
    if (s.resume && s.resume.filename) n += 1;
    if ((s.skills || []).length) n += 1;
    return Math.round((n / 4) * 100);
  }

  function setRingStroke(circleEl, pct, circumference) {
    if (!circleEl) return;
    const p = Math.max(0, Math.min(100, pct));
    circleEl.setAttribute('stroke-dasharray', String(circumference));
    circleEl.setAttribute('stroke-dashoffset', String(circumference * (1 - p / 100)));
  }

  function clearStudentProfileBindings() {
    document.querySelectorAll('[id^="profile-"]').forEach((el) => {
      if (el.id === 'profile-skills-display' || el.id === 'profile-projects-wrap') {
        el.innerHTML = '';
        return;
      }
      el.textContent = '';
    });
    document.querySelectorAll('[id^="pv-"]').forEach((el) => {
      el.textContent = '';
    });
    [
      'sb-name',
      'sb-udept',
      'home-pw-name',
      'set-email',
      'tb-name',
      'resume-filename',
      'resume-meta',
      'home-pkg-mid-val',
      'home-pkg-mid-sub',
      'home-stat-avg',
      'home-stat-high',
      'home-stat-rate'
    ].forEach((id) => {
      const e = document.getElementById(id);
      if (e) e.textContent = '';
    });
    const br = document.getElementById('pg-branch-year');
    if (br) br.innerHTML = '';
    const psw = document.getElementById('p-skills-wrap');
    if (psw) {
      const inp = document.getElementById('p-sk-inp');
      psw.innerHTML = '';
      if (inp) psw.appendChild(inp);
    }
  }

  function bindSocialLink(id, url) {
    const a = document.getElementById(id);
    if (!a) return;
    const u = (url || '').trim();
    if (u) {
      a.href = /^https?:\/\//i.test(u) ? u : `https://${u}`;
      a.classList.remove('is-disabled');
    } else {
      a.href = '#';
      a.classList.add('is-disabled');
    }
  }

  function applyProfileToDOM(s) {
    clearStudentProfileBindings();

    const dash = '—';
    const displayName = (s.fullName || '').trim();
    const initials = displayName
      ? displayName
          .split(/\s+/)
          .map((w) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : '—';

    ['sb-av', 'home-av', 'pg-av', 'tb-av', 'home-pw-av'].forEach((id) => {
      const e = document.getElementById(id);
      if (e) e.textContent = initials;
    });

    ['profile-name', 'sb-name', 'home-pw-name', 'pv-fname'].forEach((id) => {
      const e = document.getElementById(id);
      if (e) e.textContent = displayName || dash;
    });

    ['profile-email', 'set-email'].forEach((id) => {
      const e = document.getElementById(id);
      if (e) e.textContent = (s.email || '').trim() || dash;
    });

    const branch = (s.branch || '').trim();
    const year = (s.year || '').trim();
    const cgpa = s.cgpa != null ? String(s.cgpa) : '';
    const roll = (s.rollNumber || '').trim();
    const phone = (s.phone || '').trim();
    const linkedin = (s.linkedin || '').trim();
    const github = (s.github || '').trim();
    const location = (s.preferredLocation || '').trim();
    const skillsArr = s.skills || [];

    const brYrEl = document.getElementById('pg-branch-year');
    if (brYrEl) {
      const parts = [branch, year].filter(Boolean);
      brYrEl.innerHTML =
        parts.length > 0
          ? `<i data-lucide="graduation-cap"></i> ${parts.join(' · ')}`
          : `<i data-lucide="graduation-cap"></i> ${dash}`;
    }
    const cgpaTag = document.getElementById('pg-cgpa-tag');
    if (cgpaTag) cgpaTag.textContent = cgpa ? `CGPA ${cgpa}` : `CGPA ${dash}`;
    const rollTag = document.getElementById('pg-roll-tag');
    if (rollTag) rollTag.textContent = roll ? `Roll: ${roll}` : dash;

    const homeBranch = document.getElementById('home-pw-branch');
    if (homeBranch) homeBranch.textContent = branch || dash;
    const homeYear = document.getElementById('home-pw-year');
    if (homeYear) homeYear.textContent = year || dash;
    const homeCgpa = document.getElementById('home-pw-cgpa');
    if (homeCgpa) homeCgpa.textContent = cgpa ? `${cgpa} CGPA` : dash;

    const sbDept = document.getElementById('sb-udept');
    if (sbDept) {
      const meta = [branch, year].filter(Boolean);
      sbDept.textContent = meta.length ? meta.join(' · ') : dash;
    }

    const pvRoll = document.getElementById('pv-roll');
    if (pvRoll) pvRoll.textContent = roll || dash;
    const pvBranch = document.getElementById('pv-branch');
    if (pvBranch) pvBranch.textContent = branch || dash;
    const pvYear = document.getElementById('pv-year');
    if (pvYear) pvYear.textContent = year || dash;
    const pvCgpa = document.getElementById('pv-cgpa');
    if (pvCgpa) pvCgpa.textContent = cgpa ? `${cgpa} / 10` : dash;
    const pvPhone = document.getElementById('pv-phone');
    if (pvPhone) pvPhone.textContent = phone || dash;

    const pvName = document.getElementById('pv-name');
    if (pvName) pvName.textContent = displayName || dash;

    const contactParts = [];
    if ((s.email || '').trim()) contactParts.push(s.email.trim());
    if (phone) contactParts.push(phone);
    if (linkedin) contactParts.push(linkedin);
    const pvContact = document.getElementById('pv-contact');
    if (pvContact) pvContact.textContent = contactParts.length ? contactParts.join(' · ') : dash;

    const pvObj = document.getElementById('pv-obj');
    if (pvObj) pvObj.textContent = dash;
    const pvEdu = document.getElementById('pv-edu');
    if (pvEdu) {
      const eduBits = [`B.Tech – ${branch || dash}`, `CGPA ${cgpa || dash}`, year || dash].join(' · ');
      pvEdu.textContent = eduBits;
    }
    ['pv-p1', 'pv-exp', 'pv-cert'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = dash;
    });

    const pvSkillsLine = document.getElementById('pv-skills');
    if (pvSkillsLine) {
      pvSkillsLine.textContent = skillsArr.length ? skillsArr.join(', ') : dash;
    }

    bindSocialLink('soc-linkedin', linkedin);
    bindSocialLink('soc-github', github);

    const skillGrid = document.getElementById('profile-skills-display');
    if (skillGrid) {
      skillGrid.innerHTML = '';
      if (skillsArr.length) {
        skillsArr.forEach((sk) => {
          const span = document.createElement('span');
          span.className = 'skill-tag';
          span.style.cursor = 'default';
          span.textContent = sk;
          skillGrid.appendChild(span);
        });
      } else {
        showEmpty(skillGrid, 'No skills added');
      }
    }

    const resumeName = document.getElementById('resume-filename');
    const resumeMeta = document.getElementById('resume-meta');
    if (s.resume && s.resume.filename) {
      if (resumeName) resumeName.textContent = s.resume.filename;
      if (resumeMeta) resumeMeta.textContent = s.resume.contentType ? s.resume.contentType : dash;
    } else {
      if (resumeName) resumeName.textContent = dash;
      if (resumeMeta) resumeMeta.textContent = 'No resume uploaded';
    }

    const pct = profileCompletenessPct(s);
    const hpwPct = document.getElementById('hpw-ring-pct');
    const pphPct = document.getElementById('pph-ring-pct');
    if (hpwPct) hpwPct.textContent = `${pct}%`;
    if (pphPct) pphPct.textContent = `${pct}%`;
    setRingStroke(document.getElementById('hpw-ring-circle'), pct, 201);
    setRingStroke(document.getElementById('pph-ring-circle'), pct, 226);

    const chkBasic = !!(s.fullName || '').trim() && !!(s.email || '').trim();
    const chkResume = !!(s.resume && s.resume.filename);
    const chkSkills = skillsArr.length > 0;
    const chkLi = !!linkedin;
    const chkPhoto = false;
    [['hpw-chk-basic', chkBasic], ['hpw-chk-resume', chkResume], ['hpw-chk-skills', chkSkills], ['hpw-chk-li', chkLi], ['hpw-chk-photo', chkPhoto]].forEach(
      ([id, ok]) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.toggle('done', ok);
        el.classList.toggle('todo', !ok);
      }
    );
    [['pph-chk-basic', chkBasic], ['pph-chk-resume', chkResume], ['pph-chk-skills', chkSkills], ['pph-chk-li', chkLi], ['pph-chk-photo', chkPhoto]].forEach(
      ([id, ok]) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.toggle('done', ok);
        el.classList.toggle('todo', !ok);
      }
    );

    const editName = document.getElementById('edit-name');
    if (editName) editName.value = (s.fullName || '').trim();
    const editPhone = document.getElementById('edit-phone');
    if (editPhone) editPhone.value = (s.phone || '').trim();
    const editRoll = document.getElementById('edit-roll');
    if (editRoll) editRoll.value = (s.rollNumber || '').trim();
    const editCgpa = document.getElementById('edit-cgpa');
    if (editCgpa) editCgpa.value = cgpa;
    const editBranch = document.getElementById('edit-branch');
    if (editBranch) editBranch.value = branch;
    const editYear = document.getElementById('edit-year');
    if (editYear) editYear.value = year;
    const editLinkedin = document.getElementById('edit-linkedin');
    if (editLinkedin) editLinkedin.value = linkedin;
    const editGithub = document.getElementById('edit-github');
    if (editGithub) editGithub.value = github;
    const editLoc = document.getElementById('edit-loc');
    if (editLoc) editLoc.value = location;

    const pSkillsWrap = document.getElementById('p-skills-wrap');
    if (pSkillsWrap) {
      const inp = document.getElementById('p-sk-inp');
      pSkillsWrap.innerHTML = '';
      skillsArr.forEach((sk) => {
        const span = document.createElement('span');
        span.className = 'skill-tag';
        span.innerHTML = `${sk}<button onclick="this.parentElement.remove()">×</button>`;
        if (inp) pSkillsWrap.insertBefore(span, inp);
        else pSkillsWrap.appendChild(span);
      });
      if (inp) pSkillsWrap.appendChild(inp);
    }

    const tbNameEl = document.getElementById('tb-name');
    if (tbNameEl) {
      const first = displayName.split(/\s+/)[0];
      tbNameEl.textContent = first || dash;
    }

    const projectsWrap = document.getElementById('profile-projects-wrap');
    if (projectsWrap) showEmpty(projectsWrap, 'No projects added');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  async function fetchProfile() {
    const sid = studentId();
    const res = await fetch(`${API}/api/students/profile/${sid}`);
    const data = await res.json();
    if (!data.success || !data.student) throw new Error('Profile load failed');
    studentProfile = data.student;
    syncSessionFromProfile(studentProfile);
    applyProfileToDOM(studentProfile);
  }

  async function loadData() {
    const sid = studentId();
    const [jobsRes, appsRes, drivesRes, anRes] = await Promise.all([
      fetch(`${API}/api/jobs`),
      fetch(`${API}/api/applications/student/${sid}`),
      fetch(`${API}/api/drives`),
      fetch(`${API}/api/students/analytics/${sid}`)
    ]);
    const jobsData = await jobsRes.json();
    const appsData = await appsRes.json();
    const drivesData = await drivesRes.json();
    const anData = await anRes.json();

    const skills = studentProfile?.skills || [];
    jobs = (jobsData.jobs || []).map((j) => mapApiJob(j, skills));
    applications = (appsData.applications || []).map(mapApplication);
    drives = drivesData.drives || [];
    if (anData.success && anData.stats) analyticsStats = anData.stats;

    const appliedIds = new Set(applications.map((a) => a.jobId).filter(Boolean));
    jobs.forEach((j) => {
      j.applied = appliedIds.has(j.id);
      j.saved = savedJobIds.has(j.id);
    });
  }

  function updateStatsUI() {
    const openJobs = jobs.length;
    const apps = analyticsStats.totalApplications || 0;
    const interviews = analyticsStats.interviews || 0;
    const greetMatch = document.querySelector('.greet-stat:nth-child(1) .greet-stat-val');
    const greetInt = document.querySelector('.greet-stat:nth-child(2) .greet-stat-val');
    const greetDrive = document.querySelector('.greet-stat:nth-child(3) .greet-stat-val');
    if (greetMatch) greetMatch.textContent = String(openJobs);
    if (greetInt) greetInt.textContent = String(interviews);
    if (greetDrive) {
      const next = drives[0]?.date ? formatShortDate(drives[0].date) : '—';
      greetDrive.textContent = next;
    }

    const statRow = document.querySelectorAll('#pg-home .stats-row .stat-val');
    if (statRow[0]) statRow[0].textContent = String(openJobs);
    if (statRow[1]) statRow[1].textContent = String(apps);
    if (statRow[2]) statRow[2].textContent = String(interviews);
    if (statRow[3]) {
      statRow[3].textContent = `${profileCompletenessPct(studentProfile)}%`;
    }

    const sbj = document.getElementById('sb-badge-jobs');
    const sba = document.getElementById('sb-badge-apps');
    if (sbj) sbj.textContent = String(openJobs);
    if (sba) sba.textContent = String(applications.length);

    const hAvg = document.getElementById('home-stat-avg');
    const hHi = document.getElementById('home-stat-high');
    const hRt = document.getElementById('home-stat-rate');
    if (hAvg) hAvg.textContent = '—';
    if (hHi) hHi.textContent = '—';
    if (hRt) hRt.textContent = '—';

    const midVal = document.getElementById('home-pkg-mid-val');
    const midSub = document.getElementById('home-pkg-mid-sub');
    if (midVal) midVal.textContent = String(analyticsStats.shortlisted || 0);
    if (midSub) midSub.textContent = 'shortlisted';

    const greetSub = document.getElementById('greet-sub');
    if (greetSub) {
      greetSub.innerHTML =
        openJobs > 0
          ? `<strong>${openJobs} open role${openJobs === 1 ? '' : 's'}</strong> approved by your TPO.`
          : 'No approved jobs yet — check back after your TPO approves company postings.';
    }

    const nsc = document.querySelector('.nsc-main');
    if (nsc) {
      if (applications.length) {
        const a = applications[0];
        nsc.innerHTML = `Latest: <strong>${a.title}</strong> at ${a.company} — ${a.statusLabel}`;
      } else {
        nsc.textContent = 'Apply to approved jobs to track your progress here.';
      }
    }

    const psCnt = document.querySelectorAll('.pipeline-track .ps-cnt');
    if (psCnt.length >= 5) {
      const pastApply = applications.filter((a) => a.statusClass !== 'rejected').length;
      psCnt[0].textContent = String(analyticsStats.totalApplications || 0);
      psCnt[1].textContent = String(Math.max(0, pastApply - (analyticsStats.shortlisted || 0)));
      psCnt[2].textContent = String(analyticsStats.shortlisted || 0);
      psCnt[3].textContent = String(analyticsStats.interviews || 0);
      psCnt[4].textContent = String(analyticsStats.offers || 0);
    }

    document.querySelectorAll('#pg-applications .tabs .tab-cnt').forEach((el, i) => {
      const all = applications.length;
      const active = applications.filter((a) => a.statusClass !== 'rejected').length;
      const closed = applications.filter((a) => a.statusClass === 'rejected').length;
      const vals = [all, active, closed];
      if (vals[i] != null) el.textContent = String(vals[i]);
    });

    const hpw = document.querySelectorAll('.hpw-stat-val');
    if (hpw.length >= 4) {
      hpw[0].textContent = String(analyticsStats.totalApplications || 0);
      hpw[1].textContent = String(analyticsStats.shortlisted || 0);
      hpw[2].textContent = String(analyticsStats.interviews || 0);
      hpw[3].textContent = String(analyticsStats.offers || 0);
    }

    const pph = document.querySelectorAll('.pph-stat-val');
    if (pph.length >= 4) {
      pph[0].textContent = String(analyticsStats.totalApplications || 0);
      pph[1].textContent = String(analyticsStats.shortlisted || 0);
      pph[2].textContent = String(analyticsStats.interviews || 0);
      pph[3].textContent = String(analyticsStats.offers || 0);
    }

    const setCard = document.querySelectorAll('#pg-profile .stat-val');
    if (setCard.length >= 4) {
      setCard[0].textContent = String(analyticsStats.totalApplications || 0);
      setCard[1].textContent = String(analyticsStats.shortlisted || 0);
      setCard[2].textContent = String(analyticsStats.interviews || 0);
      setCard[3].textContent = String(analyticsStats.offers || 0);
    }
  }

  function destroyChart(id) {
    const el = document.getElementById(id);
    if (el && typeof Chart !== 'undefined' && Chart.getChart(el)) Chart.getChart(el).destroy();
  }

  function chartOrEmpty(canvasId, drawFn) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !canvas.parentElement) return;
    const sum =
      (analyticsStats.totalApplications || 0) +
      (analyticsStats.shortlisted || 0) +
      (analyticsStats.interviews || 0) +
      (analyticsStats.offers || 0);
    destroyChart(canvasId);
    if (sum === 0) {
      canvas.style.display = 'none';
      let msg = canvas.parentElement.querySelector('.chart-empty-msg');
      if (!msg) {
        msg = document.createElement('p');
        msg.className = 'chart-empty-msg empty-state';
        canvas.parentElement.appendChild(msg);
      }
      msg.style.display = 'block';
      msg.textContent = 'No analytics data available';
      return;
    }
    const msg = canvas.parentElement.querySelector('.chart-empty-msg');
    if (msg) msg.style.display = 'none';
    canvas.style.display = 'block';
    drawFn();
  }

  function renderHomeCharts() {
    if (homeChartsDrawn) return;
    homeChartsDrawn = true;
    const P = '#1759d6';
    const T = '#0aada0';
    const grid = 'rgba(23,89,214,0.07)';
    const tick = {
      color: '#4a6070',
      font: { size: 10 },
      autoSkip: true,
      maxRotation: 0,
      minRotation: 0
    };

    chartOrEmpty('chart-home-activity', () => {
      const labels = ['Applied', 'Shortlisted', 'Interview', 'Offers'];
      const data = [
        analyticsStats.totalApplications || 0,
        analyticsStats.shortlisted || 0,
        analyticsStats.interviews || 0,
        analyticsStats.offers || 0
      ];
      new Chart(document.getElementById('chart-home-activity'), {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Your stats',
              data,
              backgroundColor: [P + 'cc', '#d97706cc', T + 'cc', '#16a34acc'],
              borderRadius: 5,
              borderSkipped: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: grid }, ticks: { ...tick } },
            y: { grid: { color: grid }, ticks: { ...tick, stepSize: 1 }, beginAtZero: true }
          }
        }
      });
    });

    chartOrEmpty('chart-home-pkg', () => {
      const total = analyticsStats.totalApplications || 1;
      const rest = Math.max(0, total - (analyticsStats.shortlisted || 0));
      new Chart(document.getElementById('chart-home-pkg'), {
        type: 'doughnut',
        data: {
          labels: ['Shortlisted', 'Other'],
          datasets: [
            {
              data: [analyticsStats.shortlisted || 0, rest],
              backgroundColor: [T + 'cc', P + '55'],
              borderWidth: 3,
              borderColor: '#fff',
              hoverOffset: 6
            }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '62%' }
      });
    });

    chartOrEmpty('chart-home-branch', () => {
      new Chart(document.getElementById('chart-home-branch'), {
        type: 'bar',
        data: {
          labels: ['Apps', 'Short', 'Int', 'Offers'],
          datasets: [
            {
              data: [
                analyticsStats.totalApplications || 0,
                analyticsStats.shortlisted || 0,
                analyticsStats.interviews || 0,
                analyticsStats.offers || 0
              ],
              backgroundColor: [P, T, '#d97706', '#16a34a'].map((c) => c + 'cc'),
              borderRadius: 5,
              borderSkipped: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: grid }, ticks: { ...tick, stepSize: 1 }, beginAtZero: true },
            y: { grid: { display: false }, ticks: { ...tick } }
          }
        }
      });
    });
  }

  function renderAnalyticsCharts() {
    const sum =
      (analyticsStats.totalApplications || 0) +
      (analyticsStats.shortlisted || 0) +
      (analyticsStats.interviews || 0) +
      (analyticsStats.offers || 0);

    ['chart-monthly', 'chart-branch', 'chart-salary', 'chart-companies', 'chart-trend', 'chart-roles'].forEach(
      destroyChart
    );

    const ids = ['chart-monthly', 'chart-branch', 'chart-salary', 'chart-companies', 'chart-trend', 'chart-roles'];
    ids.forEach((id) => {
      const canvas = document.getElementById(id);
      if (!canvas || !canvas.parentElement) return;
      if (sum === 0) {
        canvas.style.display = 'none';
        let msg = canvas.parentElement.querySelector('.chart-empty-msg');
        if (!msg) {
          msg = document.createElement('p');
          msg.className = 'chart-empty-msg empty-state';
          canvas.parentElement.appendChild(msg);
        }
        msg.style.display = 'block';
        msg.textContent = 'No analytics data available';
      } else {
        const msg = canvas.parentElement.querySelector('.chart-empty-msg');
        if (msg) msg.style.display = 'none';
        canvas.style.display = 'block';
      }
    });

    if (sum === 0) return;

    const P = '#1759d6';
    const T = '#0aada0';
    const grid = 'rgba(23,89,214,0.07)';
    const tick = {
      color: '#4a6070',
      font: { size: 10 },
      autoSkip: true,
      maxRotation: 0,
      minRotation: 0
    };
    const base = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: grid }, ticks: { ...tick } },
        y: { grid: { color: grid }, ticks: { ...tick, stepSize: 1 }, beginAtZero: true }
      }
    };

    new Chart(document.getElementById('chart-monthly'), {
      type: 'bar',
      data: {
        labels: ['Applied', 'Shortlisted', 'Interview', 'Offers'],
        datasets: [
          {
            data: [
              analyticsStats.totalApplications || 0,
              analyticsStats.shortlisted || 0,
              analyticsStats.interviews || 0,
              analyticsStats.offers || 0
            ],
            backgroundColor: [P + 'cc', '#d97706cc', T + 'cc', '#16a34acc'],
            borderRadius: 5,
            borderSkipped: false
          }
        ]
      },
      options: { ...base }
    });

    new Chart(document.getElementById('chart-branch'), {
      type: 'bar',
      data: {
        labels: ['You'],
        datasets: [
          {
            data: [analyticsStats.totalApplications || 0],
            backgroundColor: [P + 'cc'],
            borderRadius: 5,
            borderSkipped: false
          }
        ]
      },
      options: { ...base, indexAxis: 'y' }
    });

    new Chart(document.getElementById('chart-salary'), {
      type: 'bar',
      data: {
        labels: ['Pipeline'],
        datasets: [
          {
            data: [analyticsStats.shortlisted || 0],
            backgroundColor: [T + 'cc'],
            borderRadius: 6,
            borderSkipped: false
          }
        ]
      },
      options: { ...base }
    });

    new Chart(document.getElementById('chart-companies'), {
      type: 'doughnut',
      data: {
        labels: ['Applications', 'Offers'],
        datasets: [
          {
            data: [analyticsStats.totalApplications || 0, analyticsStats.offers || 0],
            backgroundColor: [P, T],
            borderWidth: 3,
            borderColor: '#fff',
            hoverOffset: 6
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '62%' }
    });

    new Chart(document.getElementById('chart-trend'), {
      type: 'line',
      data: {
        labels: ['Applied', 'Shortlisted', 'Interview', 'Offer'],
        datasets: [
          {
            data: [
              analyticsStats.totalApplications || 0,
              analyticsStats.shortlisted || 0,
              analyticsStats.interviews || 0,
              analyticsStats.offers || 0
            ],
            borderColor: P,
            backgroundColor: P + '18',
            fill: true,
            tension: 0.4,
            borderWidth: 2
          }
        ]
      },
      options: { ...base }
    });

    new Chart(document.getElementById('chart-roles'), {
      type: 'doughnut',
      data: {
        datasets: [
          {
            data: [
              analyticsStats.totalApplications || 0,
              analyticsStats.shortlisted || 0,
              analyticsStats.interviews || 0,
              analyticsStats.offers || 0
            ],
            backgroundColor: [P, T, '#d97706', '#16a34a'],
            borderWidth: 3,
            borderColor: '#fff',
            hoverOffset: 5
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '55%' }
    });
  }

  function jobCard(j) {
    const days = j.deadlineDate
      ? Math.max(0, Math.round((j.deadlineDate - new Date()) / 86400000))
      : null;
    const urgStyle = days !== null && days <= 3 ? 'color:var(--R);font-weight:700;' : '';
    const dlText = days === null ? j.dl : days > 0 ? `${days}d left` : 'Today!';
    return `<div class="job-card" onclick="window.__sdOpenModal('${j.id}')">
    <div class="jc-left">
      <div class="co-logo" style="width:42px;height:42px;background:${j.col}18;color:${j.col};">${j.logo}</div>
      <div class="jc-info">
        <div class="jc-title">${j.title}</div>
        <div class="jc-meta">
          <span class="pill ${j.intern ? 'upcoming' : 'applied'}" style="padding:1px 8px;font-size:10.5px;">${j.type}</span>
          &nbsp;·&nbsp;${j.company} · ${j.loc}
        </div>
        <div class="jc-skills">${
          j.skills.length
            ? `${j.skills
                .slice(0, 3)
                .map((sk) => `<span class="sk-chip">${sk}</span>`)
                .join('')}${j.skills.length > 3 ? `<span class="sk-chip">+${j.skills.length - 3}</span>` : ''}`
            : `<span class="sk-chip">—</span>`
        }</div>
      </div>
    </div>
    <div class="jc-right">
      <div class="jc-ctc">${j.ctc}</div>
      <div class="jc-dl" style="${urgStyle}">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="vertical-align:middle;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        ${dlText}
      </div>
      <div style="display:flex;gap:6px;margin-top:6px;align-items:center;">
        <button class="icon-btn" style="width:28px;height:28px;border:1px solid var(--brs);" onclick="event.stopPropagation();window.__sdToggleSave('${j.id}')" title="${j.saved ? 'Unsave' : 'Save'}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="${j.saved ? 'var(--P)' : 'none'}" stroke="${j.saved ? 'var(--P)' : 'var(--txmu)'}" stroke-width="2" stroke-linecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        </button>
        ${
          j.applied
            ? `<span class="pill short" style="font-size:11.5px;">Applied ✓</span>`
            : `<button class="btn sm" onclick="event.stopPropagation();window.__sdQuickApply('${j.id}',this)">Apply</button>`
        }
      </div>
    </div>
  </div>`;
  }

  function renderList(list, containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!list.length) {
      showEmpty(el, 'No jobs posted');
      return;
    }
    el.innerHTML = list.map(jobCard).join('');
  }

  function renderAllJobTabs() {
    renderList(jobs, 'jobs-list-container');
    const reco = jobs.filter((j) => j.reco);
    const intern = jobs.filter((j) => j.intern);
    if (!reco.length) {
      const el = document.getElementById('reco-list-container');
      if (el) showEmpty(el, 'No data available');
    } else renderList(reco, 'reco-list-container');
    if (!intern.length) {
      const el = document.getElementById('intern-list-container');
      if (el) showEmpty(el, 'No data available');
    } else renderList(intern, 'intern-list-container');

    const sv = jobs.filter((j) => j.saved);
    document.getElementById('tc-saved').textContent = String(sv.length);
    const ee = document.getElementById('saved-empty');
    if (!sv.length) {
      if (ee) ee.style.display = 'block';
      const el = document.getElementById('saved-list-container');
      if (el) showEmpty(el, 'No saved jobs yet');
    } else {
      if (ee) ee.style.display = 'none';
      renderList(sv, 'saved-list-container');
    }

    ['all', 'reco', 'intern'].forEach((k, i) => {
      const counts = [jobs.length, reco.length, intern.length];
      const t = document.getElementById('tc-' + k);
      if (t) t.textContent = String(counts[i]);
    });
    const jc = document.getElementById('job-count');
    if (jc) jc.textContent = `Showing ${jobs.length} jobs`;
  }

  function filterJobs() {
    const q = (document.getElementById('job-search') || { value: '' }).value.toLowerCase();
    const loc = (document.getElementById('filter-loc') || { value: '' }).value;
    const type = (document.getElementById('filter-type') || { value: '' }).value;
    const ctcMin = parseFloat((document.getElementById('filter-ctc') || { value: '' }).value) || 0;
    const branch = (document.getElementById('filter-branch') || { value: '' }).value;
    const f = jobs.filter((j) => {
      const mQ = !q || (j.title + j.company + j.skills.join(' ')).toLowerCase().includes(q);
      return mQ && (!loc || (j.loc && j.loc.includes(loc))) && (!type || j.type === type) && j.ctcVal >= ctcMin && (!branch || (j.branch && j.branch.includes(branch)));
    });
    const el = document.getElementById('jobs-list-container');
    if (!el) return;
    if (!f.length) showEmpty(el, 'No jobs found matching your filters.');
    else el.innerHTML = f.map(jobCard).join('');
    const jc = document.getElementById('job-count');
    if (jc) jc.textContent = `Showing ${f.length} jobs`;
  }

  window.__sdOpenModal = function (id) {
    const j = jobs.find((x) => x.id === id);
    if (!j) return;
    currentJob = j;
    document.getElementById('m-title').textContent = j.title;
    document.getElementById('m-company').textContent = `${j.company} · ${j.loc}`;
    document.getElementById('m-ctc').textContent = j.ctc;
    document.getElementById('m-type').textContent = j.type;
    document.getElementById('m-loc').textContent = j.loc;
    document.getElementById('m-dl').textContent = j.deadlineDate ? `Closes ${j.dl}` : j.dl;
    document.getElementById('m-cgpa').textContent = j.cgpa;
    document.getElementById('m-branch').textContent = j.branch;
    document.getElementById('m-desc').textContent = j.desc;
    document.getElementById('m-apps').textContent = String(j.applicantsCount ?? 0);
    document.getElementById('m-short').textContent = '—';
    document.getElementById('m-hired').textContent = '—';
    const logo = document.getElementById('m-logo');
    logo.textContent = j.logo;
    logo.style.background = j.col + '18';
    logo.style.color = j.col;
    document.getElementById('m-badges').innerHTML =
      `<span class="pill ${j.intern ? 'upcoming' : 'applied'}">${j.type}</span>` +
      `<span class="pill review">${j.loc}</span>`;
    document.getElementById('m-skills').innerHTML = j.skills.map((s) => `<span class="req-tag">${s}</span>`).join('');
    const stages = ['Applied', 'Review', 'Shortlist', 'Interview', 'Offer'];
    document.getElementById('m-pipeline').innerHTML = stages
      .map(
        (s, i) => `
    <div style="display:flex;align-items:center;">
      <div style="text-align:center;padding:0 3px;">
        <div style="width:28px;height:28px;border-radius:50%;background:${i === 0 ? 'var(--G)' : 'var(--bg)'};border:2px solid ${i === 0 ? 'var(--G)' : 'var(--br)'};display:grid;place-items:center;margin:0 auto 3px;font-size:10px;font-weight:700;color:${i === 0 ? '#fff' : 'var(--txmu)'};">${i + 1}</div>
        <div style="font-size:9.5px;color:var(--txmu);white-space:nowrap;">${s}</div>
      </div>
      ${i < stages.length - 1 ? `<div style="flex:1;height:2px;background:var(--brs);min-width:10px;"></div>` : ''}
    </div>`
      )
      .join('');
    const btn = document.getElementById('m-apply-btn');
    const note = document.getElementById('m-applied-note');
    if (j.applied) {
      btn.textContent = 'Applied ✓';
      btn.disabled = true;
      btn.style.opacity = '.6';
      note.textContent = 'Application submitted';
    } else {
      btn.innerHTML = 'Apply Now →';
      btn.disabled = false;
      btn.style.opacity = '1';
      note.textContent = '';
    }
    const sb = document.getElementById('m-save-btn');
    sb.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--P)" stroke-width="2" stroke-linecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> ${j.saved ? 'Saved' : 'Save'}`;
    document.getElementById('job-modal').classList.add('on');
  };

  window.__sdToggleSave = function (id) {
    const j = jobs.find((x) => x.id === id);
    if (!j) return;
    if (savedJobIds.has(id)) savedJobIds.delete(id);
    else savedJobIds.add(id);
    saveSavedSet(savedJobIds);
    j.saved = savedJobIds.has(id);
    renderAllJobTabs();
    filterJobs();
  };

  window.__sdQuickApply = async function (id, btn) {
    const j = jobs.find((x) => x.id === id);
    if (!j || j.applied) return;
    try {
      const res = await fetch(`${API}/api/applications/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: id, studentId: studentId() })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Could not apply');
        return;
      }
      j.applied = true;
      if (btn) btn.outerHTML = `<span class="pill short" style="font-size:11.5px;">Applied ✓</span>`;
      await refreshApplicationsOnly();
      await refreshAnalyticsOnly();
      updateStatsUI();
      redrawHomeCharts();
      // If the user is currently on Analytics, keep those charts in sync too.
      const pgAnalytics = document.getElementById('pg-analytics');
      if (pgAnalytics && pgAnalytics.classList.contains('on')) {
        renderAnalyticsPageStats();
        renderAnalyticsCharts();
      }
    } catch {
      alert('Network error');
    }
  };

  async function refreshApplicationsOnly() {
    const res = await fetch(`${API}/api/applications/student/${studentId()}`);
    const data = await res.json();
    applications = (data.applications || []).map(mapApplication);
    const appliedIds = new Set(applications.map((a) => a.jobId).filter(Boolean));
    jobs.forEach((j) => {
      j.applied = appliedIds.has(j.id);
    });
    renderApplications();
    renderHomeApps();
  }

  async function refreshAnalyticsOnly() {
    const sid = studentId();
    if (!sid) return;
    try {
      const res = await fetch(`${API}/api/students/analytics/${sid}`);
      const data = await res.json();
      if (data.success && data.stats) analyticsStats = data.stats;
    } catch (e) {
      // Keep UI usable even if analytics refresh fails.
      console.error(e);
    }
  }

  function redrawHomeCharts() {
    // Home charts are currently drawn once; after analytics changes, we must destroy and redraw.
    ['chart-home-activity', 'chart-home-pkg', 'chart-home-branch'].forEach(destroyChart);
    homeChartsDrawn = false;
    renderHomeCharts();
  }

  async function refreshJobsOnly() {
    try {
      const skills = studentProfile?.skills || [];
      const jobsRes = await fetch(`${API}/api/jobs`);
      const jobsData = await jobsRes.json();
      const nextJobs = (jobsData.jobs || []).map((j) => mapApiJob(j, skills));

      const appliedIds = new Set((applications || []).map((a) => a.jobId).filter(Boolean));
      nextJobs.forEach((j) => {
        j.applied = appliedIds.has(j.id);
        j.saved = savedJobIds.has(j.id);
      });

      jobs = nextJobs;
      renderAllJobTabs();
      filterJobs();
      renderHomeJobs();
      updateStatsUI();
    } catch (e) {
      console.error(e);
    }
  }

  function renderHomeJobs() {
    const el = document.getElementById('home-reco-jobs');
    if (!el) return;
    const slice = jobs.filter((j) => j.reco).slice(0, 4);
    if (!slice.length) {
      const subset = jobs.slice(0, 4);
      if (!subset.length) {
        showEmpty(el, 'No jobs available');
        return;
      }
      el.innerHTML = subset
        .map(
          (j) => `
    <div class="app-row" onclick="window.__sdOpenModal('${j.id}')" style="cursor:pointer;">
      <div class="co-logo" style="width:36px;height:36px;border-radius:9px;background:${j.col}18;color:${j.col};font-size:10px;font-weight:800;">${j.logo}</div>
      <div class="app-info">
        <div class="app-title">${j.title}</div>
        <div class="app-meta">${j.company} · ${j.loc}</div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-size:13px;font-weight:700;color:var(--G);">${j.ctc}</div>
        <div style="font-size:11px;color:var(--txmu);">${j.dl}</div>
      </div>
    </div>`
        )
        .join('');
      return;
    }
    el.innerHTML = slice
      .map(
        (j) => `
    <div class="app-row" onclick="window.__sdOpenModal('${j.id}')" style="cursor:pointer;">
      <div class="co-logo" style="width:36px;height:36px;border-radius:9px;background:${j.col}18;color:${j.col};font-size:10px;font-weight:800;">${j.logo}</div>
      <div class="app-info">
        <div class="app-title">${j.title}</div>
        <div class="app-meta">${j.company} · ${j.loc}</div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-size:13px;font-weight:700;color:var(--G);">${j.ctc}</div>
        <div style="font-size:11px;color:var(--txmu);">${j.dl}</div>
      </div>
    </div>`
      )
      .join('');
  }

  function renderHomeApps() {
    const el = document.getElementById('home-apps-tracker');
    if (!el) return;
    if (!applications.length) {
      showEmpty(el, 'No applications yet');
      return;
    }
    const stages = ['Applied', 'Reviewed', 'Shortlisted', 'Interview', 'Offer'];
    el.innerHTML = applications
      .slice(0, 5)
      .map(
        (a) => `
    <div class="app-row">
      <div class="co-logo" style="width:36px;height:36px;border-radius:9px;background:var(--PL);color:var(--P);font-size:9px;font-weight:800;">${a.company.slice(0, 3).toUpperCase()}</div>
      <div class="app-info">
        <div class="app-title">${a.title} — ${a.company}</div>
        <div class="app-meta">${a.type} · ${a.ctc} · Applied ${a.date}</div>
        <div class="stage-bar">${stages
          .map(
            (_, i) =>
              `<div class="stage-seg" style="background:${a.stage > i ? 'var(--P)' : a.stage === i ? 'var(--A)' : 'var(--brs)'};"></div>`
          )
          .join('')}</div>
      </div>
      <span class="pill ${a.statusClass}">${a.statusLabel}</span>
    </div>`
      )
      .join('');
  }

  function renderDeadlines() {
    const el = document.getElementById('home-deadlines');
    if (!el) return;
    if (!drives.length) {
      showEmpty(el, 'No drives available');
      return;
    }
    el.innerHTML = drives
      .slice(0, 6)
      .map((d) => {
        const dt = new Date(d.date);
        const label = Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        return `
    <div class="dl-row">
      <div class="dl-dot" style="background:var(--T);"></div>
      <div class="dl-text">${d.companyName} — ${d.roles || ''}</div>
      <div class="dl-date" style="color:var(--txmu);">${label}</div>
    </div>`;
      })
      .join('');
  }

  function renderApplications() {
    const stages = ['Applied', 'Reviewed', 'Shortlisted', 'Interview', 'Offer'];
    const render = (list, id) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (!list.length) {
        showEmpty(el, 'No applications yet');
        return;
      }
      el.innerHTML = list
        .map(
          (a) => `
      <div class="app-row">
        <div class="co-logo" style="width:40px;height:40px;border-radius:10px;background:var(--PL);color:var(--P);font-size:9px;font-weight:800;">${a.company.slice(0, 3).toUpperCase()}</div>
        <div class="app-info">
          <div class="app-title">${a.title} — ${a.company}</div>
          <div class="app-meta">${a.type} · ${a.ctc} · Applied ${a.date}</div>
          <div class="stage-bar" style="margin-top:7px;">${stages
            .map(
              (_, i) =>
                `<div class="stage-seg" style="background:${a.stage > i ? 'var(--P)' : a.stage === i ? 'var(--A)' : 'var(--brs)'};"></div>`
            )
            .join('')}</div>
        </div>
        <span class="pill ${a.statusClass}">${a.statusLabel}</span>
      </div>`
        )
        .join('');
    };
    render(applications, 'apps-all-list');
    render(
      applications.filter((a) => a.statusClass !== 'rejected'),
      'apps-active-list'
    );
    render(
      applications.filter((a) => a.statusClass === 'rejected'),
      'apps-closed-list'
    );
  }

  function renderDrives() {
    const el = document.getElementById('drives-list');
    if (!el) return;
    if (!drives.length) {
      showEmpty(el, 'No drives available');
      return;
    }
    el.innerHTML = drives
      .map((d) => {
        const dt = new Date(d.date);
        const day = Number.isNaN(dt.getTime()) ? '—' : String(dt.getDate());
        const month = Number.isNaN(dt.getTime()) ? '' : dt.toLocaleDateString(undefined, { month: 'short' });
        return `
    <div class="drive-row">
      <div class="dr-date"><div class="dr-dd">${day}</div><div class="dr-dm">${month}</div></div>
      <div class="dr-info"><div class="dr-name">${d.companyName}</div><div class="dr-meta">${d.roles || ''} · ${d.eligibility || ''}</div></div>
      <span class="pill registered">Approved</span>
    </div>`;
      })
      .join('');
  }

  function renderTests() {
    const el = document.getElementById('tests-list');
    if (el) showEmpty(el, 'No data available');
    const ct = document.getElementById('completed-tests');
    if (ct) showEmpty(ct, 'No data available');
    const titleEl = document.getElementById('tests-banner-title');
    const subEl = document.getElementById('tests-banner-sub');
    if (titleEl) titleEl.textContent = 'Scheduled tests';
    if (subEl) subEl.textContent = 'No upcoming tests';
  }

  function renderCompanyPrep() {
    const el = document.getElementById('company-prep-list');
    if (el) showEmpty(el, 'No data available');
  }

  function renderNotifs() {
    const panel = document.getElementById('notif-list');
    if (panel) showEmpty(panel, 'No notifications');
    const dot = document.getElementById('notif-dot');
    if (dot) dot.style.display = 'none';
  }

  const TITLES = {
    home: 'Home',
    jobs: 'Job Listings',
    applications: 'My Applications',
    drives: 'Campus Drives',
    tests: 'Tests & Exams',
    resume: 'Resume Builder',
    resources: 'Prep Resources',
    analytics: 'Placement Stats',
    profile: 'My Profile',
    settings: 'Settings'
  };

  window.go = function (id, btn) {
    const pageMap = { apps: 'applications' };
    const page = pageMap[id] || id;
    document.querySelectorAll('.page').forEach((p) => p.classList.remove('on'));
    document.querySelectorAll('.nl').forEach((n) => n.classList.remove('on'));
    const pg = document.getElementById('pg-' + page);
    if (pg) pg.classList.add('on');
    if (btn && btn.classList && btn.classList.contains('nl')) btn.classList.add('on');
    const tb = document.getElementById('tb-title');
    if (tb) tb.textContent = TITLES[page] || page;
    const np = document.getElementById('notif-panel');
    if (np) np.classList.remove('on');
    if (page === 'analytics') {
      analyticsDrawn = false;
      setTimeout(() => {
        renderAnalyticsPageStats();
        renderAnalyticsCharts();
        analyticsDrawn = true;
      }, 80);
    }
  };

  function renderAnalyticsPageStats() {
    const s = analyticsStats;
    const cards = document.querySelectorAll('#pg-analytics .stats-row .stat-val');
    if (cards[0]) cards[0].textContent = String(s.totalApplications || 0);
    if (cards[1]) cards[1].textContent = String(s.shortlisted || 0);
    if (cards[2]) cards[2].textContent = String(s.interviews || 0);
    if (cards[3]) cards[3].textContent = String(s.offers || 0);
  }

  window.switchTab = function (group, tab, btn) {
    const pgId =
      'pg-' + (group === 'jobs' ? 'jobs' : group === 'apps' ? 'applications' : 'drives');
    document.querySelectorAll('#' + pgId + ' .tab-panel').forEach((p) => p.classList.remove('on'));
    const tabs = btn && btn.closest ? btn.closest('.tabs') : null;
    if (tabs) tabs.querySelectorAll('.tab').forEach((t) => t.classList.remove('on'));
    const prefix = group === 'jobs' ? 'jobs-' : group === 'apps' ? 'apps-' : '';
    const panelId = prefix + tab;
    const panel = document.getElementById(panelId);
    if (panel) panel.classList.add('on');
    if (btn) btn.classList.add('on');
  };

  window.globalSearch = function (v) {
    if (document.getElementById('pg-jobs') && document.getElementById('pg-jobs').classList.contains('on')) filterJobs();
  };

  window.closeModal = function (e) {
    if (e.target === document.getElementById('job-modal')) document.getElementById('job-modal').classList.remove('on');
  };

  window.applyFromModal = async function () {
    if (!currentJob || currentJob.applied) return;
    await window.__sdQuickApply(currentJob.id, document.getElementById('m-apply-btn'));
    const note = document.getElementById('m-applied-note');
    if (note && currentJob.applied) note.textContent = 'Application submitted!';
  };

  window.saveJob = function () {
    if (!currentJob) return;
    window.__sdToggleSave(currentJob.id);
    const sb = document.getElementById('m-save-btn');
    sb.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--P)" stroke-width="2" stroke-linecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> ${currentJob.saved ? 'Saved' : 'Save'}`;
  };

  window.toggleNotif = function () {
    document.getElementById('notif-panel').classList.toggle('on');
  };

  window.toggleSidebar = function () {
    document.getElementById('sidebar').classList.toggle('col');
    document.getElementById('main-content').classList.toggle('exp');
  };

  window.toggleEdit = function () {
    const v = document.getElementById('profile-view');
    const e = document.getElementById('profile-edit');
    if (!v || !e) return;
    const editing = e.style.display !== 'none';
    v.style.display = editing ? 'block' : 'none';
    e.style.display = editing ? 'none' : 'block';
    if (!editing && e.style.display === 'block') {
      e.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  function collectProfileSkillsFromEdit() {
    const wrap = document.getElementById('p-skills-wrap');
    if (wrap) {
      return Array.from(wrap.querySelectorAll('.skill-tag'))
        .map((el) => {
          const n = el.childNodes[0];
          return n && n.textContent ? String(n.textContent).trim() : '';
        })
        .filter(Boolean);
    }
    return (document.getElementById('edit-skills')?.value || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  }

  window.saveProfile = async function () {
    const body = {
      fullName: document.getElementById('edit-name')?.value,
      phone: document.getElementById('edit-phone')?.value,
      rollNumber: document.getElementById('edit-roll')?.value,
      cgpa: parseFloat(document.getElementById('edit-cgpa')?.value) || undefined,
      branch: document.getElementById('edit-branch')?.value,
      year: document.getElementById('edit-year')?.value,
      linkedin: document.getElementById('edit-linkedin')?.value,
      github: document.getElementById('edit-github')?.value,
      preferredLocation: document.getElementById('edit-loc')?.value,
      skills: collectProfileSkillsFromEdit()
    };
    try {
      const res = await fetch(`${API}/api/students/profile/${studentId()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Update failed');
        return;
      }
      studentProfile = data.student;
      syncSessionFromProfile(studentProfile);
      applyProfileToDOM(studentProfile);
      window.toggleEdit();
      await loadData();
      renderAllJobTabs();
      filterJobs();
      renderHomeJobs();
    } catch {
      alert('Network error');
    }
  };

  window.logout = function () {
    if (confirm('Log out of CampusPlace?')) {
      sessionStorage.clear();
      window.location.href = 'Login.html';
    }
  };

  function readDarkPreference() {
    const cp = localStorage.getItem('cp_dark_mode');
    if (cp === 'true') return true;
    if (cp === 'false') return false;
    return localStorage.getItem('theme') === 'dark';
  }

  function persistDarkPreference(isDark) {
    localStorage.setItem('cp_dark_mode', isDark ? 'true' : 'false');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  function syncStudentThemeIcon(isDark) {
    const icon = document.getElementById('theme-icon');
    if (!icon) return;
    if (isDark) {
      icon.innerHTML =
        '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"></line>';
    } else {
      icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    }
  }

  /** Top bar: flips settings checkbox then applies; Settings: uses checkbox state (same as Company dashboard). */
  window.toggleDarkMode = function (el) {
    if (!el) {
      el = document.getElementById('dark-mode-toggle');
      if (el) el.checked = !el.checked;
    }
    if (el) {
      document.body.classList.toggle('dark', el.checked);
    } else {
      document.body.classList.toggle('dark');
    }
    const isDark = document.body.classList.contains('dark');
    persistDarkPreference(isDark);
    syncStudentThemeIcon(isDark);
  };

  window.initDarkMode = function () {
    const darkPref = readDarkPreference();
    const toggle = document.getElementById('dark-mode-toggle');
    if (toggle) toggle.checked = darkPref;
    document.body.classList.toggle('dark', darkPref);
    syncStudentThemeIcon(darkPref);
  };

  window.renderAnalytics = function () {
    renderAnalyticsPageStats();
    renderAnalyticsCharts();
  };

  window.rbGo = function (step) {
    for (let i = 0; i < 5; i++) {
      const s = document.getElementById('rs' + i);
      const p = document.getElementById('rbp' + i);
      if (s) {
        s.classList.toggle('on', i === step);
        s.classList.toggle('done', i < step);
      }
      if (p) p.classList.toggle('on', i === step);
    }
  };

  window.addSkill = function (e, wrapId, inputId) {
    if (e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();
    const inp = document.getElementById(inputId);
    const val = inp.value.trim().replace(',', '');
    if (!val) return;
    const span = document.createElement('span');
    span.className = 'skill-tag';
    span.innerHTML = `${val}<button onclick="this.parentElement.remove()">×</button>`;
    document.getElementById(wrapId).insertBefore(span, inp);
    inp.value = '';
  };

  window.addEventListener('DOMContentLoaded', async () => {
    if (
      sessionStorage.getItem('isLoggedIn') !== 'true' ||
      sessionStorage.getItem('userRole') !== 'student' ||
      !sessionStorage.getItem('studentId')
    ) {
      window.location.href = 'Login.html';
      return;
    }

    initDarkMode();

    clearStudentProfileBindings();

    try {
      await fetchProfile();
      await loadData();
    } catch (e) {
      console.error(e);
      alert('Could not load dashboard data. Is the backend running?');
    }

    updateStatsUI();
    renderNotifs();
    renderHomeJobs();
    renderHomeApps();
    renderDeadlines();
    renderAllJobTabs();
    renderApplications();
    renderDrives();
    renderTests();
    renderCompanyPrep();

    const h = new Date().getHours();
    const greet = document.getElementById('greet-msg');
    const rawName = (studentProfile?.fullName || '').trim();
    const first = rawName.split(/\s+/).filter(Boolean)[0] || '';
    const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    if (greet) {
      greet.innerHTML = first
        ? `${part}, ${first} \u{1F44B}`
        : `${part} \u{1F44B}`;
    }

    setTimeout(renderHomeCharts, 120);

    // Keep job visibility in sync after TPO approvals without requiring manual reload.
    setInterval(() => {
      if (document.visibilityState === 'visible') refreshJobsOnly();
    }, 25000);

    document.addEventListener('click', (e) => {
      const panel = document.getElementById('notif-panel');
      if (
        panel &&
        panel.classList.contains('on') &&
        !panel.contains(e.target) &&
        !e.target.closest('[onclick*="toggleNotif"]')
      )
        panel.classList.remove('on');
      const modal = document.getElementById('job-modal');
      if (modal && modal.classList.contains('on') && e.target === modal) modal.classList.remove('on');
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
  });
})();
