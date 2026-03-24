let selectedRole = '';

/* ─── THEME CONFIGS — exactly matching each dashboard ─── */
const T = {
  student: {
    panelGrad: 'linear-gradient(160deg, #1e3a8a 0%, #1d4ed8 60%, #0891b2 100%)',
    stripGrad: 'linear-gradient(90deg, #1e3a8a, #0891b2)',
    accent: '#2563eb', accentDark: '#1e3a8a', accentLight: '#eff6ff',
    accentRing: 'rgba(37,99,235,.12)',
    shimmer: 'linear-gradient(90deg,#1e3a8a 0%,#2563eb 40%,#0891b2 60%,#1e3a8a 100%)',
    logoColor: '#67e8f9', accent3: '#67e8f9',
    badge: '🎓 Student Portal',
    ph3: 'Student',
    sub: 'Access jobs, track applications and manage your placement journey.',
    cardBorder: '#2563eb', cardBg: '#eff6ff', cardShadow: '0 0 0 4px rgba(37,99,235,.12)',
    successBg: 'linear-gradient(135deg,#1e3a8a,#2563eb)',
    successShadow: 'rgba(30,58,138,.3)',
  },
  company: {
    panelGrad: 'linear-gradient(160deg, #134e4a 0%, #0f766e 60%, #0d9488 100%)',
    stripGrad: 'linear-gradient(90deg, #134e4a, #0d9488)',
    accent: '#0d9488', accentDark: '#0f766e', accentLight: '#f0fdfa',
    accentRing: 'rgba(13,148,136,.12)',
    shimmer: 'linear-gradient(90deg,#134e4a 0%,#0d9488 40%,#14b8a6 60%,#134e4a 100%)',
    logoColor: '#5eead4', accent3: '#5eead4',
    badge: '🏢 Recruiter Portal',
    ph3: 'Recruiter',
    sub: 'Post jobs, browse top talent and manage your campus drive pipeline.',
    cardBorder: '#0d9488', cardBg: '#f0fdfa', cardShadow: '0 0 0 4px rgba(13,148,136,.12)',
    successBg: 'linear-gradient(135deg,#134e4a,#0d9488)',
    successShadow: 'rgba(13,148,136,.3)',
  },
  tpo: {
    panelGrad: 'linear-gradient(160deg, #4c1d95 0%, #6d28d9 60%, #7c3aed 100%)',
    stripGrad: 'linear-gradient(90deg, #4c1d95, #7c3aed)',
    accent: '#7c3aed', accentDark: '#6d28d9', accentLight: '#f5f3ff',
    accentRing: 'rgba(124,58,237,.12)',
    shimmer: 'linear-gradient(90deg,#4c1d95 0%,#7c3aed 40%,#a78bfa 60%,#4c1d95 100%)',
    logoColor: '#ddd6fe', accent3: '#ddd6fe',
    badge: '🛡️ TPO / Admin Portal',
    ph3: 'TPO Admin',
    sub: 'Oversee student placements, approve drives and coordinate with recruiters.',
    cardBorder: '#7c3aed', cardBg: '#f5f3ff', cardShadow: '0 0 0 4px rgba(124,58,237,.12)',
    successBg: 'linear-gradient(135deg,#4c1d95,#7c3aed)',
    successShadow: 'rgba(124,58,237,.3)',
  },
};

function applyTheme(role) {
  const t = T[role];
  const root = document.documentElement;

  /* Panel gradient */
  const leftPanel = document.getElementById('left-panel');
  if (leftPanel) leftPanel.style.background = t.panelGrad;
  
  /* Top strip */
  const envStrip = document.getElementById('env-strip');
  if (envStrip) envStrip.style.background = t.stripGrad;
  
  /* CSS vars for form accents */
  root.style.setProperty('--accent', t.accent);
  root.style.setProperty('--accent-dark', t.accentDark);
  root.style.setProperty('--accent-light', t.accentLight);
  root.style.setProperty('--accent-ring', t.accentRing);
  
  /* Shimmer texts */
  document.querySelectorAll('.shimmer-text').forEach(el => {
    el.style.background = t.shimmer;
    el.style.backgroundSize = '200% auto';
    el.style.webkitBackgroundClip = 'text';
    el.style.webkitTextFillColor = 'transparent';
    el.style.backgroundClip = 'text';
  });
  
  /* Logo accent */
  const logoAccent = document.getElementById('logo-accent');
  if (logoAccent) logoAccent.style.color = t.logoColor;
  
  /* Panel headline 3 */
  const ph3 = document.getElementById('ph3');
  if (ph3) {
    ph3.textContent = t.ph3;
    ph3.style.color = t.accent3;
  }
  
  /* Badge + sub */
  const badgeLabel = document.getElementById('badge-label');
  if (badgeLabel) badgeLabel.textContent = t.badge;
  
  const panelSub = document.getElementById('panel-sub');
  if (panelSub) panelSub.textContent = t.sub;
  
  /* Stage nums + forgot links + already links */
  document.querySelectorAll('.stage-num,.forgot-link').forEach(el => el.style.color = t.accent);
  document.querySelectorAll('.already a').forEach(el => el.style.color = t.accent);
  
  /* Success circle */
  const sc = document.getElementById('success-circle');
  if (sc) {
    sc.style.background = t.successBg;
    sc.style.boxShadow = `0 12px 40px ${t.successShadow}`;
  }
  
  /* Success CTA */
  const cta = document.getElementById('success-cta');
  if (cta) {
    cta.style.background = t.accent;
    cta.style.boxShadow = `0 6px 20px ${t.successShadow}`;
  }
}

