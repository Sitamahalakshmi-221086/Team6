const fs = require('fs');

const tpocPath = './Backend/controllers/tpoController.js';
let content = fs.readFileSync(tpocPath, 'utf-8');

// Regexes to extract functions safely
const removeFunction = (text, funcName) => {
  const re = new RegExp(`const ${funcName} = async[\\s\\S]+?(?=\\nconst [a-zA-Z0-9_]+ = async|\\nmodule\\.exports = )`, 'g');
  return text.replace(re, '\n\n');
};

content = removeFunction(content, 'sendDriveRequest');
content = removeFunction(content, 'getScrapedJobs');
content = removeFunction(content, 'saveScrapedJobs');
content = removeFunction(content, 'getTPONotifications');

// Also ensure we import OpenJob and Notification and Student at top if not present
if (!content.includes("require('../models/OpenJob')")) {
  content = "const OpenJob = require('../models/OpenJob');\n" + content;
}

// Add the 123 code
const s123 = fs.readFileSync('C:/Users/bommu/Downloads/files/stage1_2_3_backend.js', 'utf-8');
const s123body = s123.split('// ═══════════════════════════════════════════════════════════════════\n// STAGE 1 — GET scraped jobs (TPO sees them first)\n//   GET /api/tpo/scraped-jobs\n// ═══════════════════════════════════════════════════════════════════')[1];
const funcsS123 = s123body.split('// ─── ADD THESE ROUTES to tpoRoutes.js ────────────────────────────')[0];

const s48 = fs.readFileSync('C:/Users/bommu/Downloads/files/stage4_8_backend.js', 'utf-8');
const funcsS48 = s48.split('const sendDriveRequestWithStudents = async (req, res) => {')[1].split('// ─── ADD THESE TO tpoRoutes.js ────────────────────────────────────')[0];
const fullS48 = `const sendDriveRequestWithStudents = async (req, res) => {` + funcsS48;

// Remove module.exports
content = content.replace(/module\.exports = {[\s\S]+};/, '');

content += `\n\n// --------- STAGE 1,2,3 ---------\n// ═══════════════════════════════════════════════════════════════════\n// STAGE 1 — GET scraped jobs (TPO sees them first)\n//   GET /api/tpo/scraped-jobs\n// ═══════════════════════════════════════════════════════════════════\n` + funcsS123;
content += `\n\n// --------- STAGE 4-8 ---------\n` + fullS48;

content += `
module.exports = {
  tpoSignup,
  tpoLogin,
  postNotice,
  scheduleDrive,
  approveDrive,
  sendReminder,
  getDrives,
  sendOTP,
  verifyOTP,
  updateTPOProfile,
  getTPOProfile,
  getPlacementRequests,
  getTPORequestsCount,
  approvePlacementRequest,
  rejectPlacementRequest,
  getTPOAnalytics,
  getTPODashboard,
  getTPONotices,
  getTPOStudentsDirectory,
  getTPOCompaniesDirectory,
  getTPOPlacementRecords,
  requestCompany,
  updateCompanyRequestStatus,
  shortlistStudentsForDrive,
  sendShortlistEmails,
  getCompanyRequests,
  
  getScrapedJobs,
  saveScrapedJobs,
  publishJobToStudents,
  publishAllNewJobs,
  getPublishedJobs,
  getJobApplicantsTpo,
  sendDriveRequestWithStudents,
  getTPONotificationsFull,
  markTPONotificationRead,
  shareDriveToStudents
};
`;

fs.writeFileSync(tpocPath, content);
console.log('Update TPO Controller successful');
