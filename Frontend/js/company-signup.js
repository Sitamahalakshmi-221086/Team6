let currentStage = 2;
let skills = [];
let hiringRoles = [];
let selectedRole = 'company';
let resendTimer = null;

// ── CONFIG ──
const SERVER_URL = 'http://localhost:5001';

// Store pending company data and OTP in memory
// DB is only written AFTER OTP is verified
window._currentOtp = null;
window._pendingCompanyData = null;

/* ── NAVIGATION ── */
async function goNext(from, event) {
  if (event) event.preventDefault();

  if (from === 2) {
    if (!validateStage2()) return;

    const signupBtn = event.target;
    const originalText = signupBtn.textContent;
    signupBtn.disabled = true;
    signupBtn.textContent = 'Sending OTP...';

    const companyData = {
      companyName: document.getElementById('c-name').value,
      email: document.getElementById('c-email').value,
      password: document.getElementById('c-pwd').value,
      contactPerson: document.getElementById('c-contact').value,
      phone: document.getElementById('c-phone').value,
      industry: document.getElementById('c-industry').value,
      companySize: document.getElementById('c-size').value,
      website: document.getElementById('c-website').value,
      address: document.getElementById('c-address').value,
      hiringRoles: hiringRoles,
      description: document.getElementById('c-desc').value
    };

    try {
      // Step 1: Generate OTP and send email ONLY (no DB save yet)
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      window._currentOtp = generatedOtp;

      // Store company data in memory to save after OTP verified
      window._pendingCompanyData = companyData;

      const emailResponse = await fetch(`${SERVER_URL}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: companyData.email,
          name: companyData.contactPerson,
          otp: generatedOtp
        })
      });

      const emailResult = await emailResponse.json();

      if (!emailResult.success) {
        alert('Failed to send OTP email. Please check your email and try again.');
        return;
      }

      // Step 2: Move to OTP page (data NOT saved to DB yet)
      document.getElementById('verify-email-show').textContent = companyData.email;
      goTo(3);
      startResendTimer();

    } catch (error) {
      console.error('Error sending OTP:', error);
      alert('Could not connect to the server. Please try again later.');
    } finally {
      signupBtn.disabled = false;
      signupBtn.textContent = originalText;
    }
  }
}

function goTo(stage) {
  // Hide current stage
  const curEl = document.getElementById('stage-' + (currentStage === 2 ? '2-company' : currentStage));
  if (curEl) curEl.classList.remove('active');
  // Hide current stage
  const curEl = document.getElementById('stage-' + (currentStage === 2 ? '2-company' : currentStage));
  if (curEl) curEl.classList.remove('active');

  currentStage = stage;
  currentStage = stage;

  const nextEl = document.getElementById('stage-' + (stage === 2 ? '2-company' : stage));
  if (nextEl) nextEl.classList.add('active');

  updateSidebar(stage);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
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

    }
  }
}

/* ── VALIDATION ── */
function runCheck(c, fail) {
  const el = document.getElementById(c.id);
  const errEl = document.getElementById(c.err);
  if (!el || !errEl) return;
  if (!c.test(el.value)) { el.classList.add('error'); errEl.classList.add('show'); fail(); }
}

function validateStage2() {
  let ok = true;
  let checks = [
    { id: 'c-name',     err: 'err-c-name',     test: v => v.trim().length >= 2 },
    { id: 'c-email',    err: 'err-c-email',    test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
    { id: 'c-pwd',      err: 'err-c-pwd',      test: v => v.length >= 8 },
    { id: 'c-contact',  err: 'err-c-contact',  test: v => v.trim().length >= 2 },
    { id: 'c-phone',    err: 'err-c-phone',    test: v => v.replace(/\D/g, '').length >= 10 },
    { id: 'c-industry', err: 'err-c-industry', test: v => v !== '' },
    { id: 'c-address',  err: 'err-c-address',  test: v => v.trim().length >= 3 },
  ];

  checks.forEach(c => {
    const el = document.getElementById(c.id);
    const errEl = document.getElementById(c.err);
    if (!el || !errEl) return;
    if (!c.test(el.value)) {
      el.classList.add('error');
      errEl.classList.add('show');
      ok = false;
    }
  });

    }
  });

  const rolesErr = document.getElementById('err-c-roles');
  if (hiringRoles.length === 0) {
    if (rolesErr) rolesErr.classList.add('show');
    ok = false;
  }

  if (!ok) document.querySelector('.error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return ok;
}

  if (!ok) document.querySelector('.error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return ok;
}

function clearErr(el) {
  el.classList.remove('error');
  const errEl = document.getElementById('err-' + el.id);
  if (errEl) errEl.classList.remove('show');
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
  if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
  else { inp.type = 'password'; btn.textContent = '👁'; }
}
function togglePwd(id, btn) {
  const inp = document.getElementById(id);
  if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
  else { inp.type = 'password'; btn.textContent = '👁'; }
}

/* ── HIRING ROLES ── */
function addRole(e) {
  if (e.key !== 'Enter' && e.key !== ',') return;
  e.preventDefault();
  const input = document.getElementById('role-input');
  const val = input.value.trim().replace(/,$/, '');
  if (!val || hiringRoles.includes(val)) { input.value = ''; return; }
  hiringRoles.push(val);
  renderRoles();
  input.value = '';
  document.getElementById('err-c-roles').classList.remove('show');
}
/* ── HIRING ROLES ── */
function addRole(e) {
  if (e.key !== 'Enter' && e.key !== ',') return;
  e.preventDefault();
  const input = document.getElementById('role-input');
  const val = input.value.trim().replace(/,$/, '');
  if (!val || hiringRoles.includes(val)) { input.value = ''; return; }
  hiringRoles.push(val);
  renderRoles();
  input.value = '';
  document.getElementById('err-c-roles').classList.remove('show');
}

function removeRoleTag(s) {
  hiringRoles = hiringRoles.filter(x => x !== s);
  renderRoles();
}
function removeRoleTag(s) {
  hiringRoles = hiringRoles.filter(x => x !== s);
  renderRoles();
}

function renderRoles() {
  const wrap = document.getElementById('roles-wrap');
  if (!wrap) return;
  wrap.querySelectorAll('.skill-tag').forEach(t => t.remove());
  hiringRoles.forEach(s => {
    const tag = document.createElement('span');
    tag.className = 'skill-tag';
    tag.style.cssText = 'background:#f0fdf4;border-color:#bbf7d0;color:#059669;';
    tag.innerHTML = s + '<button onclick="removeRoleTag(\'' + s + '\')">×</button>';
    wrap.insertBefore(tag, document.getElementById('role-input'));
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
  if (!window._currentOtp || otp !== window._currentOtp) {
    if (spinner) spinner.style.display = 'none';
    if (verifyBtn) verifyBtn.disabled = false;
    errEl.textContent = 'Incorrect OTP. Please check your email and try again.';
    errEl.style.display = 'block';
    otpInputs.forEach(i => { i.value = ''; i.style.borderColor = '#ef4444'; });
    otpInputs[0].focus();
    setTimeout(() => otpInputs.forEach(i => i.style.borderColor = ''), 1200);
    return;
  }

  // ── OTP correct → NOW save company to DB ──
  try {
    const response = await fetch(`${SERVER_URL}/api/companies/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(window._pendingCompanyData)
    });

    const result = await response.json();

    if (result.success) {
      window._currentOtp = null;
      if (result.companyId) {
        sessionStorage.setItem('companyId', result.companyId);
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userRole', 'company');
        const d = window._pendingCompanyData;
        if (d) {
          sessionStorage.setItem('companyName', d.companyName || '');
          sessionStorage.setItem('companyEmail', d.email || '');
        }
      }
      window._pendingCompanyData = null;
      goTo(4);
    } else {
      errEl.textContent = 'OTP verified but registration failed: ' + result.message;
      errEl.style.display = 'block';
    }

  } catch (error) {
    console.error('Registration after OTP error:', error);
    errEl.textContent = 'Server error. Please try again.';
    errEl.style.display = 'block';
  } finally {
    if (spinner) spinner.style.display = 'none';
    if (verifyBtn) verifyBtn.disabled = false;
  }
}

