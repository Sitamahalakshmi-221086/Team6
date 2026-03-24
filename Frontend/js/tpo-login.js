/* ── tpo-login.js ── */

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

  if (!emailEl || !pwdEl || !collegeEl || !errBox || !spinner) {
    console.error('Required elements not found for TPO login');
    return;
  }

  let ok = true;
  errBox.style.display = 'none';

  // Validate email
  if (!emailEl.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
    emailEl.classList.add('err');
    const err = document.getElementById('err-' + emailMap[role]);
    if (err) err.classList.add('show');
    ok = false;
  }
  // Validate college
  if (!collegeEl.value) {
    collegeEl.classList.add('err');
    const err = document.getElementById('err-' + collegeMap[role]);
    if (err) err.classList.add('show');
    ok = false;
  }
  // Validate password
  if (!pwdEl.value) {
    pwdEl.classList.add('err');
    const err = document.getElementById('err-' + pwdMap[role]);
    if (err) err.classList.add('show');
    ok = false;
  }
  if (!ok) return;

  // Show spinner
  spinner.style.display = 'block';
  const btn = spinner.parentElement;
  btn.disabled = true;

  try {
    const API_ROOT = (window.CAMPUS_API_BASE || 'http://localhost:5001').replace(/\/$/, '');
    
    const response = await fetch(`${API_ROOT}/api/tpo/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailEl.value.trim(),
        password: pwdEl.value
      })
    });

    if (!response.ok) throw new Error('Server error');
    const result = await response.json();

    if (result.success) {
      const tpo = result.tpo || {};
      const fullName = tpo.fullName || '';
      const email = tpo.email || emailEl.value.trim();
      const college = tpo.college || collegeEl.value.trim();
      const id = tpo.id || tpo._id || tpo.tpoId;

      sessionStorage.setItem('isLoggedIn', 'true');
      sessionStorage.setItem('userRole', 'tpo');
      sessionStorage.setItem('tpoId', String(id));
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
    errBox.textContent = '❌ Could not connect to server at port 5001.';
    errBox.style.display = 'block';
  } finally {
    spinner.style.display = 'none';
    btn.disabled = false;
  }
}

function showSuccess(role, email) {
  const stage2 = document.getElementById('stage-2-' + role);
  const stage3 = document.getElementById('stage-3');
  
  if (stage2) stage2.classList.remove('active');
  if (stage3) stage3.classList.add('active');

  const titles = { tpo: 'Welcome Back! 🛡️' };
  const subs = { tpo: `Signed in as ${email}. Redirecting to your TPO dashboard…` };
  const ctas = { tpo: 'Go to TPO Dashboard →' };

  const titleEl = document.getElementById('success-title');
  const subEl = document.getElementById('success-sub');
  const successCta = document.getElementById('success-cta');

  if (titleEl) titleEl.textContent = titles[role] || titles.tpo;
  if (subEl) subEl.textContent = subs[role] || subs.tpo;
  
  if (successCta) {
    successCta.textContent = ctas[role] || ctas.tpo;
    successCta.href = 'TPODashboard.html';
    
    setTimeout(() => {
      window.location.href = 'TPODashboard.html';
    }, 1500);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showForgot(role) {
  const panel = document.getElementById('forgot-' + role);
  if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function sendReset(btn) {
  const input = btn.previousElementSibling;
  if (!input || !input.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
    if (input) input.style.borderColor = '#ef4444';
    setTimeout(() => { if (input) input.style.borderColor = ''; }, 1500);
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

function togglePwd(id, btn) {
  const inp = document.getElementById(id);
  if (!inp) return;
  const isPwd = inp.type === 'password';
  inp.type = isPwd ? 'text' : 'password';
  btn.textContent = isPwd ? '🙈' : '👁';
}

function clearErr(el) {
  el.classList.remove('err');
  const errEl = document.getElementById('err-' + el.id);
  if (errEl) errEl.classList.remove('show');
}
