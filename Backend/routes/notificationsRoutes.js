const express = require('express');
const { getNotificationsCount } = require('../controllers/notificationController');

const router = express.Router();

router.get('/count', getNotificationsCount);

module.exports = router;
