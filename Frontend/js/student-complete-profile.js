const API_BASE = 'http://localhost:5001';
let skills = [];

/* ── On page load: read token + user info from URL params ── */
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);

  const token = params.get('token');
  const name  = decodeURIComponent(params.get('name')  || '');
  const email = decodeURIComponent(params.get('email') || '');
  const id    = params.get('id') || '';
  const role  = params.get('role') || 'student';

  // If no token — user didn't come from OAuth, redirect to signup
  if (!token) {
    window.location.href = 'Studentsignup.html';
    return;
  }

  // Save to localStorage
  localStorage.setItem('authToken',  token);
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('userRole',   role);
  localStorage.setItem('userName',   name);
  localStorage.setItem('userEmail',  email);
  localStorage.setItem('studentName',  name);
  localStorage.setItem('studentEmail', email);
  if (id) localStorage.setItem('userId', id);
  sessionStorage.setItem('isLoggedIn', 'true');
  sessionStorage.setItem('userRole', role);

  // Clean URL
  window.history.replaceState({}, '', window.location.pathname);

  // Show user info card
  const nameEl   = document.getElementById('display-name');
  const emailEl  = document.getElementById('display-email');
  const avatarEl = document.getElementById('user-avatar');

  if (nameEl)   nameEl.textContent  = name  || 'Google User';
  if (emailEl)  emailEl.textContent = email || '';
  if (avatarEl && name) avatarEl.textContent = name.charAt(0).toUpperCase();
});

/* ── Validation ── */
function validateForm() {
  let ok = true;
  const checks = [
    { id: 'cp-phone',   err: 'err-cp-phone',   test: v => v.replace(/\D/g,'').length >= 10 },
    { id: 'cp-branch',  err: 'err-cp-branch',  test: v => v !== '' },
    { id: 'cp-year',    err: 'err-cp-year',    test: v => v !== '' },
    { id: 'cp-cgpa',    err: 'err-cp-cgpa',    test: v => v !== '' && +v >= 0 && +v <= 10 },
    { id: 'cp-college', err: 'err-cp-college', test: v => v.trim().length >= 2 },
  ];

  checks.forEach(c => {
    const el  = document.getElementById(c.id);
    const err = document.getElementById(c.err);
    if (!c.test(el.value)) {
      el.classList.add('error');
      err.classList.add('show');
      ok = false;
    }
  });

  if (skills.length === 0) {
    document.getElementById('err-cp-skills').classList.add('show');
    ok = false;
  }

  if (!document.getElementById('resume-input').files[0]) {
    document.getElementById('err-cp-resume').classList.add('show');
    ok = false;
  }

  return ok;
}

function clearErr(el) {
  el.classList.remove('error');
  const err = document.getElementById('err-' + el.id);
  if (err) err.classList.remove('show');
}

/* ── Submit profile ── */
async function submitProfile() {
  if (!validateForm()) return;

  const btn     = document.getElementById('submit-btn');
  const spinner = document.getElementById('submit-spinner');
  const token   = localStorage.getItem('authToken');

  btn.disabled = true;
  spinner.style.display = 'inline-block';

  try {
    const formData = new FormData();
    formData.append('phone',      document.getElementById('cp-phone').value);
    formData.append('branch',     document.getElementById('cp-branch').value);
    formData.append('year',       document.getElementById('cp-year').value);
    formData.append('cgpa',       document.getElementById('cp-cgpa').value);
    formData.append('college',    document.getElementById('cp-college').value);
    formData.append('rollNumber', document.getElementById('cp-roll').value);
    formData.append('linkedin',   document.getElementById('cp-linkedin').value);
    formData.append('skills',     JSON.stringify(skills));
    formData.append('resume',     document.getElementById('resume-input').files[0]);

    const resp = await fetch(`${API_BASE}/api/students/complete-profile`, {
      method:  'PATCH',
      headers: { 'Authorization': `Bearer ${token}` },
      body:    formData
    });

    if (!resp.ok) {
      const errRes = await resp.json().catch(() => ({}));
      throw new Error(errRes?.message || 'Profile update failed');
    }

    const res = await resp.json();

    if (res?.success) {
      // Save extra profile data to localStorage
      localStorage.setItem('studentBranch',  document.getElementById('cp-branch').value);
      localStorage.setItem('studentYear',    document.getElementById('cp-year').value);
      localStorage.setItem('studentCGPA',    document.getElementById('cp-cgpa').value);
      localStorage.setItem('studentCollege', document.getElementById('cp-college').value);
      localStorage.setItem('studentPhone',   document.getElementById('cp-phone').value);
      localStorage.setItem('studentSkills',  JSON.stringify(skills));

      showToast('🎉 Profile complete! Redirecting…');

      // Show success stage
      document.getElementById('stage-profile').classList.remove('active');
      document.getElementById('stage-success').classList.add('active');

      setTimeout(() => window.location.href = 'StudentDashboard.html', 1500);
    } else {
      throw new Error(res?.message || 'Could not save profile');
    }
  } catch (err) {
    console.error(err);
    showToast('❌ ' + (err.message || 'Something went wrong'), '#ef4444');
  } finally {
    btn.disabled = false;
    spinner.style.display = 'none';
  }
}

/* ── Skills ── */
function addSkill(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const val = e.target.value.trim();
    if (val && !skills.includes(val)) {
      skills.push(val);
      renderSkills();
    }
    e.target.value = '';
    const err = document.getElementById('err-cp-skills');
    if (err) err.classList.remove('show');
  }
}

function renderSkills() {
  const wrap = document.getElementById('skills-wrap');
  const inp  = document.getElementById('skill-input');
  wrap.querySelectorAll('.skill-tag').forEach(t => t.remove());
  skills.forEach(s => {
    const tag = document.createElement('span');
    tag.className = 'skill-tag';
    tag.innerHTML = `${s}<span onclick="removeSkill('${s}')">×</span>`;
    wrap.insertBefore(tag, inp);
  });
}

function removeSkill(s) {
  skills = skills.filter(k => k !== s);
  renderSkills();
}

/* ── Resume ── */
function handleFile(inp) {
  const file = inp.files[0];
  if (file) {
    document.getElementById('upload-name').textContent = file.name;
    document.getElementById('upload-done').classList.add('show');
    const err = document.getElementById('err-cp-resume');
    if (err) err.classList.remove('show');
  }
}

function removeFile() {
  document.getElementById('resume-input').value = '';
  document.getElementById('upload-done').classList.remove('show');
}

/* ── Toast ── */
function showToast(msg, bg = '#2563eb') {
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:24px;right:24px;background:${bg};color:white;padding:12px 24px;border-radius:8px;box-shadow:0 8px 16px rgba(0,0,0,0.1);z-index:9999;transition:all 0.4s ease;`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(10px)';
    setTimeout(() => t.remove(), 400);
  }, 3000);
}