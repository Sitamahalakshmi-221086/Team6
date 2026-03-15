// ═══════════════════════════════════════════
//   RESUME BUILDER – JavaScript
//   24 Templates: 6 Classic + 6 Modern + 6 Creative + 6 Minimal
// ═══════════════════════════════════════════

let selectedTemplate = 'classic1';
let rbStep = 0;

// ── NAVIGATION ───────────────────────────

function goToDashboard() {
  window.location.href = 'studentdashboard.html';
}

function goBackToTemplates() {
  document.getElementById('rb-form-screen').classList.remove('on');
  document.getElementById('rb-template-screen').classList.add('on');
}

// ── TEMPLATE PICKER ──────────────────────

function selectTemplate(tpl) {
  selectedTemplate = tpl;
  const names = {
    classic1:'Classic Professional', classic2:'Traditional Formal',
    classic3:'Corporate Blue',       classic4:'Executive Prestige',
    classic5:'Forest Professional',  classic6:'Academic Amber',
    modern1:'Modern Split',          modern2:'Tech Stack',
    modern3:'Gradient Accent',       modern4:'Card Layout',
    modern5:'Neon Dark',             modern6:'Timeline Flow',
    creative1:'Creative Bold',       creative2:'Sunset Warm',
    creative3:'Ocean Blue',          creative4:'Emerald',
    creative5:'Rose & Crimson',      creative6:'Midnight Indigo',
    minimal1:'Minimal Elegant',      minimal2:'Monochrome',
    minimal3:'Dot Accent',           minimal4:'Line Art',
    minimal5:'Soft Gray',            minimal6:'Nordic Sky',
  };
  document.getElementById('selected-tpl-label').textContent = 'Template: ' + (names[tpl] || tpl);
  document.getElementById('rb-template-screen').classList.remove('on');
  document.getElementById('rb-form-screen').classList.add('on');
  rbGo(0);
}

// ── FILTER / SEARCH ───────────────────────

function setFilter(btn, cat) {
  document.querySelectorAll('.rbt-filter').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  document.querySelectorAll('.tpl-card').forEach(card => {
    const show = cat === 'all' || card.dataset.cat === cat;
    card.classList.toggle('hidden', !show);
  });
  checkEmpty();
}

function filterTemplates(q) {
  q = q.toLowerCase();
  document.querySelectorAll('.tpl-card').forEach(card => {
    const name = card.querySelector('.tpl-name')?.textContent.toLowerCase() || '';
    const desc = card.querySelector('.tpl-desc')?.textContent.toLowerCase() || '';
    const tags = [...card.querySelectorAll('.tpl-tag')].map(t => t.textContent.toLowerCase()).join(' ');
    card.classList.toggle('hidden', !( name.includes(q) || desc.includes(q) || tags.includes(q) ));
  });
  checkEmpty();
}

function checkEmpty() {
  const visible = [...document.querySelectorAll('.tpl-card')].filter(c => !c.classList.contains('hidden'));
  document.getElementById('tpl-empty').style.display = visible.length === 0 ? 'block' : 'none';
}

// ── FORM STEPS ───────────────────────────

function rbGo(step) {
  if (step === 4) generatePreview();
  document.querySelectorAll('.rb-panel').forEach((p, i) => p.classList.toggle('on', i === step));
  document.querySelectorAll('.rb-step').forEach((s, i) => {
    s.classList.remove('on', 'done');
    if (i < step) s.classList.add('done');
    else if (i === step) s.classList.add('on');
  });
  rbStep = step;
  document.querySelector('.rbf-body')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function addSkillRb(e) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const v = e.target.value.trim().replace(',', '');
    if (v) {
      const t = document.createElement('span');
      t.className = 'skill-tag';
      t.innerHTML = `${v}<button type="button" onclick="removeSkillRb(this)">×</button>`;
      document.getElementById('rb-skills-wrap').insertBefore(t, e.target);
    }
    e.target.value = '';
  }
}

function removeSkillRb(btn) { btn.closest('.skill-tag').remove(); }

// ── DATA HELPERS ─────────────────────────

function g(id) { return document.getElementById(id)?.value?.trim() || ''; }

function getSkills() {
  return [...document.querySelectorAll('#rb-skills-wrap .skill-tag')]
    .map(t => t.childNodes[0]?.textContent?.trim() || '').filter(Boolean);
}

