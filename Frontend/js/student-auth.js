/* ── DO LOGIN ── */
async function doLogin(role, event) {
  if (event) event.preventDefault();

  const emailMap = { student: 'sl-email' };
  const pwdMap = { student: 'sl-pwd' };

  const emailEl = document.getElementById(emailMap[role]);
  const pwdEl = document.getElementById(pwdMap[role]);
  const errBox = document.getElementById('login-err-' + role);
  const spinner = document.getElementById('spin-' + role);

  if (!emailEl || !pwdEl || !errBox || !spinner) {
    console.error('Required elements not found');
    return;
  }

  let ok = true;
  errBox.style.display = 'none';
  emailEl.classList.remove('error');
  pwdEl.classList.remove('error');

  // Validate email
  if (!emailEl.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
    emailEl.classList.add('error');
    const emailErr = document.getElementById('err-' + emailMap[role]);
    if (emailErr) emailErr.classList.add('show');
    ok = false;
  }
  // Validate password
  if (!pwdEl.value) {
    pwdEl.classList.add('error');
    const pwdErr = document.getElementById('err-' + pwdMap[role]);
    if (pwdErr) pwdErr.classList.add('show');
    ok = false;
  }
  
  if (!ok) return;

  // Show spinner
  spinner.style.display = 'block';
  const btn = spinner.parentElement;
  btn.disabled = true;

  try {
    console.log(`Attempting login for ${role}: ${emailEl.value}`);
    
    // Explicitly targeting port 5000 for the team's standard
    const response = await fetch('http://localhost:5000/api/students/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: emailEl.value,
        password: pwdEl.value
      })
    });

    const result = await response.json();
    console.log('Login result:', result);

    if (result.success) {
      // Store student data in session
      sessionStorage.setItem('isLoggedIn', 'true');
      sessionStorage.setItem('userRole', role); // Use the role passed in
      sessionStorage.setItem('studentName', result.student.fullName);
      sessionStorage.setItem('studentEmail', result.student.email);
      
      showSuccess(role, emailEl.value);
    } else {
      errBox.textContent = '❌ ' + (result.message || 'Invalid email or password.');
      errBox.style.display = 'block';
    }
  } catch (error) {
    console.error('Login Error:', error);
    errBox.textContent = '❌ Could not connect to server. Please check if the backend is running.';
    errBox.style.display = 'block';
  } finally {
    spinner.style.display = 'none';
    btn.disabled = false;
  }
}

/* ── SUCCESS ── */
function showSuccess(role, email) {
  const stage2 = document.getElementById('stage-2-' + role);
  const stage3 = document.getElementById('stage-3');
  
  if (stage2) stage2.classList.remove('active');
  if (stage3) stage3.classList.add('active');

  const titles = {
    student: 'Welcome Back! 👋',
  };
  const subs = {
    student: `Signed in as ${email}. Redirecting to your student dashboard…`,
  };
  const ctas = {
    student: 'Go to Student Dashboard →',
  };

  const titleEl = document.getElementById('success-title');
  const subEl = document.getElementById('success-sub');
  const successCta = document.getElementById('success-cta');

  if (titleEl) titleEl.textContent = titles[role];
  if (subEl) subEl.textContent = subs[role];
  
  if (successCta) {
    successCta.textContent = ctas[role];
    if (role === 'student') {
      successCta.href = 'StudentDashboard.html';
      // Redirect automatically
      setTimeout(() => {
        window.location.href = 'StudentDashboard.html';
      }, 1500);
    } else {
      successCta.href = '#';
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── FORGOT PASSWORD ── */
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

/* ── HELPERS ── */
function togglePwd(id, btn) {
  const inp = document.getElementById(id);
  if (!inp) return;
  if (inp.type === 'password') { 
    inp.type = 'text'; 
    btn.textContent = '🙈'; 
  } else { 
    inp.type = 'password'; 
    btn.textContent = '👁'; 
  }
}

function clearErr(el) {
  el.classList.remove('error');
  const errEl = document.getElementById('err-' + el.id);
  if (errEl) errEl.classList.remove('show');
}
