let currentStage = 2;
let resendTimer = null;
const SERVER_URL = 'http://127.0.0.1:5000';
window._currentOtp = null;
window._pendingTpoData = null;

async function goNext(from, btn) {
  if (from === 2) {
    if (!validateStage2()) return;

    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Sending OTP...';
    btn.disabled = true;

    const tpoData = {
      fullName:    document.getElementById('t-name').value,
      email:       document.getElementById('t-email').value,
      password:    document.getElementById('t-pwd').value,
      phone:       document.getElementById('t-phone').value,
      college:     document.getElementById('t-college').value,
      designation: document.getElementById('t-designation').value,
      department:  document.getElementById('t-dept').value,
      location:    document.getElementById('t-location').value,
      collegeCode: document.getElementById('t-code').value,
      accreditation: document.getElementById('t-accreditation').value,
      about:       document.getElementById('t-about').value,
    };

    try {
      window._pendingTpoData = tpoData;
      const emailResponse = await fetch(`${SERVER_URL}/api/tpo/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: tpoData.email, name: tpoData.fullName })
      });

      const emailResult = await emailResponse.json();
      if (!emailResult.success) {
        alert(emailResult.message || 'Failed to send OTP email. Please try again.');
        return;
      }

      document.getElementById('verify-email-show').textContent = tpoData.email;
      goTo(3);
      startResendTimer();

    } catch (error) {
      console.error('Error sending OTP:', error);
      alert('Could not connect to the server. Please try again later.');
    } finally {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }
  }
}

function goTo(stage) {
  const curEl = document.getElementById('stage-' + (currentStage === 2 ? '2-tpo' : currentStage));
  if (curEl) curEl.classList.remove('active');
  currentStage = stage;
  const nextEl = document.getElementById('stage-' + (stage === 2 ? '2-tpo' : stage));
  if (nextEl) nextEl.classList.add('active');
  updateSidebar(stage);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelector('#stage-3 .btn-prev').onclick = function () {
  currentStage = 3;
  goTo(2);
};

function updateSidebar(stage) {
  const pcts = ['25%', '50%', '75%', '100%'];
  document.getElementById('progress-bar').style.width = pcts[stage - 1];
  document.getElementById('progress-pct').textContent = pcts[stage - 1];
  document.getElementById('progress-step-label').textContent = 'Step ' + stage + ' of 4';
  for (let i = 1; i <= 4; i++) {
    const circle = document.getElementById('circle-' + i);
    const step = document.getElementById('sidebar-step-' + i);
    step.classList.remove('active-step', 'done-step');
    if (i < stage) { circle.className = 'step-circle done'; circle.textContent = '✓'; step.classList.add('done-step'); }
    else if (i === stage) { circle.className = 'step-circle active'; circle.textContent = i === 4 ? '✓' : i; step.classList.add('active-step'); }
    else { circle.className = 'step-circle pending'; circle.textContent = i === 4 ? '✓' : i; }
  }
}

function validateStage2() {
  let ok = true;
  const checks = [
    { id: 't-name',        err: 'err-t-name',        test: v => v.trim().length >= 2 },
    { id: 't-email',       err: 'err-t-email',       test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
    { id: 't-pwd',         err: 'err-t-pwd',         test: v => v.length >= 8 },
    { id: 't-phone',       err: 'err-t-phone',       test: v => v.replace(/\D/g, '').length >= 10 },
    { id: 't-college',     err: 'err-t-college',     test: v => v.trim().length >= 2 },
    { id: 't-designation', err: 'err-t-designation', test: v => v !== '' },
    { id: 't-location',    err: 'err-t-location',    test: v => v.trim().length >= 2 },
    { id: 't-code',        err: 'err-t-code',        test: v => v.trim().length >= 4 },
  ];
  checks.forEach(c => runCheck(c, () => ok = false));
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

function checkPwd(input, prefix, labelId) {
  const v = input.value;
  const bars = [1,2,3,4].map(i => document.getElementById(prefix + i));
  const lbl = document.getElementById(labelId);
  bars.forEach(b => { if (b) b.className = 'pwd-bar'; });
  if (!v) { lbl.textContent = 'Enter a password'; lbl.style.color = '#94a3b8'; return; }
  let score = 0;
  if (v.length >= 8) score++;
  if (/[A-Z]/.test(v)) score++;
  if (/[0-9]/.test(v)) score++;
  if (/[^A-Za-z0-9]/.test(v)) score++;
  const cls = score <= 1 ? 'weak' : score <= 2 ? 'fair' : 'strong';
  const texts = ['','Weak','Fair','Good','Strong'];
  const colors = ['','#ef4444','#f59e0b','#22c55e','#22c55e'];
  for (let i = 0; i < score; i++) bars[i].classList.add(cls);
  lbl.textContent = texts[score] || '';
  lbl.style.color = colors[score];
}

function togglePwd(id, btn) {
  const inp = document.getElementById(id);
  if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
  else { inp.type = 'password'; btn.textContent = '👁'; }
}

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

  errEl.style.display = 'none';
  if (otp.length < 6) { errEl.textContent = 'Please enter all 6 digits.'; errEl.style.display = 'block'; return; }

  try {
    const response = await fetch(`${SERVER_URL}/api/tpo/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: window._pendingTpoData.email, otp })
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
  } catch (err) {
    console.error('OTP Verification Error:', err);
    if (spinner) spinner.style.display = 'none';
    if (verifyBtn) verifyBtn.disabled = false;
    errEl.textContent = 'Verification error. Please try again.';
    errEl.style.display = 'block';
    return;
  }

  try {
    if (spinner) spinner.style.display = 'inline-block';
    if (verifyBtn) verifyBtn.disabled = true;

    const response = await fetch(`${SERVER_URL}/api/tpo/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(window._pendingTpoData)
    });
    const result = await response.json();
    if (result.success) {
      window._currentOtp = null;
      if (result.tpoId) {
        sessionStorage.setItem('tpoId', result.tpoId);
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userRole', 'tpo');
        const d = window._pendingTpoData;
        if (d) {
          sessionStorage.setItem('tpoName', d.fullName || '');
          sessionStorage.setItem('tpoEmail', d.email || '');
          sessionStorage.setItem('tpoCollege', d.college || '');
        }
      }
      window._pendingTpoData = null;
      goTo(4);
    } else {
      errEl.textContent = 'Registration failed: ' + (result.message || 'Unknown error');
      errEl.style.display = 'block';
    }
  } catch (error) {
    console.error('Registration error:', error);
    errEl.textContent = 'Server error during registration. Please try again.';
    errEl.style.display = 'block';
  } finally {
    if (spinner) spinner.style.display = 'none';
    if (verifyBtn) verifyBtn.disabled = false;
  }
}

function startResendTimer() {
  let t = 30;
  document.getElementById('resend-btn').style.display = 'none';
  document.getElementById('timer-badge').style.display = 'inline-flex';
  document.getElementById('timer-count').textContent = t;
  clearInterval(resendTimer);
  resendTimer = setInterval(() => {
    t--;
    document.getElementById('timer-count').textContent = t;
    if (t <= 0) {
      clearInterval(resendTimer);
      document.getElementById('resend-btn').style.display = 'inline';
      document.getElementById('timer-badge').style.display = 'none';
    }
  }, 1000);
}

async function resendOtp() {
  if (!window._pendingTpoData) { alert('Session expired. Please go back and fill the form again.'); goTo(2); return; }
  try {
    const res = await fetch(`${SERVER_URL}/api/tpo/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: window._pendingTpoData.email, name: window._pendingTpoData.fullName })
    });
    const result = await res.json();
    if (!result.success) showToast(result.message || 'Failed to resend OTP');
  } catch (err) { console.error('Resend error:', err); }
  const toast = document.createElement('div');
  toast.textContent = '✅ OTP resent to your email!';
  Object.assign(toast.style, { position:'fixed', bottom:'32px', left:'50%', transform:'translateX(-50%)', background:'#059669', color:'#fff', padding:'10px 24px', borderRadius:'100px', fontSize:'14px', fontWeight:'600', zIndex:'9999', boxShadow:'0 4px 16px rgba(5,150,105,.4)' });
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}
