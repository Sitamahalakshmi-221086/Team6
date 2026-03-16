/* STATE */
let currentStage = 2;
let roles = [];
let resendTimer = null;
let generatedOtp = '';
let otpExpiry = null;
const OTP_TTL_MS = 10 * 60 * 1000;
const API_BASE = 'http://127.0.0.1:5000';

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function setSession({ role, name, email, id }) {
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('userRole', role);
  localStorage.setItem('userName', name || '');
  localStorage.setItem('userEmail', email || '');
  if (id) localStorage.setItem('userId', String(id));

  // Legacy keys used by existing dashboards
  localStorage.setItem('companyName', name || '');
  localStorage.setItem('companyEmail', email || '');

  // Back-compat
  sessionStorage.setItem('isLoggedIn', 'true');
  sessionStorage.setItem('userRole', role);
  sessionStorage.setItem('companyName', name || '');
  sessionStorage.setItem('companyEmail', email || '');
}

/* NAVIGATION */
function goTo(stage) {
  const curId = 'stage-' + currentStage + (currentStage === 2 ? '-company' : '');
  const el = document.getElementById(curId);
  if (el) el.classList.remove('active');
  
  currentStage = stage;
  const newId = 'stage-' + stage + (stage === 2 ? '-company' : '');
  const newEl = document.getElementById(newId);
  if (newEl) newEl.classList.add('active');
  
  updateSidebar(stage);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateSidebar(stage) {
  const pcts = ['25%', '50%', '75%', '100%'];
  const fill = document.getElementById('prog-fill');
  const pct = document.getElementById('prog-pct');
  const lbl = document.getElementById('prog-lbl');
  
  if (fill) fill.style.width = pcts[stage - 1];
  if (pct) pct.textContent = pcts[stage - 1];
  if (lbl) lbl.textContent = 'Step ' + stage + ' of 4';

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
    { id: 'c-name', err: 'err-c-name', test: v => v.trim().length >= 2 },
    { id: 'c-email', err: 'err-c-email', test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
    { id: 'c-contact', err: 'err-c-contact', test: v => v.trim().length >= 2 },
    { id: 'c-phone', err: 'err-c-phone', test: v => v.replace(/\D/g, '').length >= 10 },
    { id: 'c-industry', err: 'err-c-industry', test: v => v !== '' },
    { id: 'c-hq', err: 'err-c-hq', test: v => v.trim().length >= 2 },
    { id: 'c-pwd', err: 'err-c-pwd', test: v => v.length >= 8 }
  ];

  checks.forEach(c => {
    const el = document.getElementById(c.id);
    const err = document.getElementById(c.err);
    if (!c.test(el.value)) {
      el.classList.add('error');
      err.classList.add('show');
      ok = false;
    }
  });

  if (roles.length === 0) {
    document.getElementById('err-c-roles').classList.add('show');
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
  if (stage === 2) {
    if (!validateStage2()) return;
    
    const email = document.getElementById('c-email').value;
    const name = document.getElementById('c-name').value;
    document.getElementById('verify-email-show').textContent = email;

    const nextBtn = document.querySelector('#stage-2-company .btn-next');
    if (nextBtn) { nextBtn.disabled = true; nextBtn.style.opacity = '0.85'; }

    try {
      generatedOtp = generateOtp();
      otpExpiry = Date.now() + OTP_TTL_MS;

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
  document.getElementById('resend-btn').style.display = 'none';
  
  clearInterval(resendTimer);
  resendTimer = setInterval(() => {
    count--;
    const el = document.getElementById('timer-count');
    if (el) el.textContent = count;
    if (count <= 0) {
      clearInterval(resendTimer);
      document.getElementById('timer-badge').style.display = 'none';
      document.getElementById('resend-btn').style.display = 'inline';
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
    const body = {
      companyName: document.getElementById('c-name').value,
      email: document.getElementById('c-email').value,
      password: document.getElementById('c-pwd').value,
      hrContact: document.getElementById('c-contact').value,
      phone: document.getElementById('c-phone').value,
      industry: document.getElementById('c-industry').value,
      companySize: document.getElementById('c-size').value,
      website: document.getElementById('c-website').value,
      headquarters: document.getElementById('c-hq').value,
      hiringRoles: roles,
      description: document.getElementById('c-desc').value,
      otp: otp
    };

    const resp = await fetch(`${API_BASE}/api/companies/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!resp.ok) throw new Error('Server error');
    const res = await resp.json();
    if (res?.success) {
      const company = res.company || {};
      const companyName = company.companyName || body.companyName;
      const email = company.email || body.email;
      const id = company.id || company._id || company.companyId;

      setSession({ role: 'company', name: companyName, email, id });
      
      showToast('🎉 Company Registered Successfully!');
      goTo(4);
      setTimeout(() => window.location.href = 'CompanyDashboard.html', 900);
    } else {
      document.getElementById('otp-error').style.display = 'block';
      document.getElementById('otp-error').textContent = res.message || 'Invalid OTP';
    }
  } catch (err) {
    console.error(err);
    showToast('❌ Server error during signup', '#ef4444');
  } finally {
    spinner.style.display = 'none';
  }
}

/* ROLES */
function addRole(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const val = e.target.value.trim();
    if (val && !roles.includes(val)) {
      roles.push(val);
      renderRoles();
    }
    e.target.value = '';
    const err = document.getElementById('err-c-roles');
    if (err) err.classList.remove('show');
  }
}

function renderRoles() {
  const wrap = document.getElementById('roles-wrap');
  const inp = document.getElementById('role-input');
  wrap.querySelectorAll('.skill-tag').forEach(t => t.remove());
  roles.forEach(s => {
    const tag = document.createElement('span');
    tag.className = 'skill-tag';
    tag.innerHTML = `${s}<span onclick="removeRole('${s}')">×</span>`;
    wrap.insertBefore(tag, inp);
  });
}

function removeRole(s) {
  roles = roles.filter(k => k !== s);
  renderRoles();
}

/* UTILS */
function showToast(msg, bg = '#059669') {
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:24px;right:24px;background:${bg};color:white;padding:12px 24px;border-radius:8px;box-shadow:0 8px 16px rgba(0,0,0,0.1);z-index:9999;transition:all 0.4s ease;`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(10px)'; setTimeout(() => t.remove(), 400); }, 3000);
}
