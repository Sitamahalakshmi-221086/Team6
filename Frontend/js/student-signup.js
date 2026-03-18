/* STATE */
let currentStage = 2;
<<<<<<< Updated upstream
    let skills = [];
    let hiringRoles = [];
    let selectedRole = 'student';
    let resendTimer = null;
    const DEMO_OTP = '123456';

    /* ── NAVIGATION ── */
    async function goNext(from, event) {
      if (event) event.preventDefault();
      if (from === 2) {
        if (!validateStage2()) return;
        
        const btn = document.querySelector('.btn-next');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner"></span> Saving...';
        btn.disabled = true;

        try {
          const formData = new FormData();
          formData.append('fullName', document.getElementById('s-name').value);
          formData.append('email', document.getElementById('s-email').value);
          formData.append('password', document.getElementById('s-pwd').value);
          formData.append('phone', document.getElementById('s-phone').value);
          formData.append('branch', document.getElementById('s-branch').value);
          formData.append('year', document.getElementById('s-year').value);
          formData.append('cgpa', document.getElementById('s-cgpa').value);
          formData.append('rollNumber', document.getElementById('s-roll').value);
          formData.append('linkedin', document.getElementById('s-linkedin').value);
          formData.append('skills', JSON.stringify(skills));
          
          const resumeFile = document.getElementById('resume-input').files[0];
          if (resumeFile) {
            formData.append('resume', resumeFile);
          }

          const response = await fetch('http://localhost:5001/api/students/signup', {
            method: 'POST',
            body: formData
          });

          const result = await response.json();

          if (result.success) {
            document.getElementById('verify-email-show').textContent = document.getElementById('s-email').value;
            goTo(3);
            startResendTimer();
          } else {
            alert('Error: ' + (result.message || 'Signup failed'));
          }
        } catch (error) {
          console.error('Signup Error:', error);
          alert('Could not connect to server. Please ensure the backend is running.');
        } finally {
          btn.innerHTML = originalText;
          btn.disabled = false;
        }
      }
    }
=======
let skills = [];
let resendTimer = null;
let generatedOtp = '';
let otpExpiry = null;
const OTP_TTL_MS = 10 * 60 * 1000;
const API_BASE = 'http://127.0.0.1:5000';

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function setSession({ role, name, email, id, extra = {} }) {
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('userRole', role);
  localStorage.setItem('userName', name || '');
  localStorage.setItem('userEmail', email || '');
  if (id) localStorage.setItem('userId', String(id));

  localStorage.setItem('studentName', name || '');
  localStorage.setItem('studentEmail', email || '');
  Object.entries(extra).forEach(([k, v]) => localStorage.setItem(k, v));

  sessionStorage.setItem('isLoggedIn', 'true');
  sessionStorage.setItem('userRole', role);
  sessionStorage.setItem('studentName', name || '');
  sessionStorage.setItem('studentEmail', email || '');
}

