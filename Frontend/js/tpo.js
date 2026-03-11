// ── INIT ──
    window.addEventListener('DOMContentLoaded', () => {
      const email = sessionStorage.getItem('cp_tpo_email') || 'ramesh@jntu.ac.in';
      const name = sessionStorage.getItem('cp_tpo_name') || 'Dr. Ramesh Kumar';
      const first = name.split(' ').slice(0, 2).join(' ');

      document.getElementById('sb-uname').textContent = name;
      document.getElementById('tb-name').textContent = first;
      document.getElementById('set-email').textContent = email;

      const h = new Date().getHours();
      const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
      document.getElementById('greet-msg').textContent = `${g}, ${first}`;
    });

    // ── SIDEBAR TOGGLE — logo click ──
    let sidebarOpen = true;
    function toggleSidebar() {
      sidebarOpen = !sidebarOpen;
      document.getElementById('sidebar').classList.toggle('collapsed', !sidebarOpen);
      document.getElementById('main-content').classList.toggle('expanded', !sidebarOpen);
    }

    // ── NAV ──
    const TITLES = {
      home: 'Dashboard', students: 'Students', companies: 'Companies',
      drives: 'Campus Drives', placements: 'Placements',
      notices: 'Notices', reports: 'Reports', profile: 'My Profile', settings: 'Settings'
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
      st: ['all', 'placed', 'active', 'unplaced'],
      ct: ['requests', 'approved', 'history']
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
      if (!panel.contains(e.target) && !e.target.closest('.icon-btn')) panel.classList.remove('on');
    });

    // ── MODALS ──
    function openModal(id) { document.getElementById(id).classList.add('on'); }
    function closeModal(id) { document.getElementById(id).classList.remove('on'); }
    function closeOverlay(e, id) { if (e.target === document.getElementById(id)) closeModal(id); }

    // ── PROFILE EDIT ──
    function togglePfEdit() {
      // [BACKEND_NEEDED]: Add logic to save the updated TPO profile data to the backend (e.g., PUT /api/tpo/profile)
      const v = document.getElementById('pf-view');
      const ed = document.getElementById('pf-edit');
      const isEditing = ed.style.display !== 'none';
      v.style.display = isEditing ? 'block' : 'none';
      ed.style.display = isEditing ? 'none' : 'block';
    }

    // ── TAG INPUT HELPERS ──
    function addTag(e, wrapperId) {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const v = e.target.value.trim().replace(',', '');
        if (v) {
          const t = document.createElement('span');
          t.className = 'tag';
          t.innerHTML = `${v}<button onclick="removeTag(this)">×</button>`;
          document.getElementById(wrapperId).insertBefore(t, e.target);
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
      clearTimeout(window._toastTimer);
      window._toastTimer = setTimeout(() => { t.style.display = 'none'; }, 3000);
    }

    // ── LOGOUT ──
    function logout() { sessionStorage.clear(); window.location.href = 'Login.html'; }
    // Initialize Lucide icons
    lucide.createIcons();
