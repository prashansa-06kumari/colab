/**
 * Authentication Routes
 * Handles user registration, login, and profile management
 */

const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * POST /api/auth/register
 * Register a new user account
 * Body: { name, email, password }
 */
router.post('/register', register);

/**
 * POST /api/auth/login
 * Login with existing credentials
 * Body: { email, password }
 */
router.post('/login', login);

/**
 * GET /api/auth/me
 * Get current user profile (requires authentication)
 * Headers: Authorization: Bearer <token>
 */
router.get('/me', authenticateToken, getMe);

module.exports = router;
