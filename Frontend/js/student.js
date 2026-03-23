// ─── AUTH CHECK ───
if (sessionStorage.getItem('isLoggedIn') !== 'true' || sessionStorage.getItem('userRole') !== 'student') {
  window.location.href = 'Login.html';
}

// ─── JOB DATA (loaded from API) ───
    const API_JOBS = 'http://localhost:5001/api/jobs';
    let JOBS = [];

    let appliedJobs = new Set();
    let currentModalJobId = null;

    // ─── INIT ───
    window.addEventListener('DOMContentLoaded', async () => {
      const sid = sessionStorage.getItem('studentId');
      if (sid) {
        try {
          const res = await fetch(API_JOBS);
          const data = await res.json();
          const list = (data.jobs || []).map((j) => ({
            id: String(j._id),
            logo: 'briefcase',
            logoColor: 'var(--blue)',
            title: j.title || '',
            company: j.companyName || '',
            loc: [j.location, j.workMode].filter(Boolean).join(' · ') || '—',
            type: j.jobType || 'Full Time',
            ctc: j.salary || '—',
            dl: j.deadline ? new Date(j.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—',
            cgpa: String(j.minCgpa != null ? j.minCgpa : '—'),
            branch: (j.requirements || []).join(', ') || '—',
            desc: j.description || '',
            skills: j.requirements || [],
            reco: false,
            intern: j.jobType === 'Internship'
          }));
          JOBS = list;
        } catch (e) {
          console.error(e);
          JOBS = [];
        }
      }

      const name = sessionStorage.getItem('studentName') || '';
      const email = sessionStorage.getItem('studentEmail') || '';
      const dash = '—';
      const first = name.split(' ').filter(Boolean)[0] || '';
      const initials = name
        ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : dash;

      ['sb-av', 'home-av', 'pg-av', 'tb-av'].forEach(id => { const e = document.getElementById(id); if (e) e.textContent = initials; });
      ['sb-name', 'home-pw-name', 'profile-name', 'pv-fname'].forEach(id => { const e = document.getElementById(id); if (e) e.textContent = name || dash; });
      ['profile-email', 'set-email'].forEach(id => { const e = document.getElementById(id); if (e) e.textContent = email || dash; });
      
      // Academic & Personal
      const branch = sessionStorage.getItem('studentBranch') || '';
      const year = sessionStorage.getItem('studentYear') || '';
      const cgpa = sessionStorage.getItem('studentCGPA') || '';
      const roll = sessionStorage.getItem('studentRoll') || '';
      const phone = sessionStorage.getItem('studentPhone') || '';
      const linkedin = sessionStorage.getItem('studentLinkedin') || '';
      const github = sessionStorage.getItem('studentGithub') || '';
      const location = sessionStorage.getItem('studentLocation') || '';
      const skillsArr = JSON.parse(sessionStorage.getItem('studentSkills') || '[]');

      const brYrEl = document.getElementById('pg-branch-year');
      if (brYrEl) brYrEl.innerHTML = `<i data-lucide="graduation-cap"></i> ${branch} · ${year}`;
      
      const cgpaTag = document.getElementById('pg-cgpa-tag');
      if (cgpaTag) cgpaTag.textContent = `CGPA ${cgpa}`;

      const rollTag = document.getElementById('pg-roll-tag');
      if (rollTag) rollTag.textContent = `Roll No: ${roll}`;

      const pvRoll = document.getElementById('pv-roll');
      if (pvRoll) pvRoll.textContent = roll;

      const pvBranch = document.getElementById('pv-branch');
      if (pvBranch) pvBranch.textContent = branch;

      const pvYear = document.getElementById('pv-year');
      if (pvYear) pvYear.textContent = year;

      const pvCgpa = document.getElementById('pv-cgpa');
      if (pvCgpa) pvCgpa.textContent = `${cgpa} / 10`;

      const pvPhone = document.getElementById('pv-phone');
      if (pvPhone) pvPhone.textContent = phone;

      const pvLinkedin = document.getElementById('pv-linkedin');
      if (pvLinkedin) pvLinkedin.textContent = linkedin || 'Not added';

      const pvGithub = document.getElementById('pv-github');
      if (pvGithub) pvGithub.textContent = github || 'Not added';

      const pvLoc = document.getElementById('pv-loc');
      if (pvLoc) pvLoc.textContent = location || 'Not added';

      const skillWrap = document.getElementById('pv-skills');
      if (skillWrap && skillsArr.length > 0) {
        skillWrap.innerHTML = '';
        skillsArr.forEach(s => {
          const span = document.createElement('span');
          span.className = 'skill-tag';
          span.style.cursor = 'default';
          span.textContent = s;
          skillWrap.appendChild(span);
        });
      }

      // Populate Edit Fields
      const editName = document.getElementById('edit-name');
      if (editName) editName.value = name;
      const editPhone = document.getElementById('edit-phone');
      if (editPhone) editPhone.value = phone;
      const editRoll = document.getElementById('edit-roll');
      if (editRoll) editRoll.value = roll;
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
      const editSkills = document.getElementById('edit-skills');
      if (editSkills) editSkills.value = skillsArr.join(', ');

      const tbNameEl = document.getElementById('tb-name');
      if (tbNameEl) tbNameEl.textContent = first;

      const greetEl = document.getElementById('greet-msg');
      if (greetEl) {
        const h = new Date().getHours();
        const g = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
        greetEl.innerHTML = `Good ${g}, ${first} <i data-lucide="smile" style="width:18px;height:18px;vertical-align:text-bottom;"></i>`;
      }

      renderJobsAll();
      renderRecoJobs();
      renderInternships();
      renderHomeReco();
      
      lucide.createIcons();
    });

    // ─── NAV ───
    const TITLES = { home: 'Home', jobs: 'Job Listings', applications: 'My Applications', drives: 'Campus Drives', tests: 'Tests & Exams', resume: 'Resume Builder', resources: 'Prep Resources', profile: 'My Profile', settings: 'Settings' };
    function go(id, btn) {
      // If resume is clicked, open the standalone resume builder page
      //this is extra code added by me
      if (id === 'resume') {
      window.location.href = 'resume-builder.html'; // same pages folder
      return;
     }
      document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
      document.querySelectorAll('.nl').forEach(n => n.classList.remove('on'));
      document.getElementById('pg-' + id).classList.add('on');
      if (btn) btn.classList.add('on');
      document.getElementById('tb-title').textContent = TITLES[id] || id;
      document.getElementById('notif-panel').classList.remove('on');
    }

    // ─── TABS ───
    function switchTab(group, id, btn) {
      const panels = { jobs: ['all', 'reco', 'intern'], apps: ['all', 'active', 'closed'] };
      panels[group].forEach(t => {
        document.getElementById(group === 'jobs' ? `jobs-${t}` : `apps-${t}`).classList.remove('on');
      });
      btn.closest('.tabs').querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
      document.getElementById(group === 'jobs' ? `jobs-${id}` : `apps-${id}`).classList.add('on');
      btn.classList.add('on');
    }

    // ─── JOB RENDERING ───
    function jobHTML(j, showApply = true) {
      const applied = appliedJobs.has(j.id);
      return `<div class="jr">
    <div class="co"><i data-lucide="${j.logo}" style="color:${j.logoColor || 'var(--blue)'};"></i></div>
    <div class="jm">
      <div class="jt">${j.title}</div>
      <div class="ji">${j.company} · ${j.loc} · ${j.type} · Min CGPA: ${j.cgpa}</div>
    </div>
    <div class="jr-right">
      <span class="ctc">${j.ctc}</span>
      <span class="dl">Closes ${j.dl}</span>
      <button class="btn sec" onclick="openModal(${j.id})">Details</button>
      ${showApply ? `<button class="btn${applied ? ' done' : ''}" id="apply-btn-${j.id}" onclick="applyJob(${j.id},this)">${applied ? '✅ Applied' : 'Apply'}</button>` : ''}
    </div>
  </div>`;
    }
    function renderJobsAll() { document.getElementById('jobs-list').innerHTML = JOBS.map(j => jobHTML(j)).join(''); }
    function renderRecoJobs() { document.getElementById('reco-list').innerHTML = JOBS.filter(j => j.reco).map(j => jobHTML(j)).join(''); }
    function renderInternships() { document.getElementById('intern-list').innerHTML = JOBS.filter(j => j.intern).map(j => jobHTML(j)).join(''); }
    function renderHomeReco() { document.getElementById('home-reco-jobs').innerHTML = JOBS.filter(j => j.reco).slice(0, 3).map(j => jobHTML(j)).join(''); }

    // ─── FILTER ───
    function filterJobs() {
      const q = (document.getElementById('job-search').value || '').toLowerCase();
      const skill = document.getElementById('filter-skill').value;
      const loc = document.getElementById('filter-loc').value;
      const type = document.getElementById('filter-type').value;
      const filtered = JOBS.filter(j => {
        const matchQ = !q || (j.title + j.company + j.loc).toLowerCase().includes(q);
        const matchS = !skill || j.skills.some(s => s.toLowerCase() === skill.toLowerCase());
        const matchL = !loc || j.loc.toLowerCase().includes(loc.toLowerCase());
        const matchT = !type || j.type === type;
        return matchQ && matchS && matchL && matchT;
      });
      document.getElementById('jobs-list').innerHTML = filtered.length ? filtered.map(j => jobHTML(j)).join('') : '<div style="padding:20px;text-align:center;color:var(--sub);font-size:13px;">No jobs found matching your filters.</div>';
    }

    // ─── MODAL ───
    function openModal(id) {
      const j = JOBS.find(x => x.id === id);
      currentModalJobId = id;
      document.getElementById('m-logo').textContent = j.logo;
      document.getElementById('m-title').textContent = j.title;
      document.getElementById('m-company').textContent = `${j.company} · ${j.loc}`;
      document.getElementById('m-ctc').textContent = j.ctc;
      document.getElementById('m-type').textContent = j.type;
      document.getElementById('m-loc').textContent = j.loc;
      document.getElementById('m-dl').textContent = j.dl;
      document.getElementById('m-cgpa').textContent = `${j.cgpa} and above`;
      document.getElementById('m-branch').textContent = j.branch;
      document.getElementById('m-desc').textContent = j.desc;
      document.getElementById('m-skills').innerHTML = j.skills.map(s => `<span class="req-tag">${s}</span>`).join('');
      const applied = appliedJobs.has(id);
      document.getElementById('m-apply-btn').textContent = applied ? '✅ Applied' : 'Apply Now';
      document.getElementById('m-apply-btn').className = 'btn lg' + (applied ? ' done' : '');
      document.getElementById('m-applied-note').textContent = applied ? 'You have already applied for this role.' : '';
      document.getElementById('job-modal').classList.add('on');
    }
    function applyFromModal() {
      if (!currentModalJobId || appliedJobs.has(currentModalJobId)) return;
      applyJob(currentModalJobId, document.getElementById('m-apply-btn'));
      document.getElementById('m-applied-note').textContent = 'You have already applied for this role.';
    }
    function closeModal(e) { if (e.target === document.getElementById('job-modal')) document.getElementById('job-modal').classList.remove('on'); }

    async function applyJob(id, btn) {
      if (appliedJobs.has(id)) return;
      const sid = sessionStorage.getItem('studentId');
      const job = JOBS.find((x) => String(x.id) === String(id));
      if (!sid || !job) return;
      try {
        const res = await fetch('http://localhost:5001/api/applications/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: sid, jobId: id })
        });
        const data = await res.json();
        if (!data.success) {
          alert(data.message || 'Could not apply');
          return;
        }
      } catch (e) {
        alert('Network error');
        return;
      }
      appliedJobs.add(id);
      document.querySelectorAll(`#apply-btn-${id}`).forEach(b => { b.classList.add('done'); b.innerHTML = '<i data-lucide="check-circle" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> Applied'; });
      if (btn) { btn.classList.add('done'); btn.innerHTML = '<i data-lucide="check-circle" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> Applied'; }
      lucide.createIcons();
    }

    // ─── NOTIF PANEL ───
    function toggleNotif() {
      document.getElementById('notif-panel').classList.toggle('on');
    }
    document.addEventListener('click', e => {
      const panel = document.getElementById('notif-panel');
      const btn = document.querySelector('.tb-notif');
      if (!panel.contains(e.target) && !btn.contains(e.target)) panel.classList.remove('on');
    });

    // ─── PROFILE EDIT ───
    function toggleEdit() {
      const view = document.getElementById('profile-view');
      const edit = document.getElementById('profile-edit');
      const btn = document.getElementById('edit-btn');
      const isEditing = edit.style.display !== 'none';
      view.style.display = isEditing ? 'block' : 'none';
      edit.style.display = isEditing ? 'none' : 'block';
      btn.innerHTML = isEditing ? '<i data-lucide="edit-3" style="width:12px;height:12px;margin-right:4px;"></i> Edit Profile' : 'Cancel';
      lucide.createIcons();
    }
    function saveProfile() {
      // [BACKEND_NEEDED]: Add a real API call to save the updated profile data (e.g., PUT /api/student/profile)
      toggleEdit();
    }
    function addPSkill(e) {
      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); const v = e.target.value.trim().replace(',', ''); if (v) { const t = document.createElement('span'); t.className = 'skill-tag'; t.innerHTML = `${v}<button onclick="removePSkill(this)">×</button>`; document.getElementById('p-skills-wrap').insertBefore(t, e.target); } e.target.value = ''; }
    }
    function removePSkill(btn) { btn.closest('.skill-tag').remove(); }

    // ─── RESUME BUILDER ───
    let rbStep = 0;
    function rbGo(step) {
      if (step === 4) generatePreview();
      document.querySelectorAll('.rb-panel').forEach((p, i) => p.classList.toggle('on', i === step));
      document.querySelectorAll('.rb-step').forEach((s, i) => { s.classList.remove('on', 'done'); if (i < step) s.classList.add('done'); else if (i === step) s.classList.add('on'); });
      rbStep = step;
    }
    function addSkillRb(e) {
      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); const v = e.target.value.trim().replace(',', ''); if (v) { const t = document.createElement('span'); t.className = 'skill-tag'; t.innerHTML = `${v}<button onclick="removeSkillRb(this)">×</button>`; document.getElementById('rb-skills-wrap').insertBefore(t, e.target); } e.target.value = ''; }
    }
    function removeSkillRb(btn) { btn.closest('.skill-tag').remove(); }
    function generatePreview() {
      const g = id => document.getElementById(id)?.value || '';
      document.getElementById('pv-name').textContent = g('rb-name') || 'Your Name';
      document.getElementById('pv-contact').textContent = `${g('rb-email')} · ${g('rb-phone')} · ${g('rb-linkedin')}`;
      document.getElementById('pv-obj').textContent = g('rb-obj') || '-';
      document.getElementById('pv-edu').innerHTML = `<strong>${g('rb-degree')}</strong> | ${g('rb-college')} | CGPA: ${g('rb-cgpa')} | ${g('rb-year')}`;
      document.getElementById('pv-12').textContent = `12th: ${g('rb-12')}`;
      document.getElementById('pv-10').textContent = `10th: ${g('rb-10')}`;
      const skills = [...document.querySelectorAll('#rb-skills-wrap .skill-tag')].map(t => t.textContent.replace('×', '').trim()).join(', ');
      document.getElementById('pv-skills').textContent = skills || '-';
      document.getElementById('pv-p1').innerHTML = `<strong>${g('rb-p1t')}</strong> (${g('rb-p1s')}) - ${g('rb-p1d')}`;
      document.getElementById('pv-p2').innerHTML = `<strong>${g('rb-p2t')}</strong> (${g('rb-p2s')}) - ${g('rb-p2d')}`;
      document.getElementById('pv-exp').textContent = g('rb-exp') || '-';
      document.getElementById('pv-cert').textContent = g('rb-cert') || '-';
    }


    // ─── SIDEBAR TOGGLE ───
    let sidebarOpen = true;
    function toggleSidebar() {
      sidebarOpen = !sidebarOpen;
      const sidebar = document.getElementById('sidebar');
      const main = document.getElementById('main-content');
      const logoMark = document.getElementById('logo-mark-st');
      sidebar.classList.toggle('collapsed', !sidebarOpen);
      main.classList.toggle('expanded', !sidebarOpen);
      logoMark.style.transform = sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)';
    }

    // ─── LOGOUT ───
    function logout() { sessionStorage.clear(); localStorage.clear(); window.location.href = 'Login.html'; }

    // Initialize Lucide icons
    lucide.createIcons();
