const express = require('express');
const placementController = require('../controllers/placementController');

const router = express.Router();

// Get overall placement statistics
router.get('/stats', placementController.getPlacementStats);

// Get student placement status
router.get('/student-status', placementController.getStudentPlacementStatus);

// Get branch-wise placement statistics
router.get('/branch-stats', placementController.getBranchPlacementStats);

// Get company-wise placement statistics
router.get('/company-stats', placementController.getCompanyPlacementStats);

// Get top recruiting companies
router.get('/top-companies', placementController.getTopRecruitingCompanies);

// Get salary statistics
router.get('/salary-stats', placementController.getSalaryStats);

// Get placement timeline (month-wise)
router.get('/timeline', placementController.getPlacementTimeline);

// Get placements by job type
router.get('/by-job-type', placementController.getPlacementByJobType);

// Update student placement status
router.put('/student/:studentId/status', placementController.updateStudentPlacementStatus);

// Get placement report (with filters)
router.get('/report', placementController.getPlacementReport);

module.exports = router;
