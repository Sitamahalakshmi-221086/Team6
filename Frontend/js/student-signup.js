let currentStage = 2;
let skills = [];
let hiringRoles = [];
let selectedRole = 'student';
let resendTimer = null;

// ── CONFIG ──
const SERVER_URL = 'http://localhost:5000';
const SERVER_URL = 'http://localhost:5000';

// Store pending student data and OTP in memory
// DB is only written AFTER OTP is verified
window._currentOtp = null;
window._pendingFormData = null; // We'll store form field values here

/* ── NAVIGATION ── */
async function goNext(from, event) {
  if (event) event.preventDefault();

  if (from === 2) {
    if (!validateStage2()) return;

    const btn = document.querySelector('.btn-next');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Sending OTP...';
    btn.disabled = true;

    try {
      // Step 1: Collect all form values into memory (no DB save yet)
      const resumeFile = document.getElementById('resume-input').files[0];

      // Store as plain object; resume file stored separately
      window._pendingFormData = {
        fullName: document.getElementById('s-name').value,
        email: document.getElementById('s-email').value,
        password: document.getElementById('s-pwd').value,
        phone: document.getElementById('s-phone').value,
        branch: document.getElementById('s-branch').value,
        year: document.getElementById('s-year').value,
        cgpa: document.getElementById('s-cgpa').value,
        rollNumber: document.getElementById('s-roll').value,
        linkedin: document.getElementById('s-linkedin').value,
        skills: JSON.stringify(skills),
        resumeFile: resumeFile || null
      };

      // Step 2: Generate OTP and send email ONLY (no DB save yet)
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      window._currentOtp = generatedOtp;

      const emailResponse = await fetch(`${SERVER_URL}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: window._pendingFormData.email,
          name: window._pendingFormData.fullName,
          otp: generatedOtp
        })
      });

      const emailResult = await emailResponse.json();

      if (!emailResult.success) {
        alert('Failed to send OTP email. Please check your email and try again.');
        return;
      }

      // Step 3: Move to OTP page (data NOT saved to DB yet)
      document.getElementById('verify-email-show').textContent = window._pendingFormData.email;
      goTo(3);
      startResendTimer();

    } catch (error) {
      console.error('Error sending OTP:', error);
      alert('Could not connect to server. Please ensure the backend is running.');
    } finally {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }
  }
}

function goTo(stage) {
  const curEl = document.getElementById('stage-' + (currentStage === 2 ? '2-student' : currentStage));
  if (curEl) curEl.classList.remove('active');

  currentStage = stage;

  const nextEl = document.getElementById('stage-' + (stage === 2 ? '2-student' : stage));
  if (nextEl) nextEl.classList.add('active');

  updateSidebar(stage);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── BACK BUTTON from stage 3 goes to stage 2 ── */
const stage3Prev = document.querySelector('#stage-3 .btn-prev');
if (stage3Prev) {
  stage3Prev.onclick = function () {
    goTo(2);
  };
}

function updateSidebar(stage) {
  const pcts = ['25%', '50%', '75%', '100%'];
  const pBar = document.getElementById('progress-bar');
  const pPct = document.getElementById('progress-pct');
  const pLabel = document.getElementById('progress-step-label');

  if (pBar) pBar.style.width = pcts[stage - 1];
  if (pPct) pPct.textContent = pcts[stage - 1];
  if (pLabel) pLabel.textContent = 'Step ' + stage + ' of 4';

  for (let i = 1; i <= 4; i++) {
    const circle = document.getElementById('circle-' + i);
    const step = document.getElementById('sidebar-step-' + i);
    if (!circle || !step) continue;

    step.classList.remove('active-step', 'done-step');
    if (i < stage) {
      circle.className = 'step-circle done';
      circle.textContent = '✓';
      step.classList.add('done-step');
    } else if (i === stage) {
      circle.className = 'step-circle active';
      circle.textContent = i === 4 ? '✓' : i;
      step.classList.add('active-step');
    } else {
      circle.className = 'step-circle pending';
      circle.textContent = i === 4 ? '✓' : i;
    }
  }
}

/* ── VALIDATION ── */
function validateStage2() {
  let ok = true;
  let checks = [
    { id: 's-name', err: 'err-s-name', test: v => v.trim().length >= 2 },
    { id: 's-email', err: 'err-s-email', test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
    { id: 's-pwd', err: 'err-s-pwd', test: v => v.length >= 8 },
    { id: 's-phone', err: 'err-s-phone', test: v => v.replace(/\D/g, '').length >= 10 },
    { id: 's-branch', err: 'err-s-branch', test: v => v !== '' },
    { id: 's-year', err: 'err-s-year', test: v => v !== '' },
    { id: 's-cgpa', err: 'err-s-cgpa', test: v => v !== '' && +v >= 0 && +v <= 10 },
  ];
  checks.forEach(c => runCheck(c, () => ok = false));

  if (skills.length === 0) {
    const skillErr = document.getElementById('err-s-skills');
    if (skillErr) skillErr.classList.add('show');
    ok = false;
  }

  const resumeInput = document.getElementById('resume-input');
  // Temporarily made optional for demo/testing
  // if (resumeInput && !resumeInput.files[0]) {
  //   const resumeErr = document.getElementById('err-s-resume');
  //   if (resumeErr) resumeErr.classList.add('show');
  //   ok = false;
  // }

  if (!ok) document.querySelector('.error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return ok;
}

function runCheck(c, fail) {
  const el = document.getElementById(c.id);
  const errEl = document.getElementById(c.err);
  if (!el || !errEl) return;
  if (!c.test(el.value)) { el.classList.add('error'); errEl.classList.add('show'); fail(); }
}

function clearErr(el) {
  el.classList.remove('error');
  const errEl = document.getElementById('err-' + el.id);
  if (errEl) errEl.classList.remove('show');
}

/* ── PASSWORD ── */
function checkPwd(input, prefix, labelId) {
  const v = input.value;
  const bars = [1, 2, 3, 4].map(i => document.getElementById(prefix + i));
  const lbl = document.getElementById(labelId);
  if (!bars[0]) return;
  bars.forEach(b => { if (b) b.className = 'pwd-bar'; });
  if (!v) { if (lbl) { lbl.textContent = 'Enter a password'; lbl.style.color = '#94a3b8'; } return; }

  let score = 0;
  if (v.length >= 8) score++;
  if (/[A-Z]/.test(v)) score++;
  if (/[0-9]/.test(v)) score++;
  if (/[^A-Za-z0-9]/.test(v)) score++;

  const cls = score <= 1 ? 'weak' : score <= 2 ? 'fair' : 'strong';
  const texts = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ef4444', '#f59e0b', '#22c55e', '#22c55e'];

  for (let i = 0; i < score; i++) {
    if (bars[i]) bars[i].classList.add(cls);
  }
  if (lbl) {
    lbl.textContent = texts[score] || '';
    lbl.style.color = colors[score];
  }
}

function togglePwd(id, btn) {
  const inp = document.getElementById(id);
  if (!inp) return;
  if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
  else { inp.type = 'password'; btn.textContent = '👁'; }
}

/* ── CGPA ── */
function updateCgpa(input) {
  const v = parseFloat(input.value);
  const fill = document.getElementById('cgpa-fill');
  const hint = document.getElementById('cgpa-hint');
  if (!fill || !hint) return;

  if (!isNaN(v) && v >= 0 && v <= 10) {
    fill.style.width = (v / 10 * 100) + '%';
    hint.textContent = v >= 8 ? '🌟 Excellent!' : v >= 6 ? '👍 Good' : v >= 4 ? 'Average' : 'Below average';
  } else {
    fill.style.width = '0%';
    hint.textContent = 'Enter value between 0 – 10';
  }
}

/* ── SKILLS ── */
function addSkill(e) {
  if (e.key !== 'Enter' && e.key !== ',') return;
  e.preventDefault();
  const input = document.getElementById('skill-input');
  if (!input) return;
  const val = input.value.trim().replace(/,$/, '');
  if (!val || skills.includes(val)) { input.value = ''; return; }
  skills.push(val);
  renderSkills();
  input.value = '';
  const skillErr = document.getElementById('err-s-skills');
  if (skillErr) skillErr.classList.remove('show');
}

function removeSkillTag(s) { skills = skills.filter(x => x !== s); renderSkills(); }

function renderSkills() {
  const wrap = document.getElementById('skills-wrap');
  if (!wrap) return;
  wrap.querySelectorAll('.skill-tag').forEach(t => t.remove());
  skills.forEach(s => {
    const tag = document.createElement('span');
    tag.className = 'skill-tag';
    tag.innerHTML = s + '<button onclick="removeSkillTag(\'' + s + '\')">×</button>';
    wrap.insertBefore(tag, document.getElementById('skill-input'));
  });
}

/* ── RESUME UPLOAD ── */
function handleFile(input) {
  const file = input.files[0];
  if (!file) return;
  const fileNameEl = document.getElementById('upload-name');
  const uploadDoneEl = document.getElementById('upload-done');
  const zoneEl = document.getElementById('upload-zone');
  const resumeErrEl = document.getElementById('err-s-resume');

  if (fileNameEl) fileNameEl.textContent = file.name;
  if (uploadDoneEl) uploadDoneEl.classList.add('show');
  if (zoneEl) zoneEl.style.opacity = '.5';
  if (resumeErrEl) resumeErrEl.classList.remove('show');
}

function removeFile() {
  const input = document.getElementById('resume-input');
  const uploadDoneEl = document.getElementById('upload-done');
  const zoneEl = document.getElementById('upload-zone');

  if (input) input.value = '';
  if (uploadDoneEl) uploadDoneEl.classList.remove('show');
  if (zoneEl) zoneEl.style.opacity = '1';
}

const zone = document.getElementById('upload-zone');
if (zone) {
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) {
      const dt = new DataTransfer(); dt.items.add(file);
      const input = document.getElementById('resume-input');
      if (input) {
        input.files = dt.files;
        handleFile(input);
      }
    }
  });
}

/* ── OTP ── */
const otpInputs = document.querySelectorAll('.otp-input');

function otpMove(el, idx) {
  if (el.value && idx < 5) otpInputs[idx + 1].focus();
  if (event.key === 'Backspace' && !el.value && idx > 0) otpInputs[idx - 1].focus();
}

async function verifyOtp() {
  const otp = Array.from(otpInputs).map(i => i.value).join('');
  const spinner = document.getElementById('verify-spinner');
  const errEl = document.getElementById('otp-error');
  const verifyBtn = document.querySelector('#stage-3 .btn-next');

  if (!errEl) return;
  errEl.style.display = 'none';

  if (otp.length < 6) {
    errEl.textContent = 'Please enter all 6 digits.';
    errEl.style.display = 'block';
    return;
  }

  if (spinner) spinner.style.display = 'inline-block';
  if (verifyBtn) verifyBtn.disabled = true;

  // ── Check OTP first ──
  try {
    const response = await fetch(`${SERVER_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: window._pendingFormData.email,
        otp: otp
      })
    });
    const result = await response.json();

    if (!result.success) {
      if (spinner) spinner.style.display = 'none';
      if (verifyBtn) verifyBtn.disabled = false;
      errEl.textContent = result.message || 'Incorrect OTP. Please check your email and try again.';
      errEl.style.display = 'block';
      otpInputs.forEach(i => { i.value = ''; i.style.borderColor = '#ef4444'; });
      otpInputs[0].focus();
      setTimeout(() => otpInputs.forEach(i => i.style.borderColor = ''), 1200);
      return;
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    if (spinner) spinner.style.display = 'none';
    if (verifyBtn) verifyBtn.disabled = false;
    errEl.textContent = 'Server error during OTP verification. Please try again.';
    errEl.style.display = 'block';
    return;
  }

  // ── OTP correct → NOW save student to DB ──
  try {
    const data = window._pendingFormData;

    // Rebuild FormData here (can't store FormData in memory across async ops reliably)
    const formData = new FormData();
    formData.append('fullName', data.fullName);
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('phone', data.phone);
    formData.append('branch', data.branch);
    formData.append('year', data.year);
    formData.append('cgpa', data.cgpa);
    formData.append('rollNumber', data.rollNumber);
    formData.append('linkedin', data.linkedin);
    formData.append('skills', data.skills);
    if (data.resumeFile) {
      formData.append('resume', data.resumeFile);
    }

    const response = await fetch(`${SERVER_URL}/api/students/signup`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      window._currentOtp = null;
      if (result.studentId) {
        sessionStorage.setItem('studentId', result.studentId);
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userRole', 'student');
        const d = window._pendingFormData;
        if (d) {
          sessionStorage.setItem('studentName', d.fullName || '');
          sessionStorage.setItem('studentEmail', d.email || '');
          sessionStorage.setItem('studentPhone', d.phone || '');
          sessionStorage.setItem('studentBranch', d.branch || '');
          sessionStorage.setItem('studentYear', d.year || '');
          sessionStorage.setItem('studentCGPA', d.cgpa != null ? String(d.cgpa) : '');
          sessionStorage.setItem('studentRoll', d.rollNumber || '');
          sessionStorage.setItem('studentLinkedin', d.linkedin || '');
          sessionStorage.setItem('studentSkills', d.skills || '[]');
        }
      }
      window._pendingFormData = null;
      goTo(4);
    } else {
      errEl.textContent = 'OTP verified but registration failed: ' + (result.message || 'Unknown error');
      errEl.style.display = 'block';
    }

  } catch (error) {
    console.error('Registration after OTP error:', error);
    errEl.textContent = 'Server error during registration. Please try again.';
    errEl.style.display = 'block';
  } finally {
    if (spinner) spinner.style.display = 'none';
    if (verifyBtn) verifyBtn.disabled = false;
  }
}