/* NAVIGATION */
function goTo(stage) {
  const curId = 'stage-' + currentStage + (currentStage === 2 ? '-student' : '');
  const el = document.getElementById(curId);
  if (el) el.classList.remove('active');

  currentStage = stage;
  const newId = 'stage-' + stage + (stage === 2 ? '-student' : '');
  const newEl = document.getElementById(newId);
  if (newEl) newEl.classList.add('active');

  updateSidebar(stage);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateSidebar(stage) {
  const pcts = ['25%', '50%', '75%', '100%'];
  const fill = document.getElementById('prog-fill');
  const pct  = document.getElementById('prog-pct');
  const lbl  = document.getElementById('prog-lbl');

  if (fill) fill.style.width = pcts[stage - 1];
  if (pct)  pct.textContent  = pcts[stage - 1];
  if (lbl)  lbl.textContent  = 'Step ' + stage + ' of 4';

  for (let i = 1; i <= 4; i++) {
    const num = document.getElementById('sn-' + i);
    const row = document.getElementById('sr-' + i);
    if (!num || !row) continue;

    row.classList.remove('is-active', 'is-done');
    num.classList.remove('is-active', 'is-done');

    if (i < stage) {
      row.classList.add('is-done');
      num.classList.add('is-done');
      num.textContent = '✓';
    } else if (i === stage) {
      row.classList.add('is-active');
      num.classList.add('is-active');
      num.textContent = (i === 4 || i === 1) ? '✓' : i;
    } else {
      num.textContent = (i === 4 || i === 1) ? '✓' : i;
    }
  }
}

/* VALIDATION */
function validateStage2() {
  let ok = true;
  const checks = [
    { id: 's-name',    err: 'err-s-name',    test: v => v.trim().length >= 2 },
    { id: 's-email',   err: 'err-s-email',   test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
    { id: 's-phone',   err: 'err-s-phone',   test: v => v.replace(/\D/g, '').length >= 10 },
    { id: 's-branch',  err: 'err-s-branch',  test: v => v !== '' },
    { id: 's-year',    err: 'err-s-year',    test: v => v !== '' },
    { id: 's-cgpa',    err: 'err-s-cgpa',    test: v => v !== '' && +v >= 0 && +v <= 10 },
    { id: 's-college', err: 'err-s-college', test: v => v.trim().length >= 2 },
    { id: 's-pwd',     err: 'err-s-pwd',     test: v => v.length >= 8 }
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
    document.getElementById('err-s-skills').classList.add('show');
    ok = false;
  }

  if (!document.getElementById('resume-input').files[0]) {
    document.getElementById('err-s-resume').classList.add('show');
    ok = false;
  }

  return ok;
}

function clearErr(el) {
  el.classList.remove('error');
  const err = document.getElementById('err-' + el.id);
  if (err) err.classList.remove('show');
}

/* OTP HELPERS */
async function goNext(stage, e) {
  if (e) e.preventDefault();
  if (stage !== 2) return;

  if (!validateStage2()) return;

  const email   = document.getElementById('s-email').value;
  const name    = document.getElementById('s-name').value;
  const nextBtn = document.querySelector('#stage-2-student .btn-next');

  if (nextBtn) { nextBtn.disabled = true; nextBtn.style.opacity = '0.85'; }

  try {
    // ✅ CHECK IF EMAIL ALREADY REGISTERED
    const checkResp = await fetch(`${API_BASE}/api/students/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const checkData = await checkResp.json();

    if (checkData.exists) {
      const emailEl  = document.getElementById('s-email');
      const emailErr = document.getElementById('err-s-email');
      emailEl.classList.add('error');
      emailErr.textContent = '⚠️ This email is already registered. Please login instead.';
      emailErr.classList.add('show');
      return;
    }

    // ✅ SEND OTP
    generatedOtp = generateOtp();
    otpExpiry    = Date.now() + OTP_TTL_MS;
    document.getElementById('verify-email-show').textContent = email;

    const resp = await fetch(`${API_BASE}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, otp: generatedOtp })
    });

    if (!resp.ok) throw new Error('Server error while sending OTP');
    const data = await resp.json();
    if (!data?.success) throw new Error(data?.message || 'OTP email failed');

    showToast('✅ OTP sent to your email');
    goTo(3);
    startResendTimer();

  } catch (err) {
    console.error(err);
    showToast('⚠️ Could not send OTP email. Please try again.', '#ef4444');
  } finally {
    if (nextBtn) { nextBtn.disabled = false; nextBtn.style.opacity = ''; }
  }
}

function showOtpLoading(show) {
  const s = document.getElementById('otp-sending-state');
  const e = document.getElementById('otp-entry-state');
  if (s) s.style.display = show ? 'block' : 'none';
  if (e) e.style.display = show ? 'none' : 'block';
}

