/* ── company-login.js ── */

async function doLogin(role, event) {
  if (event) event.preventDefault();

  const emailMap = { company: 'cl-email' };
  const companyMap = { company: 'cl-company' };
  const pwdMap = { company: 'cl-pwd' };

  const emailEl = document.getElementById(emailMap[role]);
  const companyEl = document.getElementById(companyMap[role]);
  const pwdEl = document.getElementById(pwdMap[role]);
  const errBox = document.getElementById('login-err-' + role);
  const spinner = document.getElementById('spin-' + role);

  if (!emailEl || !companyEl || !pwdEl || !errBox || !spinner) {
    console.error('Required elements not found for company login');
    return;
  }

  let ok = true;
  errBox.style.display = 'none';
  [emailEl, companyEl, pwdEl].forEach(el => el.classList.remove('err'));

  // Validate
  if (!emailEl.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
    emailEl.classList.add('err');
    const err = document.getElementById('err-' + emailMap[role]);
    if (err) err.classList.add('show');
    ok = false;
  }
  if (!companyEl.value) {
    companyEl.classList.add('err');
    const err = document.getElementById('err-' + companyMap[role]);
    if (err) err.classList.add('show');
    ok = false;
  }
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
    
    const response = await fetch(`${API_ROOT}/api/companies/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailEl.value.trim(),
        password: pwdEl.value,
        companyName: companyEl.value.trim()
      })
    });

    if (!response.ok) throw new Error('Server error');
    const result = await response.json();

    if (result.success) {
      const company = result.company || {};
      const companyName = company.companyName || companyEl.value.trim();
      const email = company.email || emailEl.value.trim();
      const id = company.id || company._id || company.companyId;

      sessionStorage.setItem('isLoggedIn', 'true');
      sessionStorage.setItem('userRole', 'company');
      sessionStorage.setItem('companyId', String(id));
      sessionStorage.setItem('companyName', companyName);
      sessionStorage.setItem('companyEmail', email);
      
      showSuccess(role, emailEl.value);
    } else {
      errBox.textContent = '❌ ' + (result.message || 'Invalid email or password.');
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

  const titles = { company: 'Welcome Back! 🏢' };
  const subs = { company: `Signed in as ${email}. Redirecting to your recruiter dashboard…` };
  const ctas = { company: 'Go to Recruiter Dashboard →' };

  document.getElementById('success-title').textContent = titles[role] || titles.company;
  document.getElementById('success-sub').textContent = subs[role] || subs.company;
  const successCta = document.getElementById('success-cta');
  if (successCta) {
    successCta.textContent = ctas[role] || ctas.company;
    successCta.href = 'CompanyDashboard.html';
    
    setTimeout(() => {
      window.location.href = 'CompanyDashboard.html';
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