function getInitials(name) {
  if (!name) return 'YN';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getContactLine() {
  return [g('rb-email'), g('rb-phone'), g('rb-linkedin')]
    .filter(Boolean).join(' · ') || 'your@email.com · +91 00000 00000';
}

// ── PREVIEW GENERATION ───────────────────

function generatePreview() {
  const wrap = document.getElementById('resume-preview-wrap');
  const d = {
    name:    g('rb-name')     || 'Your Name',
    contact: getContactLine(),
    obj:     g('rb-obj')      || '-',
    degree:  g('rb-degree')   || 'B.Tech – Computer Science',
    college: g('rb-college')  || 'University Name',
    cgpa:    g('rb-cgpa')     || '-',
    year:    g('rb-year')     || '-',
    row12:   g('rb-12')       || '-',
    row10:   g('rb-10')       || '-',
    skills:  getSkills(),
    exp:     g('rb-exp')      || '-',
    cert:    g('rb-cert')     || '-',
    loc:     g('rb-location') || '',
    github:  g('rb-github')   || '',
    p1: { title: g('rb-p1t'), stack: g('rb-p1s'), desc: g('rb-p1d') },
    p2: { title: g('rb-p2t'), stack: g('rb-p2s'), desc: g('rb-p2d') },
  };
  const renders = {
    classic1, classic2, classic3, classic4, classic5, classic6,
    modern1,  modern2,  modern3,  modern4,  modern5,  modern6,
    creative1,creative2,creative3,creative4,creative5,creative6,
    minimal1, minimal2, minimal3, minimal4, minimal5, minimal6,
  };
  const fn = renders[selectedTemplate] || renders.classic1;
  wrap.innerHTML = fn(d);
}

// ═══════════════════════════════════════════
//   TEMPLATE RENDERERS
// ═══════════════════════════════════════════

// ── Shared helpers ────────────────────────
function skillTags(skills, bg, color) {
  return skills.length
    ? skills.map(s=>`<span style="display:inline-block;background:${bg};color:${color};padding:2px 10px;border-radius:100px;font-size:11.5px;font-weight:600;margin:2px 3px 2px 0;">${s}</span>`).join('')
    : '-';
}
function projList(p1, p2, color) {
  return [p1,p2].filter(p=>p.title).map(p=>
    `<p class="pv-item"><strong>${p.title}</strong> <span style="color:#6b7280;font-size:12px;">(${p.stack||''})</span><br>${p.desc||''}</p>`
  ).join('') || '<p class="pv-item">-</p>';
}
function secHeader(label, color) {
  return `<h3 style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:${color};margin-bottom:7px;">${label}</h3>`;
}

// ══════════════════════
//   CLASSIC TEMPLATES
// ══════════════════════

function classic1(d) {
  const skills = skillTags(d.skills,'#dbeafe','#1e40af');
  const projs  = projList(d.p1, d.p2, '#1e40af');
  return `<div style="font-family:'DM Sans',sans-serif;padding:32px 36px;color:#111;background:#fff;">
    <div style="height:8px;background:#1e3a5f;border-radius:4px;margin-bottom:18px;"></div>
    <h1 style="font-size:22px;font-weight:700;color:#1e3a5f;margin-bottom:3px;">${d.name}</h1>
    <div style="font-size:12px;color:#64748b;margin-bottom:14px;">${d.contact}${d.loc?' · '+d.loc:''}${d.github?' · '+d.github:''}</div>
    <div style="height:2px;background:#1e3a5f;margin-bottom:14px;"></div>
    <div style="margin-bottom:14px;">${secHeader('Objective','#1e3a5f')}<p class="pv-item">${d.obj}</p></div>
    <div style="margin-bottom:14px;">${secHeader('Education','#1e3a5f')}
      <p class="pv-item"><strong>${d.degree}</strong> | ${d.college} | CGPA: ${d.cgpa} | ${d.year}</p>
      <p class="pv-item">12th: ${d.row12} &nbsp;|&nbsp; 10th: ${d.row10}</p>
    </div>
    <div style="margin-bottom:14px;">${secHeader('Technical Skills','#1e3a5f')}<div>${skills}</div></div>
    <div style="margin-bottom:14px;">${secHeader('Projects','#1e3a5f')}${projs}</div>
    <div style="margin-bottom:14px;">${secHeader('Experience','#1e3a5f')}<p class="pv-item">${d.exp}</p></div>
    <div>${secHeader('Certifications','#1e3a5f')}<p class="pv-item">${d.cert}</p></div>
  </div>`;
}

function classic2(d) {
  const skills = skillTags(d.skills,'#fef3c7','#92400e');
  const projs  = projList(d.p1, d.p2, '#7c2d12');
  return `<div style="font-family:'DM Sans',sans-serif;padding:32px 36px;color:#111;background:#fffdf7;">
    <div style="text-align:center;border-bottom:2px solid #7c2d12;padding-bottom:14px;margin-bottom:14px;">
      <h1 style="font-size:24px;font-weight:700;color:#7c2d12;letter-spacing:0.03em;margin-bottom:4px;">${d.name}</h1>
      <div style="font-size:12px;color:#78350f;">${d.contact}${d.loc?' · '+d.loc:''}</div>
    </div>
    <div style="margin-bottom:14px;">${secHeader('Objective','#7c2d12')}<p class="pv-item">${d.obj}</p></div>
    <div style="margin-bottom:14px;">${secHeader('Education','#7c2d12')}
      <p class="pv-item"><strong>${d.degree}</strong> | ${d.college} | CGPA: ${d.cgpa} | ${d.year}</p>
      <p class="pv-item">12th: ${d.row12} &nbsp;|&nbsp; 10th: ${d.row10}</p>
    </div>
    <div style="margin-bottom:14px;">${secHeader('Skills','#7c2d12')}<div>${skills}</div></div>
    <div style="margin-bottom:14px;">${secHeader('Projects','#7c2d12')}${projs}</div>
    <div style="margin-bottom:14px;">${secHeader('Experience','#7c2d12')}<p class="pv-item">${d.exp}</p></div>
    <div>${secHeader('Certifications','#7c2d12')}<p class="pv-item">${d.cert}</p></div>
  </div>`;
}

function classic3(d) {
  const skills = skillTags(d.skills,'#e0e7ff','#1a237e');
  const projs  = projList(d.p1, d.p2, '#1a237e');
  return `<div style="font-family:'DM Sans',sans-serif;color:#111;background:#f0f4ff;">
    <div style="background:#1a237e;padding:22px 30px;margin-bottom:0;">
      <h1 style="font-size:22px;font-weight:700;color:#fff;margin-bottom:4px;">${d.name}</h1>
      <div style="font-size:12px;color:rgba(255,255,255,0.75);">${d.contact}${d.loc?' · '+d.loc:''}${d.github?' · '+d.github:''}</div>
    </div>
    <div style="padding:24px 30px;">
      <div style="margin-bottom:14px;">${secHeader('Objective','#1a237e')}<p class="pv-item">${d.obj}</p></div>
      <div style="margin-bottom:14px;">${secHeader('Education','#1a237e')}
        <p class="pv-item"><strong>${d.degree}</strong> | ${d.college} | CGPA: ${d.cgpa} | ${d.year}</p>
        <p class="pv-item">12th: ${d.row12} &nbsp;|&nbsp; 10th: ${d.row10}</p>
      </div>
      <div style="margin-bottom:14px;">${secHeader('Skills','#1a237e')}<div>${skills}</div></div>
      <div style="margin-bottom:14px;">${secHeader('Projects','#1a237e')}${projs}</div>
      <div style="margin-bottom:14px;">${secHeader('Experience','#1a237e')}<p class="pv-item">${d.exp}</p></div>
      <div>${secHeader('Certifications','#1a237e')}<p class="pv-item">${d.cert}</p></div>
    </div>
  </div>`;
}

function classic4(d) {
  const skills = d.skills.length ? d.skills.join(' &nbsp;·&nbsp; ') : '-';
  const projs  = projList(d.p1, d.p2, '#111');
  return `<div style="font-family:'DM Sans',sans-serif;padding:32px 36px;color:#111;background:#fff;">
    <div style="text-align:center;border-bottom:3px double #111827;padding-bottom:14px;margin-bottom:18px;">
      <h1 style="font-size:22px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:5px;">${d.name}</h1>
      <div style="font-size:12px;color:#6b7280;">${d.contact}${d.loc?' · '+d.loc:''}${d.github?' · '+d.github:''}</div>
    </div>
    <div style="margin-bottom:16px;">${secHeader('Professional Summary','#111')}<p class="pv-item">${d.obj}</p></div>
    <div style="margin-bottom:16px;">${secHeader('Education','#111')}
      <p class="pv-item"><strong>${d.degree}</strong> — ${d.college} | CGPA: ${d.cgpa} | ${d.year}</p>
      <p class="pv-item">12th: ${d.row12} &nbsp;|&nbsp; 10th: ${d.row10}</p>
    </div>
    <div style="margin-bottom:16px;">${secHeader('Core Competencies','#111')}<p class="pv-item">${skills}</p></div>
    <div style="margin-bottom:16px;">${secHeader('Key Projects','#111')}${projs}</div>
    <div style="margin-bottom:16px;">${secHeader('Experience','#111')}<p class="pv-item">${d.exp}</p></div>
    <div>${secHeader('Certifications','#111')}<p class="pv-item">${d.cert}</p></div>
  </div>`;
}

function classic5(d) {
  const skills = skillTags(d.skills,'#dcfce7','#166534');
  const projs  = projList(d.p1, d.p2, '#166534');
  return `<div style="font-family:'DM Sans',sans-serif;padding:0;color:#111;background:#fff;">
    <div style="background:#f0fdf4;border-bottom:2px solid #166534;padding:20px 28px;display:flex;align-items:center;gap:16px;">
      <div style="width:56px;height:56px;border-radius:50%;background:#166534;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:#fff;flex-shrink:0;">${getInitials(d.name)}</div>
      <div><h1 style="font-size:20px;font-weight:700;color:#166534;margin-bottom:3px;">${d.name}</h1>
      <div style="font-size:12px;color:#4b5563;">${d.contact}${d.loc?' · '+d.loc:''}</div></div>
    </div>
    <div style="padding:22px 28px;">
      <div style="margin-bottom:14px;">${secHeader('Objective','#166534')}<p class="pv-item">${d.obj}</p></div>
      <div style="margin-bottom:14px;">${secHeader('Education','#166534')}
        <p class="pv-item"><strong>${d.degree}</strong> | ${d.college} | CGPA: ${d.cgpa} | ${d.year}</p>
        <p class="pv-item">12th: ${d.row12} &nbsp;|&nbsp; 10th: ${d.row10}</p>
      </div>
      <div style="margin-bottom:14px;">${secHeader('Skills','#166534')}<div>${skills}</div></div>
      <div style="margin-bottom:14px;">${secHeader('Projects','#166534')}${projs}</div>
      <div style="margin-bottom:14px;">${secHeader('Experience','#166534')}<p class="pv-item">${d.exp}</p></div>
      <div>${secHeader('Certifications','#166534')}<p class="pv-item">${d.cert}</p></div>
    </div>
  </div>`;
}

function classic6(d) {
  const skills = skillTags(d.skills,'#fef3c7','#92400e');
  const projs  = projList(d.p1, d.p2, '#92400e');
  return `<div style="font-family:'DM Sans',sans-serif;padding:32px 36px;color:#111;background:#fffbeb;">
    <div style="border-left:5px solid #d97706;padding-left:14px;margin-bottom:16px;">
      <h1 style="font-size:22px;font-weight:700;color:#92400e;margin-bottom:4px;">${d.name}</h1>
      <div style="font-size:12px;color:#b45309;">${d.contact}${d.loc?' · '+d.loc:''}${d.github?' · '+d.github:''}</div>
    </div>
    <div style="height:1px;background:#d97706;margin-bottom:16px;opacity:0.4;"></div>
    <div style="margin-bottom:14px;">${secHeader('Objective','#92400e')}<p class="pv-item">${d.obj}</p></div>
    <div style="margin-bottom:14px;">${secHeader('Education','#92400e')}
      <p class="pv-item"><strong>${d.degree}</strong> | ${d.college} | CGPA: ${d.cgpa} | ${d.year}</p>
      <p class="pv-item">12th: ${d.row12} &nbsp;|&nbsp; 10th: ${d.row10}</p>
    </div>
    <div style="margin-bottom:14px;">${secHeader('Skills','#92400e')}<div>${skills}</div></div>
    <div style="margin-bottom:14px;">${secHeader('Projects','#92400e')}${projs}</div>
    <div style="margin-bottom:14px;">${secHeader('Experience','#92400e')}<p class="pv-item">${d.exp}</p></div>
    <div>${secHeader('Certifications','#92400e')}<p class="pv-item">${d.cert}</p></div>
  </div>`;
}

// ══════════════════════
//   MODERN TEMPLATES
// ══════════════════════

function modern1(d) {
  const skills = d.skills.length ? d.skills.map(s=>`<span style="display:inline-block;background:rgba(13,148,136,.3);color:#5eead4;font-size:10px;font-weight:600;padding:2px 8px;border-radius:100px;margin:2px 2px 2px 0;">${s}</span>`).join('') : '-';
  const projs  = [d.p1,d.p2].filter(p=>p.title).map(p=>`<p style="font-size:12.5px;line-height:1.6;margin-bottom:5px;"><strong>${p.title}</strong> <span style="font-size:11px;color:#64748b;">(${p.stack||''})</span><br>${p.desc||''}</p>`).join('') || '<p style="font-size:12.5px;">-</p>';
  return `<div style="font-family:'DM Sans',sans-serif;display:flex;min-height:550px;">
    <div style="width:190px;background:#1e293b;color:#fff;padding:26px 16px;flex-shrink:0;">
      <div style="width:54px;height:54px;border-radius:50%;background:#0d9488;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:#fff;margin:0 auto 12px;">${getInitials(d.name)}</div>
      <div style="font-size:13px;font-weight:700;text-align:center;margin-bottom:2px;">${d.name}</div>
      <div style="font-size:10.5px;color:rgba(255,255,255,.6);text-align:center;margin-bottom:16px;">${d.degree||'Student'}</div>
      <div style="margin-bottom:12px;"><div style="font-size:9px;font-weight:700;color:#0d9488;text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:4px;margin-bottom:6px;">Contact</div>
        <div style="font-size:10.5px;color:rgba(255,255,255,.75);line-height:1.7;">${d.contact.replace(/ · /g,'<br>')}${d.github?'<br>'+d.github:''}</div>
      </div>
      <div style="margin-bottom:12px;"><div style="font-size:9px;font-weight:700;color:#0d9488;text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:4px;margin-bottom:6px;">Education</div>
        <div style="font-size:10.5px;color:rgba(255,255,255,.75);line-height:1.6;">${d.college}<br><span style="color:#94a3b8;font-size:9.5px;">${d.degree} | ${d.year}</span></div>
      </div>
      <div><div style="font-size:9px;font-weight:700;color:#0d9488;text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:4px;margin-bottom:6px;">Skills</div>
        <div>${skills}</div>
      </div>
    </div>
    <div style="flex:1;padding:26px 22px;background:#fff;">
      <h2 style="font-size:20px;font-weight:700;color:#111827;margin-bottom:3px;">${d.name}</h2>
      <div style="font-size:11px;color:#6b7280;margin-bottom:14px;">${d.contact}</div>
      <div style="margin-bottom:14px;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#0d9488;border-left:3px solid #0d9488;padding-left:8px;margin-bottom:7px;">Objective</div><p style="font-size:12.5px;line-height:1.6;">${d.obj}</p></div>
      <div style="margin-bottom:14px;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#0d9488;border-left:3px solid #0d9488;padding-left:8px;margin-bottom:7px;">Education</div>
        <p style="font-size:12.5px;line-height:1.6;margin-bottom:3px;"><strong>${d.degree}</strong> – ${d.college} | CGPA: ${d.cgpa} | ${d.year}</p>
        <p style="font-size:12.5px;line-height:1.6;">12th: ${d.row12} &nbsp;|&nbsp; 10th: ${d.row10}</p>
      </div>
      <div style="margin-bottom:14px;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#0d9488;border-left:3px solid #0d9488;padding-left:8px;margin-bottom:7px;">Projects</div>${projs}</div>
      <div style="margin-bottom:14px;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#0d9488;border-left:3px solid #0d9488;padding-left:8px;margin-bottom:7px;">Experience</div><p style="font-size:12.5px;line-height:1.6;">${d.exp}</p></div>
      <div><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#0d9488;border-left:3px solid #0d9488;padding-left:8px;margin-bottom:7px;">Certifications</div><p style="font-size:12.5px;line-height:1.6;">${d.cert}</p></div>
    </div>
  </div>`;
}

function modern2(d) {
  const skills = d.skills.length ? d.skills.map(s=>`<div style="display:block;background:#1e293b;color:#5eead4;font-size:10px;font-weight:600;padding:3px 8px;border-radius:4px;margin-bottom:4px;border-left:2px solid #0d9488;">${s}</div>`).join('') : '-';
  const projs = [d.p1,d.p2].filter(p=>p.title).map(p=>`<p style="font-size:12px;line-height:1.6;margin-bottom:5px;"><strong>${p.title}</strong> <code style="font-size:10.5px;background:#f1f5f9;padding:1px 6px;border-radius:3px;">${p.stack||''}</code><br>${p.desc||''}</p>`).join('') || '<p style="font-size:12px;">-</p>';
  return `<div style="font-family:'DM Sans',sans-serif;display:flex;min-height:550px;">
    <div style="width:175px;background:#0f172a;color:#fff;padding:20px 14px;flex-shrink:0;">
      <div style="font-size:13px;font-weight:700;color:#f1f5f9;margin-bottom:2px;">${d.name}</div>
      <div style="font-size:10px;color:#64748b;margin-bottom:14px;">${d.degree||'Student'}</div>
      <div style="height:1px;background:rgba(255,255,255,.1);margin-bottom:12px;"></div>
      <div style="margin-bottom:12px;"><div style="font-size:9px;font-weight:700;color:#0d9488;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px;">Contact</div>
        <div style="font-size:10px;color:#94a3b8;line-height:1.7;">${d.contact.replace(/ · /g,'<br>')}${d.github?'<br><span style="color:#0d9488;">'+d.github+'</span>':''}</div>
      </div>
      <div style="margin-bottom:12px;"><div style="font-size:9px;font-weight:700;color:#0d9488;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px;">Education</div>
        <div style="font-size:10px;color:#94a3b8;line-height:1.6;">${d.college}<br><span style="color:#475569;">${d.degree}</span><br><span style="color:#64748b;font-size:9.5px;">CGPA ${d.cgpa} · ${d.year}</span></div>
      </div>
      <div><div style="font-size:9px;font-weight:700;color:#0d9488;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px;">Skills</div>${skills}</div>
    </div>
    <div style="flex:1;padding:20px 18px;background:#fff;">
      <div style="height:4px;background:linear-gradient(90deg,#0d9488,#0ea5e9);border-radius:2px;margin-bottom:14px;"></div>
      <h2 style="font-size:18px;font-weight:700;color:#111827;margin-bottom:3px;">${d.name}</h2>
      <div style="font-size:11px;color:#6b7280;margin-bottom:14px;">${d.contact}${d.loc?' · '+d.loc:''}</div>
      <div style="margin-bottom:12px;"><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#0d9488;margin-bottom:6px;">Objective</div><p style="font-size:12px;line-height:1.6;">${d.obj}</p></div>
      <div style="margin-bottom:12px;"><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#0d9488;margin-bottom:6px;">Projects</div>${projs}</div>
      <div style="margin-bottom:12px;"><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#0d9488;margin-bottom:6px;">Experience</div><p style="font-size:12px;line-height:1.6;">${d.exp}</p></div>
      <div><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#0d9488;margin-bottom:6px;">Certifications</div><p style="font-size:12px;line-height:1.6;">${d.cert}</p></div>
    </div>
  </div>`;
}

function modern3(d) {
  const skills = skillTags(d.skills,'#ede9fe','#7c3aed');
  const projs  = projList(d.p1, d.p2, '#7c3aed');
  return `<div style="font-family:'DM Sans',sans-serif;color:#111;background:#fff;">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6,#a855f7);padding:24px 28px;display:flex;align-items:center;gap:14px;">
      <div style="width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,0.25);border:2px solid rgba(255,255,255,0.5);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;flex-shrink:0;">${getInitials(d.name)}</div>
      <div><h1 style="font-size:22px;font-weight:700;color:#fff;margin-bottom:3px;">${d.name}</h1>
      <div style="font-size:12px;color:rgba(255,255,255,0.8);">${d.contact}${d.loc?' · '+d.loc:''}</div></div>
    </div>
    <div style="padding:22px 28px;">
      <div style="margin-bottom:14px;">${secHeader('Objective','#6366f1')}<p class="pv-item">${d.obj}</p></div>
      <div style="margin-bottom:14px;">${secHeader('Education','#6366f1')}
        <p class="pv-item"><strong>${d.degree}</strong> | ${d.college} | CGPA: ${d.cgpa} | ${d.year}</p>
        <p class="pv-item">12th: ${d.row12} &nbsp;|&nbsp; 10th: ${d.row10}</p>
      </div>
      <div style="margin-bottom:14px;">${secHeader('Skills','#6366f1')}<div>${skills}</div></div>
      <div style="margin-bottom:14px;">${secHeader('Projects','#6366f1')}${projs}</div>
      <div style="margin-bottom:14px;">${secHeader('Experience','#6366f1')}<p class="pv-item">${d.exp}</p></div>
      <div>${secHeader('Certifications','#6366f1')}<p class="pv-item">${d.cert}</p></div>
    </div>
  </div>`;
}

function modern4(d) {
  const skills = skillTags(d.skills,'#f0f9ff','#0369a1');
  const projs  = projList(d.p1, d.p2, '#0369a1');
  return `<div style="font-family:'DM Sans',sans-serif;color:#111;background:#f1f5f9;padding:16px;">
    <div style="background:#fff;border-radius:10px;padding:18px 20px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,0.07);">
      <h1 style="font-size:20px;font-weight:700;color:#0f172a;margin-bottom:4px;">${d.name}</h1>
      <div style="font-size:12px;color:#64748b;margin-bottom:8px;">${d.contact}${d.loc?' · '+d.loc:''}${d.github?' · '+d.github:''}</div>
      <div>${skillTags(d.skills,'#e0f2fe','#0369a1')}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
      <div style="background:#fff;border-radius:8px;padding:14px 16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        ${secHeader('Objective','#0ea5e9')}<p style="font-size:12px;line-height:1.6;">${d.obj}</p>
      </div>
      <div style="background:#fff;border-radius:8px;padding:14px 16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        ${secHeader('Education','#0ea5e9')}
        <p style="font-size:12px;line-height:1.6;"><strong>${d.degree}</strong><br>${d.college} · CGPA: ${d.cgpa} · ${d.year}</p>
        <p style="font-size:11px;color:#64748b;">12th: ${d.row12} · 10th: ${d.row10}</p>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div style="background:#fff;border-radius:8px;padding:14px 16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        ${secHeader('Projects','#0ea5e9')}${projs}
      </div>
      <div style="background:#fff;border-radius:8px;padding:14px 16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        ${secHeader('Experience','#0ea5e9')}<p style="font-size:12px;line-height:1.6;">${d.exp}</p>
        ${secHeader('Certifications','#0ea5e9')}<p style="font-size:12px;line-height:1.6;">${d.cert}</p>
      </div>
    </div>
  </div>`;
}

function modern5(d) {
  const skills = d.skills.length ? d.skills.map(s=>`<span style="display:inline-block;background:rgba(0,212,170,0.12);color:#00d4aa;font-size:11px;font-weight:600;padding:3px 10px;border-radius:3px;margin:2px 3px 2px 0;border:1px solid rgba(0,212,170,0.25);">${s}</span>`).join('') : '-';
  const projs = [d.p1,d.p2].filter(p=>p.title).map(p=>`<p style="font-size:12.5px;line-height:1.6;margin-bottom:5px;color:#c9d1d9;"><strong style="color:#f0f6fc;">${p.title}</strong> <span style="font-size:10.5px;color:#00d4aa;">[${p.stack||''}]</span><br>${p.desc||''}</p>`).join('') || '<p style="color:#8b949e;font-size:12.5px;">-</p>';
  return `<div style="font-family:'IBM Plex Mono',monospace;color:#c9d1d9;background:#0d1117;padding:32px 36px;min-height:550px;">
    <div style="border-bottom:1px solid #00d4aa;padding-bottom:14px;margin-bottom:18px;">
      <h1 style="font-size:22px;font-weight:700;color:#00d4aa;margin-bottom:4px;">${d.name}</h1>
      <div style="font-size:11.5px;color:#8b949e;">${d.contact}${d.loc?' · '+d.loc:''}${d.github?' · '+d.github:''}</div>
    </div>
    <div style="margin-bottom:16px;"><div style="font-size:10px;font-weight:600;color:#00d4aa;text-transform:uppercase;letter-spacing:.15em;margin-bottom:7px;">// Objective</div><p style="font-size:12.5px;line-height:1.7;color:#c9d1d9;">${d.obj}</p></div>
    <div style="margin-bottom:16px;"><div style="font-size:10px;font-weight:600;color:#00d4aa;text-transform:uppercase;letter-spacing:.15em;margin-bottom:7px;">// Education</div>
      <p style="font-size:12.5px;line-height:1.7;color:#c9d1d9;"><strong style="color:#f0f6fc;">${d.degree}</strong> | ${d.college} | CGPA: ${d.cgpa} | ${d.year}</p>
      <p style="font-size:12px;color:#8b949e;">12th: ${d.row12} | 10th: ${d.row10}</p>
    </div>
    <div style="margin-bottom:16px;"><div style="font-size:10px;font-weight:600;color:#00d4aa;text-transform:uppercase;letter-spacing:.15em;margin-bottom:7px;">// Skills</div><div>${skills}</div></div>
    <div style="margin-bottom:16px;"><div style="font-size:10px;font-weight:600;color:#00d4aa;text-transform:uppercase;letter-spacing:.15em;margin-bottom:7px;">// Projects</div>${projs}</div>
    <div style="margin-bottom:16px;"><div style="font-size:10px;font-weight:600;color:#00d4aa;text-transform:uppercase;letter-spacing:.15em;margin-bottom:7px;">// Experience</div><p style="font-size:12.5px;line-height:1.7;color:#c9d1d9;">${d.exp}</p></div>
    <div><div style="font-size:10px;font-weight:600;color:#00d4aa;text-transform:uppercase;letter-spacing:.15em;margin-bottom:7px;">// Certifications</div><p style="font-size:12.5px;line-height:1.7;color:#c9d1d9;">${d.cert}</p></div>
  </div>`;
}

function modern6(d) {
  const skills = skillTags(d.skills,'#e0e7ff','#4338ca');
  const projs = [d.p1,d.p2].filter(p=>p.title).map(p=>`
    <div style="display:flex;gap:10px;margin-bottom:8px;">
      <div style="display:flex;flex-direction:column;align-items:center;"><div style="width:10px;height:10px;border-radius:50%;background:#6366f1;flex-shrink:0;margin-top:3px;"></div><div style="flex:1;width:2px;background:#e0e7ff;margin-top:3px;"></div></div>
      <div><p style="font-size:12.5px;line-height:1.6;"><strong>${p.title}</strong> <span style="font-size:11px;color:#64748b;">(${p.stack||''})</span><br><span style="font-size:12px;">${p.desc||''}</span></p></div>
    </div>`).join('') || '<p style="font-size:12.5px;">-</p>';
  return `<div style="font-family:'DM Sans',sans-serif;display:flex;min-height:550px;color:#111;">
    <div style="width:170px;background:#f8fafc;border-right:1px solid #e2e8f0;padding:20px 14px;flex-shrink:0;">
      <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:700;color:#fff;margin:0 auto 10px;">${getInitials(d.name)}</div>
      <div style="font-size:12.5px;font-weight:700;color:#6366f1;text-align:center;margin-bottom:2px;">${d.name}</div>
      <div style="font-size:10px;color:#94a3b8;text-align:center;margin-bottom:14px;">${d.degree||'Student'}</div>
      <div style="font-size:9px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:.1em;margin-bottom:5px;">Contact</div>
      <div style="font-size:10px;color:#64748b;line-height:1.7;margin-bottom:12px;">${d.contact.replace(/ · /g,'<br>')}</div>
      <div style="font-size:9px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:.1em;margin-bottom:5px;">Skills</div>
      <div>${skills}</div>
    </div>
    <div style="flex:1;padding:20px 18px;background:#fff;">
      <div style="margin-bottom:14px;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#6366f1;margin-bottom:7px;">Objective</div><p style="font-size:12.5px;line-height:1.6;">${d.obj}</p></div>
      <div style="margin-bottom:14px;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#6366f1;margin-bottom:7px;">Education</div>
        <p style="font-size:12.5px;line-height:1.6;"><strong>${d.degree}</strong> | ${d.college} | CGPA: ${d.cgpa} | ${d.year}</p>
        <p style="font-size:12px;color:#64748b;">12th: ${d.row12} | 10th: ${d.row10}</p>
      </div>
      <div style="margin-bottom:14px;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#6366f1;margin-bottom:7px;">Projects</div>${projs}</div>
      <div style="margin-bottom:14px;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#6366f1;margin-bottom:7px;">Experience</div><p style="font-size:12.5px;line-height:1.6;">${d.exp}</p></div>
      <div><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#6366f1;margin-bottom:7px;">Certifications</div><p style="font-size:12.5px;line-height:1.6;">${d.cert}</p></div>
    </div>
  </div>`;
}

// ══════════════════════
//   CREATIVE TEMPLATES
// ══════════════════════

function creativeBase(d, grad, accent, skillBg, skillColor) {
  const skills = skillTags(d.skills, skillBg, skillColor);
  const projs = [d.p1,d.p2].filter(p=>p.title).map(p=>`<p style="font-size:13px;line-height:1.6;margin-bottom:5px;"><strong>${p.title}</strong> <span style="color:${accent};font-size:11.5px;">[${p.stack||''}]</span><br>${p.desc||''}</p>`).join('') || '<p style="font-size:13px;">-</p>';
  return `<div style="font-family:'DM Sans',sans-serif;color:#111;">
    <div style="background:${grad};padding:26px 30px;">
      <h1 style="font-size:24px;font-weight:700;color:#fff;margin-bottom:4px;">${d.name}</h1>
      <div style="font-size:12px;color:rgba(255,255,255,0.82);">${d.contact}${d.loc?' · '+d.loc:''}</div>
    </div>
    <div style="padding:22px 30px;">
      <div style="margin-bottom:14px;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:${accent};display:flex;align-items:center;gap:6px;margin-bottom:7px;">Objective<span style="flex:1;height:1px;background:${skillBg};display:block;"></span></div><p style="font-size:13px;line-height:1.65;">${d.obj}</p></div>
      <div style="margin-bottom:14px;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:${accent};display:flex;align-items:center;gap:6px;margin-bottom:7px;">Education<span style="flex:1;height:1px;background:${skillBg};display:block;"></span></div>
        <p style="font-size:13px;line-height:1.65;margin-bottom:2px;"><strong>${d.degree}</strong> | ${d.college} | CGPA: ${d.cgpa} | ${d.year}</p>
        <p style="font-size:12px;color:#6b7280;">12th: ${d.row12} &nbsp;·&nbsp; 10th: ${d.row10}</p>
      </div>
      <div style="margin-bottom:14px;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:${accent};display:flex;align-items:center;gap:6px;margin-bottom:7px;">Skills<span style="flex:1;height:1px;background:${skillBg};display:block;"></span></div><div>${skills}</div></div>
      <div style="margin-bottom:14px;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:${accent};display:flex;align-items:center;gap:6px;margin-bottom:7px;">Projects<span style="flex:1;height:1px;background:${skillBg};display:block;"></span></div>${projs}</div>
      <div style="margin-bottom:14px;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:${accent};display:flex;align-items:center;gap:6px;margin-bottom:7px;">Experience<span style="flex:1;height:1px;background:${skillBg};display:block;"></span></div><p style="font-size:13px;line-height:1.65;">${d.exp}</p></div>
      <div><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:${accent};display:flex;align-items:center;gap:6px;margin-bottom:7px;">Certifications<span style="flex:1;height:1px;background:${skillBg};display:block;"></span></div><p style="font-size:13px;line-height:1.65;">${d.cert}</p></div>
    </div>
  </div>`;
}

function creative1(d) { return creativeBase(d,'linear-gradient(110deg,#4c1d95,#7c3aed)','#7c3aed','#ede9fe','#6d28d9'); }
function creative2(d) { return creativeBase(d,'linear-gradient(110deg,#dc2626,#ea580c,#d97706)','#ea580c','#ffedd5','#c2410c'); }
function creative3(d) { return creativeBase(d,'linear-gradient(110deg,#0c4a6e,#0369a1,#0891b2)','#0369a1','#e0f2fe','#0369a1'); }
function creative4(d) { return creativeBase(d,'linear-gradient(110deg,#064e3b,#065f46,#059669)','#059669','#d1fae5','#065f46'); }
function creative5(d) { return creativeBase(d,'linear-gradient(110deg,#9f1239,#be185d,#db2777)','#be185d','#fce7f3','#9f1239'); }

function creative6(d) {
  const skills = skillTags(d.skills,'#e0e7ff','#4338ca');
  const projs = [d.p1,d.p2].filter(p=>p.title).map(p=>`<p style="font-size:13px;line-height:1.6;margin-bottom:5px;"><strong>${p.title}</strong> <span style="color:#818cf8;font-size:11.5px;">[${p.stack||''}]</span><br>${p.desc||''}</p>`).join('') || '<p style="font-size:13px;">-</p>';
  return `<div style="font-family:'DM Sans',sans-serif;color:#e2e8f0;background:#1e1b4b;min-height:550px;">
    <div style="background:linear-gradient(110deg,#1e1b4b,#312e81,#4338ca);padding:24px 28px;display:flex;align-items:center;gap:14px;">
      <div style="width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.35);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;flex-shrink:0;">${getInitials(d.name)}</div>
      <div><h1 style="font-size:22px;font-weight:700;color:#fff;margin-bottom:3px;">${d.name}</h1>
      <div style="font-size:12px;color:rgba(255,255,255,0.7);">${d.contact}${d.loc?' · '+d.loc:''}</div></div>
    </div>
    <div style="padding:22px 28px;background:#fff;color:#111;">
      <div style="margin-bottom:14px;">${secHeader('Objective','#4338ca')}<p class="pv-item">${d.obj}</p></div>
      <div style="margin-bottom:14px;">${secHeader('Education','#4338ca')}
        <p class="pv-item"><strong>${d.degree}</strong> | ${d.college} | CGPA: ${d.cgpa} | ${d.year}</p>
        <p class="pv-item">12th: ${d.row12} · 10th: ${d.row10}</p>
      </div>
      <div style="margin-bottom:14px;">${secHeader('Skills','#4338ca')}<div>${skills}</div></div>
      <div style="margin-bottom:14px;">${secHeader('Projects','#4338ca')}${projs}</div>
      <div style="margin-bottom:14px;">${secHeader('Experience','#4338ca')}<p class="pv-item">${d.exp}</p></div>
      <div>${secHeader('Certifications','#4338ca')}<p class="pv-item">${d.cert}</p></div>
    </div>
  </div>`;
}

// ══════════════════════
//   MINIMAL TEMPLATES
// ══════════════════════

function minimal1(d) {
  const skills = d.skills.length ? d.skills.map(s=>`<span style="display:inline-block;font-size:12px;color:#374151;margin:2px 10px 2px 0;">&mdash; ${s}</span>`).join('') : '-';
  const projs = [d.p1,d.p2].filter(p=>p.title).map(p=>`<p style="font-size:13px;line-height:1.65;margin-bottom:4px;"><strong>${p.title}</strong> &mdash; ${p.stack||''}<br><span style="font-size:12px;color:#6b7280;">${p.desc||''}</span></p>`).join('') || '<p style="font-size:13px;">-</p>';
  return `<div style="font-family:'DM Sans',sans-serif;padding:36px 40px;color:#111;background:#fff;">
    <h1 style="font-size:26px;font-weight:700;letter-spacing:-.02em;margin-bottom:3px;">${d.name}</h1>
    <div style="height:2px;background:#111;margin:8px 0;"></div>
    <div style="font-size:12px;color:#6b7280;margin-bottom:22px;">${d.contact}${d.loc?' · '+d.loc:''}${d.github?' · '+d.github:''}</div>
    <div style="margin-bottom:16px;"><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#374151;margin-bottom:7px;">Profile</div><p style="font-size:13px;line-height:1.65;">${d.obj}</p></div>
    <div style="margin-bottom:16px;"><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#374151;margin-bottom:7px;">Education</div>
      <p style="font-size:13px;line-height:1.65;">${d.degree} &mdash; ${d.college}</p>
      <p style="font-size:12px;color:#6b7280;">CGPA ${d.cgpa} · ${d.year} · 12th: ${d.row12} · 10th: ${d.row10}</p>
    </div>
    <div style="margin-bottom:16px;"><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#374151;margin-bottom:7px;">Skills</div><div>${skills}</div></div>
    <div style="margin-bottom:16px;"><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#374151;margin-bottom:7px;">Projects</div>${projs}</div>
    <div style="margin-bottom:16px;"><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#374151;margin-bottom:7px;">Experience</div><p style="font-size:13px;line-height:1.65;">${d.exp}</p></div>
    <div><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#374151;margin-bottom:7px;">Certifications</div><p style="font-size:13px;line-height:1.65;">${d.cert}</p></div>
  </div>`;
}

function minimal2(d) {
  const skills = d.skills.length ? d.skills.join(' / ') : '-';
  const projs = [d.p1,d.p2].filter(p=>p.title).map(p=>`<p style="font-size:13px;line-height:1.65;margin-bottom:4px;"><strong>${p.title}</strong> (${p.stack||''}) — <span style="font-size:12px;color:#6b7280;">${p.desc||''}</span></p>`).join('') || '<p style="font-size:13px;">-</p>';
  return `<div style="font-family:'DM Sans',sans-serif;padding:32px 36px;color:#111;background:#fafafa;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #e5e7eb;padding-bottom:14px;margin-bottom:16px;">
      <div><h1 style="font-size:22px;font-weight:700;color:#111;margin-bottom:3px;">${d.name}</h1><div style="font-size:12px;color:#6b7280;">${d.degree||'Student'}</div></div>
      <div style="text-align:right;font-size:12px;color:#6b7280;line-height:1.7;">${d.contact.replace(/ · /g,'<br>')}${d.github?'<br>'+d.github:''}</div>
    </div>
    <div style="margin-bottom:14px;"><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#374151;border-bottom:1px solid #e5e7eb;padding-bottom:4px;margin-bottom:7px;">Summary</div><p style="font-size:13px;line-height:1.65;">${d.obj}</p></div>
    <div style="margin-bottom:14px;"><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#374151;border-bottom:1px solid #e5e7eb;padding-bottom:4px;margin-bottom:7px;">Education</div>
      <p style="font-size:13px;"><strong>${d.degree}</strong> &mdash; ${d.college} | CGPA: ${d.cgpa} | ${d.year}</p>
      <p style="font-size:12px;color:#6b7280;margin-top:3px;">12th: ${d.row12} | 10th: ${d.row10}</p>
    </div>
    <div style="margin-bottom:14px;"><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#374151;border-bottom:1px solid #e5e7eb;padding-bottom:4px;margin-bottom:7px;">Skills</div><p style="font-size:13px;">${skills}</p></div>
    <div style="margin-bottom:14px;"><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#374151;border-bottom:1px solid #e5e7eb;padding-bottom:4px;margin-bottom:7px;">Projects</div>${projs}</div>
    <div style="margin-bottom:14px;"><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#374151;border-bottom:1px solid #e5e7eb;padding-bottom:4px;margin-bottom:7px;">Experience</div><p style="font-size:13px;line-height:1.65;">${d.exp}</p></div>
    <div><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#374151;border-bottom:1px solid #e5e7eb;padding-bottom:4px;margin-bottom:7px;">Certifications</div><p style="font-size:13px;line-height:1.65;">${d.cert}</p></div>
  </div>`;
}

function minimal3(d) {
  const skills = d.skills.length ? d.skills.map(s=>`<span style="display:inline-block;background:#fef3c7;color:#92400e;font-size:11.5px;font-weight:600;padding:3px 11px;border-radius:100px;margin:2px 3px 2px 0;">${s}</span>`).join('') : '-';
  const projs = [d.p1,d.p2].filter(p=>p.title).map(p=>`
    <div style="display:flex;gap:9px;margin-bottom:7px;"><div style="width:8px;height:8px;border-radius:50%;background:#f59e0b;flex-shrink:0;margin-top:4px;"></div>
    <p style="font-size:13px;line-height:1.6;"><strong>${p.title}</strong> (${p.stack||''})<br><span style="color:#6b7280;font-size:12px;">${p.desc||''}</span></p></div>`).join('') || '<p style="font-size:13px;">-</p>';
  return `<div style="font-family:'DM Sans',sans-serif;padding:32px 36px;color:#111;background:#fff;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;"><div style="width:10px;height:10px;border-radius:50%;background:#f59e0b;flex-shrink:0;"></div><h1 style="font-size:24px;font-weight:700;letter-spacing:-.02em;">${d.name}</h1></div>
    <div style="font-size:12px;color:#6b7280;margin-bottom:5px;margin-left:20px;">${d.contact}${d.loc?' · '+d.loc:''}${d.github?' · '+d.github:''}</div>
    <div style="height:2px;background:#fde68a;margin-bottom:18px;"></div>
    <div style="margin-bottom:14px;"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><div style="width:7px;height:7px;border-radius:50%;background:#f59e0b;"></div><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#374151;">Profile</div></div><p style="font-size:13px;line-height:1.65;margin-left:15px;">${d.obj}</p></div>
    <div style="margin-bottom:14px;"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><div style="width:7px;height:7px;border-radius:50%;background:#f59e0b;"></div><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#374151;">Education</div></div>
      <p style="font-size:13px;line-height:1.65;margin-left:15px;"><strong>${d.degree}</strong> — ${d.college} | CGPA: ${d.cgpa} | ${d.year}</p>
      <p style="font-size:12px;color:#6b7280;margin-left:15px;">12th: ${d.row12} · 10th: ${d.row10}</p>
    </div>
    <div style="margin-bottom:14px;"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><div style="width:7px;height:7px;border-radius:50%;background:#f59e0b;"></div><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#374151;">Skills</div></div><div style="margin-left:15px;">${skills}</div></div>
    <div style="margin-bottom:14px;"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><div style="width:7px;height:7px;border-radius:50%;background:#f59e0b;"></div><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#374151;">Projects</div></div><div style="margin-left:15px;">${projs}</div></div>
    <div style="margin-bottom:14px;"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><div style="width:7px;height:7px;border-radius:50%;background:#f59e0b;"></div><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#374151;">Experience</div></div><p style="font-size:13px;line-height:1.65;margin-left:15px;">${d.exp}</p></div>
    <div><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><div style="width:7px;height:7px;border-radius:50%;background:#f59e0b;"></div><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#374151;">Certifications</div></div><p style="font-size:13px;line-height:1.65;margin-left:15px;">${d.cert}</p></div>
  </div>`;
}

function minimal4(d) {
  const skills = skillTags(d.skills,'#e0e7ff','#4338ca');
  const projs = [d.p1,d.p2].filter(p=>p.title).map(p=>`<p style="font-size:13px;line-height:1.65;margin-bottom:4px;"><strong>${p.title}</strong> &mdash; ${p.stack||''}<br><span style="color:#6b7280;font-size:12px;">${p.desc||''}</span></p>`).join('') || '<p style="font-size:13px;">-</p>';
  return `<div style="font-family:'DM Sans',sans-serif;padding:32px 36px;color:#111;background:#fff;">
    <div style="border-left:4px solid #6366f1;padding-left:14px;margin-bottom:16px;">
      <h1 style="font-size:24px;font-weight:700;color:#111;margin-bottom:4px;">${d.name}</h1>
      <div style="font-size:12px;color:#6b7280;">${d.contact}${d.loc?' · '+d.loc:''}${d.github?' · '+d.github:''}</div>
    </div>
    <div style="margin-bottom:14px;"><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#6366f1;margin-bottom:7px;">Profile</div><p style="font-size:13px;line-height:1.65;">${d.obj}</p></div>
    <div style="margin-bottom:14px;"><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#6366f1;margin-bottom:7px;">Education</div>
      <p style="font-size:13px;line-height:1.65;"><strong>${d.degree}</strong> | ${d.college} | CGPA: ${d.cgpa} | ${d.year}</p>
      <p style="font-size:12px;color:#6b7280;">12th: ${d.row12} · 10th: ${d.row10}</p>
    </div>
    <div style="margin-bottom:14px;"><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#6366f1;margin-bottom:7px;">Skills</div><div>${skills}</div></div>
    <div style="margin-bottom:14px;"><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#6366f1;margin-bottom:7px;">Projects</div>${projs}</div>
    <div style="margin-bottom:14px;"><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#6366f1;margin-bottom:7px;">Experience</div><p style="font-size:13px;line-height:1.65;">${d.exp}</p></div>
    <div><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#6366f1;margin-bottom:7px;">Certifications</div><p style="font-size:13px;line-height:1.65;">${d.cert}</p></div>
  </div>`;
}

function minimal5(d) {
  const skills = skillTags(d.skills,'#f3f4f6','#374151');
  const projs = [d.p1,d.p2].filter(p=>p.title).map(p=>`<p style="font-size:13px;line-height:1.65;margin-bottom:4px;"><strong>${p.title}</strong> (${p.stack||''})<br><span style="color:#6b7280;font-size:12px;">${p.desc||''}</span></p>`).join('') || '<p style="font-size:13px;">-</p>';
  return `<div style="font-family:'DM Sans',sans-serif;color:#111;background:#f9fafb;padding:20px;">
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin-bottom:14px;">
      <h1 style="font-size:22px;font-weight:700;color:#111;margin-bottom:3px;">${d.name}</h1>
      <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">${d.contact}${d.loc?' · '+d.loc:''}${d.github?' · '+d.github:''}</div>
      <p style="font-size:12.5px;color:#374151;line-height:1.6;">${d.obj}</p>
    </div>
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin-bottom:14px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#9ca3af;margin-bottom:8px;">Education</div>
      <p style="font-size:13px;"><strong>${d.degree}</strong> &mdash; ${d.college}</p>
      <p style="font-size:12px;color:#6b7280;margin-top:2px;">CGPA: ${d.cgpa} · ${d.year} · 12th: ${d.row12} · 10th: ${d.row10}</p>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:16px;"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#9ca3af;margin-bottom:7px;">Skills</div><div>${skills}</div></div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:16px;"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#9ca3af;margin-bottom:7px;">Certifications</div><p style="font-size:12.5px;line-height:1.6;">${d.cert}</p></div>
    </div>
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin-bottom:14px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#9ca3af;margin-bottom:8px;">Projects</div>
      ${projs}
    </div>
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#9ca3af;margin-bottom:7px;">Experience</div>
      <p style="font-size:13px;line-height:1.65;">${d.exp}</p>
    </div>
  </div>`;
}

function minimal6(d) {
  const skills = d.skills.length ? d.skills.map(s=>`<span style="display:inline-block;background:#e0f2fe;color:#0369a1;font-size:11.5px;font-weight:600;padding:2px 10px;border-radius:100px;margin:2px 3px 2px 0;">${s}</span>`).join('') : '-';
  const projs = [d.p1,d.p2].filter(p=>p.title).map(p=>`<p style="font-size:13px;line-height:1.65;margin-bottom:4px;"><strong>${p.title}</strong> &mdash; ${p.stack||''}<br><span style="font-size:12px;color:#6b7280;">${p.desc||''}</span></p>`).join('') || '<p style="font-size:13px;">-</p>';
  return `<div style="font-family:'DM Sans',sans-serif;padding:32px 36px;color:#111;background:#fff;">
    <div style="display:grid;grid-template-columns:1fr auto;gap:12px;border-bottom:2px solid #bae6fd;padding-bottom:14px;margin-bottom:18px;">
      <div><h1 style="font-size:22px;font-weight:700;color:#0c4a6e;margin-bottom:4px;">${d.name}</h1><div style="font-size:12px;color:#0369a1;">${d.degree||'Student'}</div></div>
      <div style="text-align:right;font-size:12px;color:#64748b;line-height:1.7;">${d.contact.replace(/ · /g,'<br>')}${d.github?'<br>'+d.github:''}</div>
    </div>
    <div style="margin-bottom:14px;"><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#0ea5e9;margin-bottom:7px;">Profile</div><p style="font-size:13px;line-height:1.65;">${d.obj}</p></div>
    <div style="margin-bottom:14px;"><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#0ea5e9;margin-bottom:7px;">Education</div>
      <p style="font-size:13px;line-height:1.65;"><strong>${d.degree}</strong> | ${d.college} | CGPA: ${d.cgpa} | ${d.year}</p>
      <p style="font-size:12px;color:#6b7280;">12th: ${d.row12} · 10th: ${d.row10}</p>
    </div>
    <div style="margin-bottom:14px;"><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#0ea5e9;margin-bottom:7px;">Skills</div><div>${skills}</div></div>
    <div style="margin-bottom:14px;"><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#0ea5e9;margin-bottom:7px;">Projects</div>${projs}</div>
    <div style="margin-bottom:14px;"><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#0ea5e9;margin-bottom:7px;">Experience</div><p style="font-size:13px;line-height:1.65;">${d.exp}</p></div>
    <div><div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#0ea5e9;margin-bottom:7px;">Certifications</div><p style="font-size:13px;line-height:1.65;">${d.cert}</p></div>
  </div>`;
}

// ── PDF / PRINT ───────────────────────────

function printResume() {
  const preview = document.getElementById('resume-preview-wrap');
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Resume – ${g('rb-name')||'Your Name'}</title>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet">
    <style>*{box-sizing:border-box;margin:0;padding:0;}body{margin:0;padding:0;background:#fff;}@page{margin:12mm;}p{margin:0;}.pv-item{font-size:13px;line-height:1.6;margin-bottom:3px;}</style>
    </head><body>${preview.innerHTML}</body></html>`;
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 700);
}

function downloadPDF() { printResume(); }