function startResendTimer() {
  let count = 30;
  document.getElementById('timer-badge').style.display = 'inline-flex';
  document.getElementById('resend-btn').style.display  = 'none';

  clearInterval(resendTimer);
  resendTimer = setInterval(() => {
    count--;
    document.getElementById('timer-count').textContent = count;
    if (count <= 0) {
      clearInterval(resendTimer);
      document.getElementById('timer-badge').style.display = 'none';
      document.getElementById('resend-btn').style.display  = 'inline';
    }
  }, 1000);
}

const otpInputs = document.querySelectorAll('.otp-input');

function otpMove(el, idx) {
  if (el.value && idx < 5) otpInputs[idx + 1].focus();
  const ev = window.event;
  if (ev && ev.key === 'Backspace' && !el.value && idx > 0) otpInputs[idx - 1].focus();
}

function resendOtp() {
  goNext(2);
}

async function verifyOtp() {
  const otp = Array.from(otpInputs).map(i => i.value).join('');
  if (otp.length < 6) return;

  const spinner = document.getElementById('verify-spinner');
  spinner.style.display = 'inline-block';

  try {
    const formData = new FormData();
    formData.append('fullName',   document.getElementById('s-name').value);
    formData.append('email',      document.getElementById('s-email').value);
    formData.append('password',   document.getElementById('s-pwd').value);
    formData.append('phone',      document.getElementById('s-phone').value);
    formData.append('branch',     document.getElementById('s-branch').value);
    formData.append('year',       document.getElementById('s-year').value);
    formData.append('cgpa',       document.getElementById('s-cgpa').value);
    formData.append('college',    document.getElementById('s-college').value);
    formData.append('rollNumber', document.getElementById('s-roll').value);
    formData.append('linkedin',   document.getElementById('s-linkedin').value);
    formData.append('skills',     JSON.stringify(skills));
    formData.append('resume',     document.getElementById('resume-input').files[0]);
    formData.append('otp',        otp);

    const resp = await fetch(`${API_BASE}/api/students/signup`, {
      method: 'POST',
      body: formData
    });

    if (!resp.ok) {
      const errRes = await resp.json().catch(() => ({}));
      throw new Error(errRes?.message || 'Signup request failed');
    }

    const res = await resp.json();

    if (res?.success) {
      const fullName = document.getElementById('s-name').value;
      const email    = document.getElementById('s-email').value;
      const id       = res.studentId;

      setSession({
        role: 'student',
        name: fullName,
        email,
        id,
        extra: {
          studentBranch:   document.getElementById('s-branch').value,
          studentYear:     document.getElementById('s-year').value,
          studentCGPA:     document.getElementById('s-cgpa').value,
          studentRoll:     document.getElementById('s-roll').value,
          studentPhone:    document.getElementById('s-phone').value,
          studentLinkedin: document.getElementById('s-linkedin').value,
          studentSkills:   JSON.stringify(skills),
          studentCollege:  document.getElementById('s-college').value,
        }
      });

      document.getElementById('otp-error').style.display = 'none';
      showToast('🎉 Signup successful!');
      goTo(4);
      setTimeout(() => window.location.href = 'StudentDashboard.html', 900);

    } else {
      const box = document.getElementById('otp-error');
      box.style.display = 'block';
      box.textContent   = res.message || 'Invalid OTP. Please try again.';
    }

  } catch (err) {
    console.error(err);
    const box = document.getElementById('otp-error');
    if (box) {
      box.style.display = 'block';
      box.textContent   = err?.message || 'Signup request failed.';
    }
  } finally {
    spinner.style.display = 'none';
  }
}

/* SKILLS */
function addSkill(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const val = e.target.value.trim();
    if (val && !skills.includes(val)) {
      skills.push(val);
      renderSkills();
    }
    e.target.value = '';
    clearErr(document.getElementById('skill-input'));
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

/* RESUME */
function handleFile(inp) {
  const file = inp.files[0];
  if (file) {
    document.getElementById('upload-name').textContent = file.name;
    document.getElementById('upload-done').classList.add('show');
    clearErr(inp);
  }
}

function removeFile() {
  document.getElementById('resume-input').value = '';
  document.getElementById('upload-done').classList.remove('show');
}

/* UTILS */
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