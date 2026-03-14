const express = require('express');
const router = express.Router();
const { tpoSignup, tpoLogin } = require('../controllers/tpoController');

router.post('/signup', tpoSignup);
router.post('/login', tpoLogin);

module.exports = router;
