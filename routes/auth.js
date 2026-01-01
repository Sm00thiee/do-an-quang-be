const express = require('express');
const router = express.Router();
const { register, login, logout, getCurrentUser } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Routes không cần xác thực
router.post('/register', register);
router.post('/login', login);

// Routes cần xác thực
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getCurrentUser);

module.exports = router;