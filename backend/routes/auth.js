import express from 'express';
import { googleLogin, getProfile } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/google  — verify Google ID token
router.post('/google', googleLogin);

// GET  /api/auth/me      — get current user profile (protected)
router.get('/me', authenticateToken, getProfile);

export default router;
