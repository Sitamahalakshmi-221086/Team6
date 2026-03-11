/* ── DO LOGIN ── */
    function doLogin(role) {
      const emailMap = { student: 'sl-email' };
      const pwdMap = { student: 'sl-pwd' };

      const emailEl = document.getElementById(emailMap[role]);
      const pwdEl = document.getElementById(pwdMap[role]);
      const errBox = document.getElementById('login-err-' + role);
      const spinner = document.getElementById('spin-' + role);

      let ok = true;
      errBox.style.display = 'none';

      // Validate email
      if (!emailEl.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
        emailEl.classList.add('error');
        document.getElementById('err-' + emailMap[role]).classList.add('show');
        ok = false;
      }
      // Validate password
      if (!pwdEl.value) {
        pwdEl.classList.add('error');
        document.getElementById('err-' + pwdMap[role]).classList.add('show');
        ok = false;
      }
      if (!ok) return;

      // Simulate login
      spinner.style.display = 'block';
      spinner.parentElement.disabled = true;

      setTimeout(() => {
        spinner.style.display = 'none';
        spinner.parentElement.disabled = false;

        // Demo: treat any input as success (swap to fail to test error state)
        const isSuccess = true;

        if (isSuccess) {
          showSuccess(role, emailEl.value);
        } else {
          errBox.style.display = 'block';
        }
      }, 1200);
    }

    /* ── SUCCESS ── */
    function showSuccess(role, email) {
      document.getElementById('stage-2-' + role).classList.remove('active');
      document.getElementById('stage-3').classList.add('active');

      const titles = {
        student: 'Welcome Back! 👋',
      };
      const subs = {
        student: `Signed in as ${email}. Redirecting to your student dashboard…`,
      };
      const ctas = {
        student: 'Go to Student Dashboard →',
      };

      document.getElementById('success-title').textContent = titles[role];
      document.getElementById('success-sub').textContent = subs[role];
      const successCta = document.getElementById('success-cta');
      successCta.textContent = ctas[role];
      
      if (role === 'student') {
        successCta.href = 'StudentDashboard.html';
        
        // redirect automatically for better UX
        setTimeout(() => {
          window.location.href = 'StudentDashboard.html';
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
      el.classList.remove('error');
      const errEl = document.getElementById('err-' + el.id);
      if (errEl) errEl.classList.remove('show');
    }
