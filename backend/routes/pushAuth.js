import express from 'express';
import {
  getVapidPublicKey,
  saveSubscription,
  removeSubscription,
  initiateLogin,
  checkStatus,
  respondToRequest,
} from '../controllers/pushAuthController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ─── Public routes ─────────────────────────────────────────
// GET  /api/push-auth/vapid-public-key  → Get VAPID public key for frontend
router.get('/vapid-public-key', getVapidPublicKey);

// POST /api/push-auth/initiate          → Start push login (send notification)
router.post('/initiate', initiateLogin);

// GET  /api/push-auth/status/:requestId → Poll login request status
router.get('/status/:requestId', checkStatus);

// POST /api/push-auth/respond           → Approve/Deny login request
router.post('/respond', respondToRequest);

// ─── Protected routes (user must be logged in) ────────────
// POST   /api/push-auth/subscribe       → Save push subscription
router.post('/subscribe', authenticateToken, saveSubscription);

// DELETE /api/push-auth/subscribe       → Remove push subscription
router.delete('/subscribe', authenticateToken, removeSubscription);

export default router;
