/* ── DO LOGIN ── */
async function doLogin(role, event) {
  if (event) event.preventDefault();
  const emailMap = { tpo: 'tl-email' };
  const pwdMap = { tpo: 'tl-pwd' };
  const collegeMap = { tpo: 'tl-college' };

  const emailEl = document.getElementById(emailMap[role]);
  const pwdEl = document.getElementById(pwdMap[role]);
  const collegeEl = document.getElementById(collegeMap[role]);
  const errBox = document.getElementById('login-err-' + role);
  const spinner = document.getElementById('spin-' + role);

  let ok = true;
  errBox.style.display = 'none';

  // Validate email
  if (!emailEl.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
    emailEl.classList.add('err');
    document.getElementById('err-' + emailMap[role]).classList.add('show');
    ok = false;
  }
  // Validate college
  if (!collegeEl.value) {
    collegeEl.classList.add('err');
    document.getElementById('err-' + collegeMap[role]).classList.add('show');
    ok = false;
  }
  // Validate password
  if (!pwdEl.value) {
    pwdEl.classList.add('err');
    document.getElementById('err-' + pwdMap[role]).classList.add('show');
    ok = false;
  }
  if (!ok) return;

  // Show spinner
  spinner.style.display = 'block';
  const btn = spinner.parentElement;
  btn.disabled = true;

  try {
    const response = await fetch('http://127.0.0.1:5000/api/tpo/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailEl.value.trim(),
        password: pwdEl.value
      })
    });

    if (!response.ok) throw new Error('Server error');
    const result = await response.json();

    spinner.style.display = 'none';
    btn.disabled = false;

    if (result.success) {
      const tpo = result.tpo || {};
      const fullName = tpo.fullName || '';
      const email = tpo.email || emailEl.value.trim();
      const college = tpo.college || collegeEl.value.trim();
      const id = tpo.id || tpo._id || tpo.tpoId;

      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userRole', 'tpo');
      localStorage.setItem('userName', fullName);
      localStorage.setItem('userEmail', email);
      if (id) localStorage.setItem('userId', String(id));

      localStorage.setItem('tpoName', fullName);
      localStorage.setItem('tpoEmail', email);
      localStorage.setItem('tpoCollege', college);

      sessionStorage.setItem('isLoggedIn', 'true');
      sessionStorage.setItem('userRole', 'tpo');
      sessionStorage.setItem('tpoName', fullName);
      sessionStorage.setItem('tpoEmail', email);
      sessionStorage.setItem('tpoCollege', college);
      
      showSuccess(role, emailEl.value);
    } else {
      errBox.textContent = '❌ ' + (result.message || 'Invalid credentials.');
      errBox.style.display = 'block';
    }
  } catch (error) {
    console.error('Login Error:', error);
    spinner.style.display = 'none';
    btn.disabled = false;
    errBox.textContent = '❌ Login failed. Please try again.';
    errBox.style.display = 'block';
  }
}

/* ── SUCCESS ── */
function showSuccess(role, email) {
  document.getElementById('stage-2-' + role).classList.remove('active');
  document.getElementById('stage-3').classList.add('active');

  const titles = {
    tpo: 'Welcome Back! 🛡️',
  };
  const subs = {
    tpo: `Signed in as ${email}. Redirecting to your TPO dashboard…`,
  };
  const ctas = {
    tpo: 'Go to TPO Dashboard →',
  };

  document.getElementById('success-title').textContent = titles[role];
  document.getElementById('success-sub').textContent = subs[role];
  const successCta = document.getElementById('success-cta');
  successCta.textContent = ctas[role];


  if (role === 'tpo') {
    successCta.href = 'TPODashboard.html';
    successCta.classList.remove('student', 'company');
    successCta.classList.add('tpo');

    // redirect automatically for better UX
    setTimeout(() => {
      window.location.href = 'TPODashboard.html';
    }, 1500)
  } else {
    successCta.href = '#';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── FORGOT PASSWORD ── */
function showForgot(role) {
  const panel = document.getElementById('forgot-' + role);
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function sendReset(btn) {
  const input = btn.previousElementSibling;
  if (!input.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
    input.style.borderColor = '#ef4444';
    setTimeout(() => input.style.borderColor = '', 1500);
    return;
  }
  btn.textContent = 'Sending…';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = '✅ Reset link sent!';
    btn.style.background = '#059669';
    setTimeout(() => {
      btn.textContent = 'Send Reset Link';
      btn.style.background = '';
      btn.disabled = false;
      input.value = '';
    }, 3000);
  }, 1000);
}

/* ── HELPERS ── */
function togglePwd(id, btn) {
  const inp = document.getElementById(id);
  if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
  else { inp.type = 'password'; btn.textContent = '👁'; }
}

function clearErr(el) {
  el.classList.remove('err');
  const errEl = document.getElementById('err-' + el.id);
  if (errEl) errEl.classList.remove('show');
}