/* ── ROLE SELECTION ── */
function selectRole(value) {
  selectedRole = value;
  /* Reset cards */
  ['student', 'company', 'tpo'].forEach(r => {
    const c = document.getElementById('card-' + r);
    if (c) {
      c.style.borderColor = '#e2e8f0'; 
      c.style.background = '#fff';
      c.style.boxShadow = 'none'; 
      c.style.transform = 'none';
      c.classList.remove('active');
    }
  });
  
  /* Highlight chosen card */
  const t = T[value];
  const card = document.getElementById('card-' + value);
  if (card) {
    card.style.borderColor = t.cardBorder;
    card.style.background = t.cardBg;
    card.style.boxShadow = t.cardShadow;
    card.style.transform = 'translateY(-3px)';
    card.classList.add('active');
  }
  
  /* Continue button */
  const contBtn = document.getElementById('continue-btn');
  if (contBtn) contBtn.className = 'btn-login ' + value;
  
  /* Left panel role card highlight */
  ['student', 'company', 'tpo'].forEach(r => {
    const lp = document.getElementById('left-' + r);
    if (lp) lp.classList.remove('highlight');
  });
  const currentLp = document.getElementById('left-' + value);
  if (currentLp) currentLp.classList.add('highlight');
  
  /* Full theme switch */
  applyTheme(value);
  const err = document.getElementById('role-error');
  if (err) err.style.display = 'none';
}

