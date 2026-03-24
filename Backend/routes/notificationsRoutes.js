const express = require('express');
const { getNotificationsCount, getStudentNotifications } = require('../controllers/notificationController');

const router = express.Router();

router.get('/count', getNotificationsCount);
router.get('/student/:id', getStudentNotifications);

module.exports = router;
