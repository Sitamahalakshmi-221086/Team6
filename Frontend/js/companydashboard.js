 
    // ── AUTH CHECK ──
    const isLoggedIn = (localStorage.getItem('isLoggedIn') || sessionStorage.getItem('isLoggedIn')) === 'true';
    const role = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
    if (!isLoggedIn || role !== 'company') {
      window.location.href = 'Login.html';
    }

    // ── INIT ──
    window.addEventListener('DOMContentLoaded', () => {
      const email = localStorage.getItem('companyEmail') || sessionStorage.getItem('companyEmail') || sessionStorage.getItem('cp_company_email') || 'hr@company.com';
      const co = localStorage.getItem('companyName') || sessionStorage.getItem('companyName') || sessionStorage.getItem('cp_company_name') || 'Your Company';
      const short = co.split(' ')[0];

      document.getElementById('sb-uname').textContent = co;
      document.getElementById('tb-name').textContent = short;
      document.getElementById('pg-coname').textContent = co + ' Ltd.';
      document.getElementById('pg-coemail').textContent = email;
      document.getElementById('set-email').textContent = email;

      const h = new Date().getHours();
      const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
      document.getElementById('greet-msg').textContent = `${g}, ${co}`;
    });

    // ── SIDEBAR COLLAPSE ──
    let sidebarOpen = true;
    function toggleSidebar() {
      sidebarOpen = !sidebarOpen;
      document.getElementById('sidebar').classList.toggle('collapsed', !sidebarOpen);
      document.getElementById('main-content').classList.toggle('expanded', !sidebarOpen);
      document.getElementById('logo-mark').style.transform = sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)';
    }

    // ── NAV ──
    const TITLES = {
      home: 'Dashboard', jobs: 'Job Postings', candidates: 'Applicants',
      drives: 'Campus Drives', profile: 'Company Profile', settings: 'Settings'
    };

    function go(id, btn) {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
      document.querySelectorAll('.nl').forEach(n => n.classList.remove('on'));
      document.getElementById('pg-' + id).classList.add('on');
      if (btn) btn.classList.add('on');
      document.getElementById('tb-title').textContent = TITLES[id] || id;
      document.getElementById('notif-panel').classList.remove('on');
    }

    // ── TABS ──
    const tabGroups = {
      jt: ['active', 'closed', 'draft'],
      at: ['all', 'new', 'short', 'interview', 'hired']
    };

    function swtab(group, id, btn) {
      tabGroups[group].forEach(t => document.getElementById(`${group}-${t}`).classList.remove('on'));
      btn.closest('.tabs').querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
      document.getElementById(`${group}-${id}`).classList.add('on');
      btn.classList.add('on');
    }

    // ── NOTIF ──
    function toggleNotif() {
      document.getElementById('notif-panel').classList.toggle('on');
    }

    document.addEventListener('click', e => {
      const panel = document.getElementById('notif-panel');
      if (!panel.contains(e.target) && !e.target.closest('.icon-btn')) {
        panel.classList.remove('on');
      }
    });

    // ── OVERLAY CLOSE ──
    function closeOverlay(e, id) {
      if (e.target === document.getElementById(id)) {
        document.getElementById(id).classList.remove('on');
      }
    }

    // ── COMPANY PROFILE EDIT ──
    function toggleCpEdit() {
      const v = document.getElementById('cp-view');
      const e = document.getElementById('cp-edit');
      const isEditing = e.style.display !== 'none';
      v.style.display = isEditing ? 'block' : 'none';
      e.style.display = isEditing ? 'none' : 'block';
    }

    // ── TAGS ──
    function addCollegeTag(e) {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const v = e.target.value.trim().replace(',', '');
        if (v) {
          const t = document.createElement('span');
          t.className = 'tag';
          t.innerHTML = `${v}<button onclick="removeTag(this)">×</button>`;
          document.getElementById('college-tags').insertBefore(t, e.target);
        }
        e.target.value = '';
      }
    }

    function addSkillTag(e) {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const v = e.target.value.trim().replace(',', '');
        if (v) {
          const t = document.createElement('span');
          t.className = 'tag';
          t.innerHTML = `${v}<button onclick="removeTag(this)">×</button>`;
          document.getElementById('skill-tags').insertBefore(t, e.target);
        }
        e.target.value = '';
      }
    }

    function removeTag(btn) { btn.closest('.tag').remove(); }

    // ── TOAST ──
    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.style.display = 'block';
      setTimeout(() => { t.style.display = 'none'; }, 3000);
    }

    // ── LOGOUT ──
    function logout() {
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = 'Login.html';
    }
  