function startResendTimer() {
  let t = 30;
  const resendBtn = document.getElementById('resend-btn');
  const tBadge = document.getElementById('timer-badge');
  const tCount = document.getElementById('timer-count');

  if (resendBtn) resendBtn.style.display = 'none';
  if (tBadge) tBadge.style.display = 'inline-flex';
  if (tCount) tCount.textContent = t;

  clearInterval(resendTimer);
  resendTimer = setInterval(() => {
    t--;
    if (tCount) tCount.textContent = t;
    if (t <= 0) {
      clearInterval(resendTimer);
      if (resendBtn) resendBtn.style.display = 'inline';
      if (tBadge) tBadge.style.display = 'none';
    }
  }, 1000);
}
      if (resendBtn) resendBtn.style.display = 'inline';
      if (tBadge) tBadge.style.display = 'none';
    }
  }, 1000);
}

async function resendOtp() {
  if (!window._pendingCompanyData) {
    alert('Session expired. Please go back and fill the form again.');
    goTo(2);
    return;
  }

  const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
  window._currentOtp = newOtp;

  otpInputs.forEach(i => i.value = '');
  otpInputs[0].focus();
  startResendTimer();

  try {
    await fetch(`${SERVER_URL}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: window._pendingCompanyData.email,
        name: window._pendingCompanyData.contactPerson,
        otp: newOtp
      })
    });
  } catch (err) {
    console.error('Resend OTP error:', err);
  }

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
}
