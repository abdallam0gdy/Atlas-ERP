const express = require('express');
const router = express.Router();
const { login, getMe, updateProfile, changePassword } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validate, loginSchema } = require('../utils/validators');

// POST /api/auth/login — Public
router.post('/login', validate(loginSchema), login);

// GET /api/auth/me — Protected
router.get('/me', authenticate, getMe);

// PUT /api/auth/profile — Protected
router.put('/profile', authenticate, updateProfile);

// PUT /api/auth/change-password — Protected
router.put('/change-password', authenticate, changePassword);

module.exports = router;