/* ── RESEND TIMER ── */
function startResendTimer() {
  let t = 30;
  const btn = document.getElementById('resend-btn');
  const badge = document.getElementById('timer-badge');
  const count = document.getElementById('timer-count');

  if (btn) btn.style.display = 'none';
  if (badge) badge.style.display = 'inline-flex';
  if (count) count.textContent = t;

  clearInterval(resendTimer);
  resendTimer = setInterval(() => {
    t--;
    if (count) count.textContent = t;
    if (t <= 0) {
      clearInterval(resendTimer);
      if (btn) btn.style.display = 'inline';
      if (badge) badge.style.display = 'none';
    }
  }, 1000);
}

async function resendOtp() {
  if (!window._pendingFormData) {
    alert('Session expired. Please go back and fill the form again.');
    goTo(2);
    return;
  }

  otpInputs.forEach(i => i.value = '');
  otpInputs[0].focus();
  startResendTimer();

  try {
    const response = await fetch(`${SERVER_URL}/api/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: window._pendingFormData.email
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      const toast = document.createElement('div');
      toast.textContent = '✅ OTP resent to your email!';
      Object.assign(toast.style, {
        position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
        background: '#059669', color: '#fff', padding: '10px 24px', borderRadius: '100px',
        fontSize: '14px', fontWeight: '600', zIndex: '9999',
        boxShadow: '0 4px 16px rgba(5,150,105,.4)'
      });
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2500);
    } else {
      alert(result.message || 'Failed to resend OTP.');
    }
  } catch (err) {
    console.error('Resend OTP error:', err);
    alert('Server error while resending OTP.');
  }
}