function goToLogin() {
  if (!selectedRole) { 
    const err = document.getElementById('role-error');
    if (err) err.style.display = 'block'; 
    return; 
  }
  document.getElementById('stage-1').classList.remove('active');
  document.getElementById('stage-2-' + selectedRole).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBack() {
  ['student', 'company', 'tpo'].forEach(r => {
    const el = document.getElementById('stage-2-' + r);
    if (el) el.classList.remove('active');
  });
  document.getElementById('stage-1').classList.add('active');
  if (selectedRole) applyTheme(selectedRole);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function doLogin(role, event) {
  if (event) event.preventDefault();

  const em = { student: 'sl-email', company: 'cl-email', tpo: 'tl-email' };
  const pw = { student: 'sl-pwd', company: 'cl-pwd', tpo: 'tl-pwd' };
  const extra = { company: 'cl-company', tpo: 'tl-college' };
  
  const emailEl = document.getElementById(em[role]);
  const pwdEl = document.getElementById(pw[role]);
  const errBox = document.getElementById('login-err-' + role);
  const spinner = document.getElementById('spin-' + role);
  
  if (!emailEl || !pwdEl || !errBox || !spinner) return;

  let ok = true; 
  errBox.style.display = 'none';
  emailEl.classList.remove('error');
  pwdEl.classList.remove('error');

  if (!emailEl.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) { 
    emailEl.classList.add('error'); 
    const err = document.getElementById('err-' + em[role]);
    if (err) err.classList.add('show'); 
    ok = false; 
  }
  
  if (extra[role]) {
    const extraEl = document.getElementById(extra[role]);
    if (extraEl && !extraEl.value) { 
      extraEl.classList.add('error'); 
      const err = document.getElementById('err-' + extra[role]);
      if (err) err.classList.add('show'); 
      ok = false; 
    }
  }
  
  if (!pwdEl.value) { 
    pwdEl.classList.add('error'); 
    const err = document.getElementById('err-' + pw[role]);
    if (err) err.classList.add('show'); 
    ok = false; 
  }
  
  if (!ok) return;
  
  spinner.style.display = 'block'; 
  const btn = spinner.parentElement;
  btn.disabled = true;

  try {
    const apiMap = {
      student: 'http://localhost:5000/api/students/login',
      company: 'http://localhost:5000/api/companies/login'
    };

    if (apiMap[role]) {
        const loginData = { email: emailEl.value, password: pwdEl.value };
        if (role === 'company') {
          loginData.companyName = document.getElementById('cl-company').value;
        }

        const response = await fetch(apiMap[role], {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginData)
        });

      const result = await response.json();

      if (result.success) {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userRole', role);
        
        if (role === 'student') {
          sessionStorage.setItem('studentId', result.student.id);
          sessionStorage.setItem('studentName', result.student.fullName);
          sessionStorage.setItem('studentEmail', result.student.email);
          sessionStorage.setItem('studentPhone', result.student.phone || '');
          sessionStorage.setItem('studentBranch', result.student.branch || '');
          sessionStorage.setItem('studentYear', result.student.year || '');
          sessionStorage.setItem('studentCGPA', result.student.cgpa || '');
          sessionStorage.setItem('studentRoll', result.student.rollNumber || '');
          sessionStorage.setItem('studentLinkedin', result.student.linkedin || '');
          sessionStorage.setItem('studentGithub', result.student.github || '');
          sessionStorage.setItem('studentLocation', result.student.preferredLocation || '');
          sessionStorage.setItem('studentSkills', JSON.stringify(result.student.skills || []));
          sessionStorage.setItem('studentResume', result.student.resume || '');
        } else if (role === 'company') {
          sessionStorage.setItem('companyId', result.company.id);
          sessionStorage.setItem('companyName', result.company.companyName);
          sessionStorage.setItem('companyEmail', result.company.email);
          sessionStorage.setItem('companyContact', result.company.contactPerson);
          sessionStorage.setItem('companyPhone', result.company.phone);
          sessionStorage.setItem('companyIndustry', result.company.industry);
          sessionStorage.setItem('companySize', result.company.companySize);
          sessionStorage.setItem('companyWebsite', result.company.website);
          sessionStorage.setItem('companyAddress', result.company.address);
          sessionStorage.setItem('companyRoles', JSON.stringify(result.company.hiringRoles || []));
          sessionStorage.setItem('companyDesc', result.company.description);
        }
        
        showSuccess(role, emailEl.value);
      } else {
        errBox.textContent = '❌ ' + (result.message || 'Invalid email or password.');
        errBox.style.display = 'block';
      }
    } else {
      // Demo logic for TPO until backend is ready
      setTimeout(() => {
        const hrefs = { tpo: 'TPODashboard.html' };
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userRole', role);
        sessionStorage.setItem(role + 'Email', emailEl.value);
        sessionStorage.setItem(role + 'Name', emailEl.value.split('@')[0].replace(/\b\w/g, c => c.toUpperCase()));
        showSuccess(role, emailEl.value);
      }, 1200);
    }
  } catch (error) {
    console.error('Login Error:', error);
    errBox.textContent = '❌ Could not connect to server.';
    errBox.style.display = 'block';
  } finally {
    if (apiMap[role]) {
      spinner.style.display = 'none';
      btn.disabled = false;
    }
  }
}

function showSuccess(role, email) {
  ['student', 'company', 'tpo'].forEach(r => {
    const el = document.getElementById('stage-2-' + r);
    if (el) el.classList.remove('active');
  });
  
  const stage3 = document.getElementById('stage-3');
  if (stage3) stage3.classList.add('active');
  
  const titles = { student: 'Welcome Back! 👋', company: 'Welcome Back! 🚀', tpo: 'Welcome Back! 🛡️' };
  const subs = { 
    student: `Signed in as ${email}. Redirecting to your student dashboard…`, 
    company: `Signed in as ${email}. Redirecting to your recruiter dashboard…`, 
    tpo: `Signed in as ${email}. Redirecting to your TPO dashboard…` 
  };
  const hrefs = { student: 'StudentDashboard.html', company: 'CompanyDashboard.html', tpo: 'TPODashboard.html' };
  const ctas = { student: 'Go to Student Dashboard →', company: 'Go to Recruiter Dashboard →', tpo: 'Go to TPO Dashboard →' };
  
  const titleEl = document.getElementById('success-title');
  if (titleEl) titleEl.textContent = titles[role];
  
  const subEl = document.getElementById('success-sub');
  if (subEl) subEl.textContent = subs[role];
  
  const cta = document.getElementById('success-cta');
  if (cta) {
    cta.textContent = ctas[role]; 
    cta.href = hrefs[role];
  }
  
  setTimeout(() => { window.location.href = hrefs[role]; }, 2000);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showForgot(role) { 
  const p = document.getElementById('forgot-' + role); 
  if (p) p.style.display = p.style.display === 'none' ? 'block' : 'none'; 
}

function sendReset(btn) { 
  const i = btn.previousElementSibling; 
  if (!i || !i.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.value)) { 
    if (i) i.style.borderColor = '#ef4444'; 
    setTimeout(() => { if (i) i.style.borderColor = ''; }, 1500); 
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
      i.value = ''; 
    }, 3000); 
  }, 1000); 
}

function togglePwd(id, btn) { 
  const i = document.getElementById(id); 
  if (!i) return;
  i.type = i.type === 'password' ? 'text' : 'password'; 
  btn.textContent = i.type === 'password' ? '👁' : '🙈'; 
}

function clearErr(el) { 
  el.classList.remove('error'); 
  const e = document.getElementById('err-' + el.id); 
  if (e) e.classList.remove('show'); 
}
