const express = require('express');
const router = express.Router();
const { syncUser, getMe } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/sync', requireAuth, syncUser);
router.get('/me', requireAuth, getMe);

module.exports = router;
