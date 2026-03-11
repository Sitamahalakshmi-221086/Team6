let selectedRole = '';

    /* ─── THEME CONFIGS — exactly matching each dashboard ─── */
    const T = {
      student: {
        panelGrad: 'linear-gradient(160deg,#1e3a8a 0%,#1d4ed8 60%,#0891b2 100%)',
        stripGrad: 'linear-gradient(90deg,#1e3a8a,#0891b2)',
        accent: '#2563eb', accentLight: '#eff6ff', accentRing: 'rgba(37,99,235,.12)',
        shimmer: 'linear-gradient(90deg,#1e3a8a 0%,#2563eb 40%,#0891b2 60%,#1e3a8a 100%)',
        logoColor: '#67e8f9',
        ph2Color: '#67e8f9',
        badge: '🎓 Student Registration',
        ph1: 'Start Your', ph2: 'Placement', ph3: 'Journey',
        sub: 'Create your profile in 4 quick steps and get matched with top companies visiting your campus.',
        step2name: 'Personal Details', step2desc: 'Academic & contact info',
        cardBorder: '#2563eb', cardBg: '#eff6ff', cardShadow: '0 0 0 4px rgba(37,99,235,.12)',
        circleColor: 'student',
      },
      company: {
        panelGrad: 'linear-gradient(160deg,#134e4a 0%,#0f766e 60%,#0d9488 100%)',
        stripGrad: 'linear-gradient(90deg,#134e4a,#0d9488)',
        accent: '#0d9488', accentLight: '#f0fdfa', accentRing: 'rgba(13,148,136,.12)',
        shimmer: 'linear-gradient(90deg,#134e4a 0%,#0d9488 40%,#14b8a6 60%,#134e4a 100%)',
        logoColor: '#5eead4',
        ph2Color: '#5eead4',
        badge: '🏢 Company Registration',
        ph1: 'Recruit Top', ph2: 'Campus', ph3: 'Talent',
        sub: 'Register your company in 4 steps and start connecting with talented students at top colleges.',
        step2name: 'Company Details', step2desc: 'Profile & contact info',
        cardBorder: '#0d9488', cardBg: '#f0fdfa', cardShadow: '0 0 0 4px rgba(13,148,136,.12)',
        circleColor: 'company',
      },
      tpo: {
        panelGrad: 'linear-gradient(160deg,#4c1d95 0%,#6d28d9 60%,#7c3aed 100%)',
        stripGrad: 'linear-gradient(90deg,#4c1d95,#7c3aed)',
        accent: '#7c3aed', accentLight: '#f5f3ff', accentRing: 'rgba(124,58,237,.12)',
        shimmer: 'linear-gradient(90deg,#4c1d95 0%,#7c3aed 40%,#a78bfa 60%,#4c1d95 100%)',
        logoColor: '#ddd6fe',
        ph2Color: '#ddd6fe',
        badge: '🛡️ TPO Registration',
        ph1: 'Manage', ph2: 'Placement', ph3: 'Operations',
        sub: 'Set up your TPO admin account to coordinate drives, manage students and connect with recruiters.',
        step2name: 'Institute Details', step2desc: 'College & contact info',
        cardBorder: '#7c3aed', cardBg: '#f5f3ff', cardShadow: '0 0 0 4px rgba(124,58,237,.12)',
        circleColor: 'tpo',
      },
    };

    function applyTheme(role) {
      const t = T[role];
      const root = document.documentElement;

      /* Left panel gradient */
      document.getElementById('left-panel').style.background = t.panelGrad;
      /* Top env strip */
      document.getElementById('env-strip').style.background = t.stripGrad;
      /* CSS vars for right-panel accents */
      root.style.setProperty('--accent', t.accent);
      root.style.setProperty('--accent-light', t.accentLight);
      root.style.setProperty('--accent-ring', t.accentRing);

      /* Shimmer on headline */
      document.querySelectorAll('.shimmer-text').forEach(el => {
        el.style.background = t.shimmer;
        el.style.backgroundSize = '200% auto';
        el.style.webkitBackgroundClip = 'text';
        el.style.webkitTextFillColor = 'transparent';
        el.style.backgroundClip = 'text';
      });

      /* Logo accent color */
      document.getElementById('logo-accent').style.color = t.logoColor;

      /* Panel text content */
      document.getElementById('badge-label').textContent = t.badge;
      document.getElementById('ph1').textContent = t.ph1;
      const ph2 = document.getElementById('ph2');
      ph2.textContent = t.ph2; ph2.style.color = t.ph2Color;
      document.getElementById('ph3').textContent = t.ph3;
      document.getElementById('panel-sub').textContent = t.sub;
      document.getElementById('step2-name').textContent = t.step2name;
      document.getElementById('step2-desc').textContent = t.step2desc;

      /* Active step circle color class */
      const c1 = document.getElementById('circle-1');
      c1.className = 'step-circle active ' + t.circleColor;

      /* Stage num + already link */
      document.querySelectorAll('.stage-num').forEach(el => el.style.color = t.accent);
      document.getElementById('signin-link').style.color = t.accent;
    }

    function selectRole(value) {
      selectedRole = value;

      /* Reset all cards */
      ['student', 'company', 'tpo'].forEach(r => {
        const c = document.getElementById('card-' + r);
        c.style.borderColor = '#e2e8f0';
        c.style.background = '#fff';
        c.style.boxShadow = 'none';
        c.style.transform = 'none';
      });

      /* Highlight selected card */
      const t = T[value];
      const card = document.getElementById('card-' + value);
      card.style.borderColor = t.cardBorder;
      card.style.background = t.cardBg;
      card.style.boxShadow = t.cardShadow;
      card.style.transform = 'translateY(-3px)';

      /* Continue button class */
      document.getElementById('continue-btn').className = 'btn-next ' + value;

      /* TPO warning */
      document.getElementById('tpo-warning').classList.toggle('show', value === 'tpo');

      /* Apply full theme */
      applyTheme(value);
      document.getElementById('role-error').style.display = 'none';
    }

    function goNext() {
      if (!selectedRole) {
        document.getElementById('role-error').style.display = 'block';
        return;
      }

      const routes = {
        student: 'StudentSignup.html',
        company: 'Companysignup.html',
        tpo: 'TPOsignup.html',
      };
      window.location.href = routes[selectedRole];
    }
