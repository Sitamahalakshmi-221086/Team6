// Placement Analytics Functions for TPO Dashboard

async function loadPlacementStats() {
  try {
    const res = await fetch(`${API_ROOT}/api/placements/stats`);
    const data = await res.json();
    if (data.success) {
      const stats = data.stats;
      
      // Update stat cards
      document.getElementById('tpo-pl-st-placed').textContent = stats.placedStudents || 0;
      document.getElementById('tpo-pl-rate').textContent = `${stats.placementRate}%`;
      document.getElementById('tpo-pl-avgpkg').textContent = `₹${stats.avgPackage} LPA`;
      document.getElementById('tpo-pl-cos').textContent = stats.totalOffers || 0;
      
      // Store for later use
      window.__placementStats = stats;
    }
  } catch (err) {
    console.error('loadPlacementStats error:', err);
  }
}

async function loadStudentPlacementStatus() {
  try {
    const res = await fetch(`${API_ROOT}/api/placements/student-status`);
    const data = await res.json();
    if (data.success && data.students) {
      renderPlacementRecords(data.students);
    }
  } catch (err) {
    console.error('loadStudentPlacementStatus error:', err);
  }
}

function renderPlacementRecords(students) {
  const tbody = document.getElementById('tpo-placements-tbody');
  if (!tbody) return;
  
  // Show recent placements (students with accepted offers)
  const placed = students.filter(s => s.status === 'placed').slice(0, 10);
  
  if (!placed.length) {
    tbody.innerHTML = '<div style="padding:20px;text-align:center;color:var(--txmu);">No placements yet</div>';
    return;
  }
  
  tbody.innerHTML = placed.map(student => `
    <div class="tbl-row g5" style="padding:12px 16px;border-bottom:1px solid var(--brs);">
      <span style="color:var(--txm);font-weight:600;">${student.fullName}</span>
      <span style="color:var(--txmu);">${student.branch}</span>
      <span style="color:var(--T);">—</span>
      <span style="color:var(--txmu);">—</span>
      <span style="color:var(--G);font-weight:600;">—</span>
    </div>
  `).join('');
}

async function loadBranchPlacementStats() {
  try {
    const res = await fetch(`${API_ROOT}/api/placements/branch-stats`);
    const data = await res.json();
    if (data.success && data.branchStats) {
      renderBranchChart(data.branchStats);
    }
  } catch (err) {
    console.error('loadBranchPlacementStats error:', err);
  }
}

async function loadCompanyPlacementStats() {
  try {
    const res = await fetch(`${API_ROOT}/api/placements/company-stats`);
    const data = await res.json();
    if (data.success && data.companyStats) {
      renderCompanyStats(data.companyStats);
    }
  } catch (err) {
    console.error('loadCompanyPlacementStats error:', err);
  }
}

async function loadSalaryStats() {
  try {
    const res = await fetch(`${API_ROOT}/api/placements/salary-stats`);
    const data = await res.json();
    if (data.success && data.salaryStats) {
      const stats = data.salaryStats;
      // Update salary statistics display
      console.log('Salary Stats:', stats);
    }
  } catch (err) {
    console.error('loadSalaryStats error:', err);
  }
}

async function loadTopCompanies() {
  try {
    const res = await fetch(`${API_ROOT}/api/placements/top-companies`);
    const data = await res.json();
    if (data.success && data.topCompanies) {
      renderTopCompanies(data.topCompanies);
    }
  } catch (err) {
    console.error('loadTopCompanies error:', err);
  }
}

function renderTopCompanies(companies) {
  console.log('Top Companies:', companies);
  // Render top recruiting companies
}

function renderBranchChart(branchStats) {
  console.log('Branch Stats:', branchStats);
  // Render branch-wise placement chart
}

function renderCompanyStats(companyStats) {
  console.log('Company Stats:', companyStats);
  // Render company-wise placement statistics
}

async function exportPlacementReport() {
  try {
    const res = await fetch(`${API_ROOT}/api/placements/report`);
    const data = await res.json();
    if (data.success && data.report) {
      // Convert to CSV and download
      const csv = convertToCSV(data.report);
      downloadCSV(csv, 'placements_report.csv');
      showToast('Report exported successfully');
    }
  } catch (err) {
    console.error('exportPlacementReport error:', err);
    showToast('Failed to export report');
  }
}

function convertToCSV(data) {
  const headers = ['Roll Number', 'Name', 'Branch', 'Year', 'CGPA', 'Status', 'Company', 'Job Title', 'Package'];
  const rows = data.map(record => [
    record.rollNumber,
    record.name,
    record.branch,
    record.year,
    record.cgpa,
    record.status,
    record.company,
    record.jobTitle,
    record.package
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return csvContent;
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// Initialize placement tracking on page load
async function initPlacementTracking() {
  await loadPlacementStats();
  await loadStudentPlacementStatus();
  await loadBranchPlacementStats();
  await loadTopCompanies();
  await loadSalaryStats();
}

// Make functions globally available
window.exportPlacementReport = exportPlacementReport;
window.initPlacementTracking = initPlacementTracking;
window.loadPlacementStats = loadPlacementStats;
