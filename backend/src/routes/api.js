const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const clockController = require('../controllers/clockController');
const { authenticateToken } = require('../middleware/auth');

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Clocking routes (Protected)
router.post('/clock-in', authenticateToken, clockController.clockIn);
router.post('/clock-out', authenticateToken, clockController.clockOut);
router.get('/history', authenticateToken, clockController.getHistory);

module.exports = router;
