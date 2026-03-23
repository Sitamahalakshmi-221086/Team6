  
    
    /* STATE */
    let currentStage = 2;
    let resendTimer  = null;
    let generatedOtp = '';
    let otpExpiry    = null;
    let isDevMode    = false;
    const OTP_TTL_MS = 10 * 60 * 1000;

    /* OTP helpers */
    function generateOtp() {
      return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /* ✅ EmailJS — sends OTP directly from browser, no server needed */
    async function sendOtpEmail(toEmail, toName, otp) {
  const res = await fetch('http://127.0.0.1:5000/send-email', {
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
    async function goNext(from) {
      if (from !== 2) return;
      if (!validateStage2()) return;

      const email = document.getElementById('t-email').value.trim();
      const name  = document.getElementById('t-name').value.trim();
      const btn   = document.getElementById('btn-send-otp');

      document.getElementById('verify-email-show').textContent = email;
      showStage3Sending(true);
      goTo(3);
      btn.disabled = true;

      generatedOtp = generateOtp();
      otpExpiry    = Date.now() + OTP_TTL_MS;

      try {
        await sendOtpEmail(email, name, generatedOtp);
        isDevMode = false;
        document.getElementById('demo-mode-banner').style.display = 'none';
        document.getElementById('dev-otp-display').style.display  = 'none';
        document.getElementById('otp-sent-badge').style.display   = 'inline-block';
        showToast('✅ OTP sent to ' + email, '#7c3aed');
      } catch (err) {
        console.warn('EmailJS error:', err);
        isDevMode = true;
        document.getElementById('demo-mode-banner').style.display = 'flex';
        document.getElementById('dev-otp-display').style.display  = 'block';
        document.getElementById('dev-otp-value').textContent      = generatedOtp;
        document.getElementById('otp-sent-badge').style.display   = 'none';
        showToast('⚠️ EmailJS not reachable – using dev mode', '#f59e0b', 4000);
      }

      showStage3Sending(false);
      startResendTimer();
      btn.disabled = false;
    }

    function showStage3Sending(isSending) {
      document.getElementById('otp-sending-state').style.display = isSending ? 'flex' : 'none';
      document.getElementById('otp-entry-state').style.display   = isSending ? 'none' : 'block';
    }

    function goBackToStage2() {
      clearInterval(resendTimer);
      otpInputs.forEach(i => { i.value = ''; i.style.borderColor = ''; });
      document.getElementById('otp-error').style.display      = 'none';
      document.getElementById('otp-entry-state').style.display = 'none';
      currentStage = 3;
      goTo(2);
    }

    function goTo(stage) {
      const curId = currentStage === 2 ? 'stage-2-tpo' : 'stage-' + currentStage;
      const el = document.getElementById(curId);
      if (el) el.classList.remove('active');
      currentStage = stage;
      const newId = stage === 2 ? 'stage-2-tpo' : 'stage-' + stage;
      document.getElementById(newId).classList.add('active');
      updateSidebar(stage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function updateSidebar(stage) {
      const pcts = ['25%', '50%', '75%', '100%'];
      document.getElementById('progress-bar').style.width        = pcts[stage - 1];
      document.getElementById('progress-pct').textContent        = pcts[stage - 1];
      document.getElementById('progress-step-label').textContent = 'Step ' + stage + ' of 4';
      for (let i = 1; i <= 4; i++) {
        const circle = document.getElementById('circle-' + i);
        const step   = document.getElementById('sidebar-step-' + i);
        step.classList.remove('active-step', 'done-step');
        if (i < stage) {
          circle.className = 'step-circle done'; circle.textContent = '✓'; step.classList.add('done-step');
        } else if (i === stage) {
          circle.className = 'step-circle active'; circle.textContent = i === 4 ? '✓' : i; step.classList.add('active-step');
        } else {
          circle.className = 'step-circle pending'; circle.textContent = i === 4 ? '✓' : i;
        }
      }
    }

    /* VALIDATION */
    function validateStage2() {
      let ok = true;
      const checks = [
        { id: 't-name',        err: 'err-t-name',        test: v => v.trim().length >= 2 },
        { id: 't-email',       err: 'err-t-email',       test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
        { id: 't-pwd',         err: 'err-t-pwd',         test: v => v.length >= 8 },
        { id: 't-phone',       err: 'err-t-phone',       test: v => v.replace(/\D/g,'').length >= 10 },
        { id: 't-college',     err: 'err-t-college',     test: v => v.trim().length >= 2 },
        { id: 't-designation', err: 'err-t-designation', test: v => v !== '' },
        { id: 't-location',    err: 'err-t-location',    test: v => v.trim().length >= 2 },
      ];
      checks.forEach(c => runCheck(c, () => ok = false));
      if (!ok) document.querySelector('.error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return ok;
    }

    function runCheck(c, fail) {
      const el    = document.getElementById(c.id);
      const errEl = document.getElementById(c.err);
      if (!el || !errEl) return;
      if (!c.test(el.value)) { el.classList.add('error'); errEl.classList.add('show'); fail(); }
    }

    function clearErr(el) {
      el.classList.remove('error');
      const errEl = document.getElementById('err-' + el.id);
      if (errEl) errEl.classList.remove('show');
    }

    /* PASSWORD */
    function checkPwd(input, prefix, labelId) {
      const v    = input.value;
      const bars = [1,2,3,4].map(i => document.getElementById(prefix + i));
      const lbl  = document.getElementById(labelId);
      bars.forEach(b => { if (b) b.className = 'pwd-bar'; });
      if (!v) { lbl.textContent = 'Enter a password'; lbl.style.color = '#94a3b8'; return; }
      let score = 0;
      if (v.length >= 8) score++;
      if (/[A-Z]/.test(v)) score++;
      if (/[0-9]/.test(v)) score++;
      if (/[^A-Za-z0-9]/.test(v)) score++;
      const cls    = score <= 1 ? 'weak' : score <= 2 ? 'fair' : 'strong';
      const texts  = ['', 'Weak', 'Fair', 'Good', 'Strong'];
      const colors = ['', '#ef4444', '#f59e0b', '#22c55e', '#22c55e'];
      for (let i = 0; i < score; i++) bars[i].classList.add(cls);
      lbl.textContent = texts[score] || '';
      lbl.style.color = colors[score];
    }

    function togglePwd(id, btn) {
      const inp = document.getElementById(id);
      if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
      else { inp.type = 'password'; btn.textContent = '👁'; }
    }

    /* OTP VERIFY */
    const otpInputs = document.querySelectorAll('.otp-input');

    function otpMove(el, idx) {
      if (el.value && idx < 5) otpInputs[idx + 1].focus();
      if (event.key === 'Backspace' && !el.value && idx > 0) otpInputs[idx - 1].focus();
    }

    function verifyOtp() {
      const otp     = Array.from(otpInputs).map(i => i.value).join('');
      const spinner = document.getElementById('verify-spinner');
      const errEl   = document.getElementById('otp-error');
      errEl.style.display = 'none';
      errEl.style.color   = '#ef4444';

      if (otp.length < 6) { errEl.textContent = 'Please enter all 6 digits.'; errEl.style.display = 'block'; return; }

      if (Date.now() > otpExpiry) {
        errEl.textContent   = '⏰ OTP has expired. Please resend.';
        errEl.style.display = 'block';
        otpInputs.forEach(i => { i.value = ''; i.style.borderColor = '#ef4444'; });
        setTimeout(() => otpInputs.forEach(i => i.style.borderColor = ''), 1200);
        otpInputs[0].focus();
        return;
      }

      spinner.style.display = 'block';
      document.getElementById('verify-btn').disabled = true;

      setTimeout(() => {
        spinner.style.display = 'none';
        document.getElementById('verify-btn').disabled = false;
        if (otp === generatedOtp) {
          clearInterval(resendTimer);
          showToast('🎉 Email verified!', '#7c3aed');
          goTo(4);
        } else {
          errEl.textContent   = '❌ Incorrect OTP. Please check your email and try again.';
          errEl.style.display = 'block';
          otpInputs.forEach(i => { i.value = ''; i.style.borderColor = '#ef4444'; });
          otpInputs[0].focus();
          setTimeout(() => otpInputs.forEach(i => i.style.borderColor = ''), 1200);
        }
      }, 800);
    }

    /* RESEND */
    function startResendTimer(seconds = 30) {
      let t = seconds;
      document.getElementById('resend-btn').style.display  = 'none';
      document.getElementById('timer-badge').style.display = 'inline-flex';
      document.getElementById('timer-count').textContent   = t;
      clearInterval(resendTimer);
      resendTimer = setInterval(() => {
        t--;
        document.getElementById('timer-count').textContent = t;
        if (t <= 0) {
          clearInterval(resendTimer);
          document.getElementById('resend-btn').style.display  = 'inline';
          document.getElementById('timer-badge').style.display = 'none';
        }
      }, 1000);
    }

    async function resendOtp() {
      const email = document.getElementById('t-email').value.trim();
      const name  = document.getElementById('t-name').value.trim();
      const btn   = document.getElementById('resend-btn');

      btn.disabled = true;
      otpInputs.forEach(i => { i.value = ''; i.style.borderColor = ''; });
      document.getElementById('otp-error').style.display = 'none';

      generatedOtp = generateOtp();
      otpExpiry    = Date.now() + OTP_TTL_MS;

      try {
        await sendOtpEmail(email, name, generatedOtp);
        isDevMode = false;
        document.getElementById('dev-otp-display').style.display  = 'none';
        document.getElementById('demo-mode-banner').style.display = 'none';
        document.getElementById('otp-sent-badge').style.display   = 'inline-block';
        showToast('✅ New OTP sent to ' + email, '#7c3aed');
      } catch (err) {
        isDevMode = true;
        document.getElementById('dev-otp-value').textContent      = generatedOtp;
        document.getElementById('dev-otp-display').style.display  = 'block';
        document.getElementById('demo-mode-banner').style.display = 'flex';
        showToast('⚠️ Email send failed – using dev mode', '#f59e0b', 4000);
      }

      btn.disabled = false;
      startResendTimer();
      otpInputs[0].focus();
    }

    /* TOAST */
    function showToast(msg, bg = '#7c3aed', duration = 2500) {
      const toast = document.createElement('div');
      toast.className        = 'toast';
      toast.textContent      = msg;
      toast.style.background = bg;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), duration);
    }
  
