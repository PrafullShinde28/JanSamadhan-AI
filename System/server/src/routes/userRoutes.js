const express = require('express');
const router = express.Router();
const { getUsers, updateUser, getWorkers } = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/auth');

// All user management routes require login
router.use(requireAuth);

// Endpoint to fetch department workers (accessible by Admins to assign complaints)
router.get('/workers', requireRole(['Admin']), getWorkers);

// General User CRUD accessible by Admin only
router.get('/', requireRole(['Admin']), getUsers);
router.patch('/:id', requireRole(['Admin']), updateUser);

module.exports = router;
