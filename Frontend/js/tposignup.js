/* STATE */
let currentStage = 2;
let resendTimer = null;
let generatedOtp = '';
let otpExpiry = null;
const OTP_TTL_MS = 10 * 60 * 1000;
const API_BASE = 'http://127.0.0.1:5000';

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

    /* ✅ EmailJS — sends OTP directly from browser, no server needed */
    async function sendOtpEmail(toEmail, toName, otp) {
  const res = await fetch('http://localhost:5000/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: toEmail, name: toName, otp: otp })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res;
}

/* NAVIGATION */
function goTo(stage) {
  const curId = 'stage-' + currentStage;
  const el = document.getElementById(curId);
  if (el) el.classList.remove('active');

  currentStage = stage;
  const newId = 'stage-' + stage;
  const newEl = document.getElementById(newId);
  if (newEl) newEl.classList.add('active');

  updateSidebar(stage);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateSidebar(stage) {
  const pcts = ['25%', '50%', '75%', '100%'];
  document.getElementById('prog-fill').style.width = pcts[stage - 1];
  document.getElementById('prog-pct').textContent = pcts[stage - 1];
  document.getElementById('prog-lbl').textContent = 'Step ' + stage + ' of 4';

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
    }
  }
}

/* VALIDATION */
function validateStage2() {
  let ok = true;
  const checks = [
    { id: 't-name',        err: 'err-t-name',        test: v => v.trim().length >= 2 },
    { id: 't-email',       err: 'err-t-email',       test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
    { id: 't-phone',       err: 'err-t-phone',       test: v => v.replace(/\D/g, '').length >= 10 },
    { id: 't-designation', err: 'err-t-designation', test: v => v !== '' },
    { id: 't-college',     err: 'err-t-college',     test: v => v.trim().length >= 2 },
    { id: 't-location',    err: 'err-t-location',    test: v => v.trim().length >= 2 },
    { id: 't-code',        err: 'err-t-code',        test: v => v.trim().length >= 4 },
    { id: 't-pwd',         err: 'err-t-pwd',         test: v => v.length >= 8 }
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

  return ok;
}

function clearErr(el) {
  el.classList.remove('error');
  const err = document.getElementById('err-' + el.id);
  if (err) err.classList.remove('show');
}

/* OTP HELPERS */
function showOtpLoading(show) {
  document.getElementById('otp-sending-state').style.display = show ? 'block' : 'none';
  document.getElementById('otp-entry-state').style.display  = show ? 'none'  : 'block';
}

async function goNext(stage, e) {
  if (e) e.preventDefault();
  if (stage === 2) {
    if (!validateStage2()) return;

    const email   = document.getElementById('t-email').value;
    const name    = document.getElementById('t-name').value;
    document.getElementById('verify-email-show').textContent = email;

    const nextBtn = document.querySelector('#stage-2 .btn-next');
    if (nextBtn) { nextBtn.disabled = true; nextBtn.style.opacity = '0.85'; }

    try {
      generatedOtp = generateOtp();
      otpExpiry    = Date.now() + OTP_TTL_MS;

      // Switch to stage 3 and show spinner immediately
      goTo(3);
      showOtpLoading(true);

      const resp = await fetch(`${API_BASE}/send-email`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, name, otp: generatedOtp })
      });
      if (!resp.ok) throw new Error('Server error while sending OTP');
      const data = await resp.json();
      if (!data?.success) throw new Error(data?.message || 'OTP email failed');

      // Hide spinner, reveal OTP input boxes
      showOtpLoading(false);
      showToast('✅ OTP sent to your email');
      startResendTimer();

    } catch (err) {
      console.error(err);
      // Still show the OTP form even if email failed (so user isn't stuck)
      showOtpLoading(false);
      showToast('⚠️ Could not send OTP email. Please try again.', '#ef4444');
    } finally {
      if (nextBtn) { nextBtn.disabled = false; nextBtn.style.opacity = ''; }
    }
  }
}

function startResendTimer() {
  let count = 30;
  document.getElementById('timer-badge').style.display  = 'inline-flex';
  document.getElementById('resend-show').style.display  = 'none';

  clearInterval(resendTimer);
  resendTimer = setInterval(() => {
    count--;
    const el = document.getElementById('timer-count');
    if (el) el.textContent = count;
    if (count <= 0) {
      clearInterval(resendTimer);
      document.getElementById('timer-badge').style.display = 'none';
      document.getElementById('resend-show').style.display = 'inline';
    }
  }, 1000);
}

const otpInputs = document.querySelectorAll('.otp-input');
function otpMove(el, idx) {
  if (el.value && idx < 5) otpInputs[idx + 1].focus();
  const ev = window.event;
  if (ev && ev.key === 'Backspace' && !el.value && idx > 0) otpInputs[idx - 1].focus();
}

async function verifyOtp() {
  const otp = Array.from(otpInputs).map(i => i.value).join('');
  if (otp.length < 6) {
    showToast('⚠️ Please enter all 6 digits.', '#ef4444');
    return;
  }

  const spinner = document.getElementById('verify-spinner');
  spinner.style.display = 'inline-block';

  try {
    const body = {
      fullName:      document.getElementById('t-name').value,
      email:         document.getElementById('t-email').value,
      password:      document.getElementById('t-pwd').value,
      phone:         document.getElementById('t-phone').value,
      designation:   document.getElementById('t-designation').value,
      department:    document.getElementById('t-dept').value,
      college:       document.getElementById('t-college').value,
      location:      document.getElementById('t-location').value,
      collegeCode:   document.getElementById('t-code').value,
      accreditation: document.getElementById('t-accreditation').value,
      about:         document.getElementById('t-about').value,
      otp:           otp
    };

    const resp = await fetch(`${API_BASE}/api/tpo/signup`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body)
    });

    if (!resp.ok) throw new Error('Server error');
    const res = await resp.json();

    if (res?.success) {
      const tpo      = res.tpo || {};
      const fullName = tpo.fullName || body.fullName;
      const email    = tpo.email    || body.email;
      const college  = tpo.college  || body.college;
      const id       = tpo.id || tpo._id || tpo.tpoId;

      setSession({ role: 'tpo', name: fullName, email, id, college });

      showToast('🎉 TPO Registration Successful!');
      goTo(4);
      setTimeout(() => { window.location.href = 'TPODashboard.html'; }, 900);
    } else {
      const errEl = document.getElementById('otp-error');
      errEl.textContent    = res.message || 'Invalid OTP. Please try again.';
      errEl.style.display  = 'block';
    }
  } catch (err) {
    console.error(err);
    showToast('❌ Server error during signup', '#ef4444');
  } finally {
    spinner.style.display = 'none';
  }
}

function resendOtp() {
  // Clear existing OTP boxes
  otpInputs.forEach(i => { i.value = ''; i.classList.remove('filled'); });
  document.getElementById('otp-error').style.display = 'none';
  goNext(2);
}

function goBackToStage2() {
  clearInterval(resendTimer);
  goTo(2);
}

function showToast(msg, bg = '#7c3aed') {
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:24px;right:24px;background:${bg};color:white;padding:12px 24px;border-radius:8px;box-shadow:0 8px 16px rgba(0,0,0,0.1);z-index:9999;font-family:inherit;font-size:14px;font-weight:500;`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}