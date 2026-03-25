const Application = require('../models/Application');
const Student = require('../models/Student');
const Job = require('../models/Job');
const Offer = require('../models/Offer');
const Interview = require('../models/Interview');
const Drive = require('../models/Drive');

// Get placement statistics
const getPlacementStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const placedStudents = await Student.countDocuments({ placementStatus: 'placed' });
    const inProcessStudents = await Student.countDocuments({ placementStatus: 'in-process' });
    const unplacedStudents = await Student.countDocuments({ placementStatus: 'unplaced' });

    const totalApplications = await Application.countDocuments();
    const selectedApplications = await Application.countDocuments({ status: 'selected' });
    const rejectedApplications = await Application.countDocuments({ status: 'rejected' });
    const pendingApplications = await Application.countDocuments({ status: { $in: ['applied', 'reviewed'] } });

    const totalOffers = await Offer.countDocuments();
    const acceptedOffers = await Offer.countDocuments({ status: 'accepted' });
    const rejectedOffers = await Offer.countDocuments({ status: 'rejected' });
    const pendingOffers = await Offer.countDocuments({ status: 'pending' });

    const avgPackage = selectedApplications > 0 
      ? (await Application.aggregate([
          { $match: { status: 'selected' } },
          { $group: { _id: null, avgCtc: { $avg: '$ctc' } } }
        ]))[0]?.avgCtc || 0
      : 0;

    res.json({
      success: true,
      stats: {
        totalStudents,
        placedStudents,
        inProcessStudents,
        unplacedStudents,
        placementRate: ((placedStudents / totalStudents) * 100).toFixed(2),
        totalApplications,
        selectedApplications,
        rejectedApplications,
        pendingApplications,
        totalOffers,
        acceptedOffers,
        rejectedOffers,
        pendingOffers,
        avgPackage: avgPackage.toFixed(2)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get student placement status
const getStudentPlacementStatus = async (req, res) => {
  try {
    const students = await Student.find()
      .select('_id fullName email branch year cgpa placementStatus')
      .lean();

    const statusData = await Promise.all(
      students.map(async (student) => {
        const applications = await Application.countDocuments({ studentId: student._id });
        const selectedApps = await Application.countDocuments({ studentId: student._id, status: 'selected' });
        const offers = await Offer.countDocuments({ studentId: student._id });
        const acceptedOffers = await Offer.countDocuments({ studentId: student._id, status: 'accepted' });
        const interviews = await Interview.countDocuments({ studentId: student._id });

        return {
          ...student,
          applications,
          selectedApplications: selectedApps,
          offers,
          acceptedOffers,
          interviews,
          status: student.placementStatus
        };
      })
    );

    res.json({ success: true, students: statusData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get branch-wise placement statistics
const getBranchPlacementStats = async (req, res) => {
  try {
    const branchStats = await Student.aggregate([
      {
        $group: {
          _id: '$branch',
          totalStudents: { $sum: 1 },
          placedStudents: {
            $sum: { $cond: [{ $eq: ['$placementStatus', 'placed'] }, 1, 0] }
          },
          inProcessStudents: {
            $sum: { $cond: [{ $eq: ['$placementStatus', 'in-process'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          branch: '$_id',
          totalStudents: 1,
          placedStudents: 1,
          inProcessStudents: 1,
          unplacedStudents: { $subtract: ['$totalStudents', { $add: ['$placedStudents', '$inProcessStudents'] }] },
          placementRate: {
            $multiply: [
              { $divide: ['$placedStudents', '$totalStudents'] },
              100
            ]
          }
        }
      }
    ]);

    res.json({ success: true, branchStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get company-wise placement statistics
const getCompanyPlacementStats = async (req, res) => {
  try {
    const companyStats = await Application.aggregate([
      {
        $match: { status: 'selected' }
      },
      {
        $lookup: {
          from: 'jobs',
          localField: 'jobId',
          foreignField: '_id',
          as: 'job'
        }
      },
      { $unwind: '$job' },
      {
        $group: {
          _id: '$job.companyName',
          totalSelected: { $sum: 1 }
        }
      },
      {
        $sort: { totalSelected: -1 }
      }
    ]);

    res.json({ success: true, companyStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get top recruiting companies
const getTopRecruitingCompanies = async (req, res) => {
  try {
    const topCompanies = await Offer.aggregate([
      {
        $match: { status: 'accepted' }
      },
      {
        $group: {
          _id: '$jobId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'jobs',
          localField: '_id',
          foreignField: '_id',
          as: 'job'
        }
      },
      { $unwind: '$job' },
      {
        $project: {
          companyName: '$job.companyName',
          studentCount: '$count'
        }
      }
    ]);

    res.json({ success: true, topCompanies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get salary statistics
const getSalaryStats = async (req, res) => {
  try {
    const placements = await Offer.aggregate([
      {
        $match: { status: 'accepted' }
      },
      {
        $lookup: {
          from: 'jobs',
          localField: 'jobId',
          foreignField: '_id',
          as: 'job'
        }
      },
      { $unwind: '$job' },
      {
        $group: {
          _id: null,
          avgPackage: { $avg: '$job.ctc' },
          minPackage: { $min: '$job.ctc' },
          maxPackage: { $max: '$job.ctc' },
          medianPackage: { $avg: '$job.ctc' }
        }
      }
    ]);

    res.json({ 
      success: true, 
      salaryStats: placements[0] || { avgPackage: 0, minPackage: 0, maxPackage: 0 }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get placement timeline (month-wise)
const getPlacementTimeline = async (req, res) => {
  try {
    const timeline = await Offer.aggregate([
      {
        $match: { status: 'accepted' }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          month: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: 1
            }
          },
          placements: '$count'
        }
      }
    ]);

    res.json({ success: true, timeline });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update student placement status
const updateStudentPlacementStatus = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status } = req.body;

    if (!['placed', 'in-process', 'unplaced'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const student = await Student.findByIdAndUpdate(
      studentId,
      { placementStatus: status },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Export placement report
const getPlacementReport = async (req, res) => {
  try {
    const { branch, year } = req.query;

    let filter = {};
    if (branch) filter.branch = branch;
    if (year) filter.year = year;

    const students = await Student.find(filter);
    const report = await Promise.all(
      students.map(async (student) => {
        const offers = await Offer.findOne({ studentId: student._id, status: 'accepted' })
          .populate('jobId', 'companyName title ctc');

        return {
          rollNumber: student.rollNumber,
          name: student.fullName,
          branch: student.branch,
          year: student.year,
          cgpa: student.cgpa,
          status: student.placementStatus,
          company: offers?.jobId?.companyName || '—',
          jobTitle: offers?.jobId?.title || '—',
          package: offers?.jobId?.ctc || '—'
        };
      })
    );

    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get placement analytics by job type
const getPlacementByJobType = async (req, res) => {
  try {
    const typeStats = await Application.aggregate([
      { $match: { status: 'selected' } },
      { $lookup: { from: 'jobs', localField: 'jobId', foreignField: '_id', as: 'job' } },
      { $unwind: '$job' },
      { $group: { _id: '$job.type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({ success: true, placements: typeStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPlacementStats,
  getStudentPlacementStatus,
  getBranchPlacementStats,
  getCompanyPlacementStats,
  getTopRecruitingCompanies,
  getSalaryStats,
  getPlacementTimeline,
  updateStudentPlacementStatus,
  getPlacementReport,
  getPlacementByJobType
};

