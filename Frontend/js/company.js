// ── INIT ──
    window.addEventListener('DOMContentLoaded', () => {
      const email = sessionStorage.getItem('cp_company_email') || '—';
      const co = sessionStorage.getItem('cp_company_name') || '—';
      const short = co.split(' ')[0];

      document.getElementById('sb-uname').textContent = co;
      document.getElementById('tb-name').textContent = short;
      document.getElementById('pg-coname').textContent = co === '—' ? '—' : `${co} Ltd.`;
      document.getElementById('pg-coemail').textContent = email;
      document.getElementById('set-email').textContent = email;

      const h = new Date().getHours();
      const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
      const gm = document.getElementById('greet-msg');
      if (gm) gm.textContent = co === '—' ? g : `${g}, ${co}`;
    });

    // ── SIDEBAR COLLAPSE ──
    let sidebarOpen = true;
    function toggleSidebar() {
      sidebarOpen = !sidebarOpen;
      const sidebar = document.getElementById('sidebar');
      const main = document.getElementById('main-content');
      const logoMark = document.getElementById('logo-mark');
      sidebar.classList.toggle('collapsed', !sidebarOpen);
      main.classList.toggle('expanded', !sidebarOpen);
      // Rotate logo icon as a visual cue
      logoMark.style.transform = sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)';
    }

    // ── NAV ──
    const TITLES = { home: 'Dashboard', jobs: 'Job Postings', candidates: 'Applicants', drives: 'Campus Drives', profile: 'Company Profile', settings: 'Settings' };
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
      if (!panel.contains(e.target) && !e.target.closest('.icon-btn')) panel.classList.remove('on');
    });

    // ── OVERLAY CLOSE ──
    function closeOverlay(e, id) {
      if (e.target === document.getElementById(id)) document.getElementById(id).classList.remove('on');
    }

    // ── COMPANY PROFILE EDIT ──
    async function saveCompanyProfile() {
      const cpEdit = document.getElementById('cp-edit');
      if (!cpEdit) return false;
      const controls = Array.from(cpEdit.querySelectorAll('input, select, textarea'));
      const companyName = controls[0]?.value?.trim() || '';
      const industry = controls[1]?.value?.trim() || ''; 
      const companySize = controls[2]?.value?.trim() || '';
      const headquarters = controls[3]?.value?.trim() || '';
      const website = controls[4]?.value?.trim() || '';
      const hrEmail = controls[5]?.value?.trim() || '';
      const about = controls[6]?.value?.trim() || '';

      const existingEmail = sessionStorage.getItem('cp_company_email') || hrEmail;
      const payload = {
        email: existingEmail,
        companyName,
        industry,
        companySize,
        website,
        address: headquarters,
        description: about
      };

      try {
        const token = sessionStorage.getItem('cp_company_token');
        const res = await fetch('http://localhost:5000/api/companies/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          showToast(err.message || 'Could not save profile.');
          return false;
        }

        const data = await res.json();
        const saved = data.company || payload;

        sessionStorage.setItem('cp_company_name', saved.companyName || companyName);
        sessionStorage.setItem('cp_company_email', saved.email || existingEmail);
        updateCompanyProfileView(saved);
        return true;
      } catch (error) {
        console.error('Profile save failed', error);
        showToast('Unable to reach the server. Please try again later.');
        return false;
      }
    }

    function updateCompanyProfileView(company) {
      const cpView = document.getElementById('cp-view');
      if (!cpView) return;
      const rows = cpView.querySelectorAll('.df');
      rows.forEach(row => {
        const label = row.querySelector('label')?.textContent?.trim();
        const value = row.querySelector('p');
        if (!label || !value) return;
        if (label === 'Company Name') value.textContent = company.companyName || value.textContent;
        if (label === 'Industry') value.textContent = company.industry || value.textContent;
        if (label === 'Company Size') value.textContent = company.companySize || value.textContent;
        if (label === 'Headquarters') value.textContent = company.address || value.textContent;
        if (label === 'Website') value.textContent = company.website || value.textContent;
        if (label === 'HR Email') value.textContent = company.email || value.textContent;
      });
      const about = cpView.querySelector('div[style*="About"]');
      if (about) {
        const desc = cpView.querySelector('div[style*="line-height"]');
        if (desc) desc.textContent = company.description || desc.textContent;
      }
    }

    async function toggleCpEdit(save = false) {
      const v = document.getElementById('cp-view');
      const e = document.getElementById('cp-edit');
      if (!v || !e) return;
      const isEditing = e.style.display !== 'none';

      if (isEditing && save) {
        const saved = await saveCompanyProfile();
        if (!saved) {
          return;
        }
      }

      v.style.display = isEditing ? 'block' : 'none';
      e.style.display = isEditing ? 'none' : 'block';
    }

    // ── TAGS (Post Job Modal) ──
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
    function logout() { sessionStorage.clear(); window.location.href = 'Login.html'; }
    // Initialize Lucide icons
    lucide.createIcons();
