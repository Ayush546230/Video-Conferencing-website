import webpush from 'web-push';
import crypto from 'crypto';
import User from '../models/User.js';
import PushLoginRequest from '../models/PushLoginRequest.js';
import { generateToken } from '../middleware/auth.js';

// ─── Configure Web Push (lazy init) ───────────────────────
let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || 'mailto:admin@authcraft.dev';
  if (pub && priv) {
    webpush.setVapidDetails(email, pub, priv);
    vapidConfigured = true;
    return true;
  }
  return false;
}

// ─── GET VAPID PUBLIC KEY ──────────────────────────────────
export const getVapidPublicKey = (req, res) => {
  ensureVapidConfigured();
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    return res.status(503).json({ error: 'Push notifications not configured' });
  }
  res.json({ publicKey: key });
};

// ─── SAVE PUSH SUBSCRIPTION (Protected) ────────────────────
export const saveSubscription = async (req, res) => {
  try {
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Invalid push subscription' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Ensure array exists
    if (!user.pushSubscriptions) {
      user.pushSubscriptions = [];
    }

    // Remove if already exists
    user.pushSubscriptions = user.pushSubscriptions.filter(s => s.endpoint !== subscription.endpoint);
    
    // Add new subscription
    user.pushSubscriptions.push({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    user.authMethods.push = true;
    await user.save();

    res.json({
      success: true,
      message: 'Push notifications enabled for login',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        authMethods: user.authMethods,
      },
    });
  } catch (err) {
    console.error('Save subscription error:', err);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
};

// ─── REMOVE PUSH SUBSCRIPTION (Protected) ──────────────────
export const removeSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { endpoint } = req.body;
    if (endpoint) {
      user.pushSubscriptions = user.pushSubscriptions.filter(s => s.endpoint !== endpoint);
    } else {
      user.pushSubscriptions = [];
    }

    if (user.pushSubscriptions.length === 0) {
      user.authMethods.push = false;
    }
    await user.save();

    res.json({
      success: true,
      message: 'Push notifications disabled',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        authMethods: user.authMethods,
      },
    });
  } catch (err) {
    console.error('Remove subscription error:', err);
    res.status(500).json({ error: 'Failed to remove subscription' });
  }
};

// ─── INITIATE PUSH LOGIN (Public) ──────────────────────────
export const initiateLogin = async (req, res) => {
  try {
    if (!ensureVapidConfigured()) {
      return res.status(503).json({ error: 'Push notifications not configured on server' });
    }
    const { endpoint, subscription } = req.body;

    // Find user with push enabled
    let user;
    if (endpoint) {
      user = await User.findOne({ $or: [{ 'pushSubscription.endpoint': endpoint }, { 'pushSubscriptions.endpoint': endpoint }] });
    } else if (subscription && subscription.endpoint) {
      user = await User.findOne({ $or: [{ 'pushSubscription.endpoint': subscription.endpoint }, { 'pushSubscriptions.endpoint': subscription.endpoint }] });
    }

    if (!user) {
      return res.status(404).json({ error: 'No active device subscription found.' });
    }

    // Get the matching subscription object
    let targetSub = user.pushSubscriptions?.find(s => s.endpoint === (endpoint || subscription.endpoint));
    if (!targetSub && user.pushSubscription?.endpoint === (endpoint || subscription.endpoint)) {
      targetSub = user.pushSubscription;
    }

    // Force ensure push auth is active
    if (!user.authMethods.push || !targetSub) {
      user.authMethods.push = true;
      if (subscription && subscription.endpoint) {
        targetSub = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
        };
        if (!user.pushSubscriptions) user.pushSubscriptions = [];
        user.pushSubscriptions.push(targetSub);
      }
      await user.save();
    }

    // Expire any existing pending requests for this user
    await PushLoginRequest.updateMany(
      { userId: user._id, status: 'pending' },
      { status: 'expired' }
    );

    // Create new login request
    const loginRequest = new PushLoginRequest({
      userId: user._id,
      email: user.email,
      deviceInfo: req.headers['user-agent'] || 'Unknown device',
    });
    await loginRequest.save();

    // Send push notification
    const backendUrl = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL || 'http://localhost:5000';
    const pushPayload = JSON.stringify({
      title: 'Login Request',
      body: `someone wants to login into system`,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: {
        requestId: loginRequest._id.toString(),
        token: loginRequest.token,
        url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/push-approve?requestId=${loginRequest._id}&token=${loginRequest.token}`,
        apiUrl: backendUrl
      },
      actions: [
        { action: 'approve', title: 'Allow' },
        { action: 'deny', title: 'Deny' },
      ],
    });

    try {
      await webpush.sendNotification(targetSub, pushPayload);
    } catch (pushErr) {
      console.error('Push notification send error:', pushErr);
      // If subscription expired, clean it up
      if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
        user.pushSubscriptions = user.pushSubscriptions.filter(s => s.endpoint !== targetSub.endpoint);
        if (user.pushSubscription && user.pushSubscription.endpoint === targetSub.endpoint) {
          user.pushSubscription = undefined;
        }
        if (user.pushSubscriptions.length === 0 && !user.pushSubscription) {
          user.authMethods.push = false;
        }
        await user.save();
        loginRequest.status = 'expired';
        await loginRequest.save();
        return res.status(410).json({
          error: 'Push subscription expired. Please re-enable push notifications.',
        });
      }
      return res.status(500).json({ error: 'Failed to send push notification' });
    }

    res.json({
      success: true,
      requestId: loginRequest._id.toString(),
      message: 'Push notification sent! Check your device.',
      expiresAt: loginRequest.expiresAt,
    });
  } catch (err) {
    console.error('Initiate push login error:', err);
    res.status(500).json({ error: 'Failed to initiate push login' });
  }
};

// ─── CHECK LOGIN STATUS (Public - Polling) ─────────────────
export const checkStatus = async (req, res) => {
  try {
    const { requestId } = req.params;

    const loginRequest = await PushLoginRequest.findById(requestId);

    if (!loginRequest) {
      return res.status(404).json({ status: 'expired', error: 'Login request not found or expired' });
    }

    // Check if expired
    if (new Date() > loginRequest.expiresAt) {
      loginRequest.status = 'expired';
      await loginRequest.save();
      return res.json({ status: 'expired' });
    }

    if (loginRequest.status === 'approved') {
      // Issue JWT token
      const user = await User.findById(loginRequest.userId);
      if (!user) {
        return res.status(404).json({ status: 'error', error: 'User not found' });
      }

      // Update login metadata
      user.lastLoginAt = new Date();
      user.lastLoginMethod = 'push';
      user.loginCount = (user.loginCount || 0) + 1;
      await user.save();

      const token = generateToken(user._id.toString());

      // Mark request as consumed (prevent reuse)
      loginRequest.status = 'expired';
      await loginRequest.save();

      return res.json({
        status: 'approved',
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          authMethods: user.authMethods,
          loginCount: user.loginCount,
        },
      });
    }

    if (loginRequest.status === 'denied') {
      return res.json({ status: 'denied' });
    }

    // Still pending
    res.json({
      status: 'pending',
      expiresAt: loginRequest.expiresAt,
    });
  } catch (err) {
    console.error('Check status error:', err);
    res.status(500).json({ status: 'error', error: 'Failed to check status' });
  }
};

// ─── RESPOND TO LOGIN REQUEST (From notification) ──────────
export const respondToRequest = async (req, res) => {
  try {
    const { requestId, token, action } = req.body;

    if (!requestId || !token || !action) {
      return res.status(400).json({ error: 'requestId, token, and action are required' });
    }

    if (!['approve', 'deny'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "approve" or "deny"' });
    }

    const loginRequest = await PushLoginRequest.findById(requestId);

    if (!loginRequest) {
      return res.status(404).json({ error: 'Login request not found or expired' });
    }

    // Verify token (prevents unauthorized approvals)
    if (loginRequest.token !== token) {
      return res.status(403).json({ error: 'Invalid request token' });
    }

    // Check if already resolved
    if (loginRequest.status !== 'pending') {
      return res.status(409).json({
        error: `This request has already been ${loginRequest.status}`,
        status: loginRequest.status,
      });
    }

    // Check expiry
    if (new Date() > loginRequest.expiresAt) {
      loginRequest.status = 'expired';
      await loginRequest.save();
      return res.status(410).json({ error: 'Login request has expired' });
    }

    // Update status
    loginRequest.status = action === 'approve' ? 'approved' : 'denied';
    await loginRequest.save();

    let jwtToken, userResponse;
    if (action === 'approve') {
      const user = await User.findById(loginRequest.userId);
      if (user) {
        jwtToken = generateToken(user._id.toString());
        userResponse = {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          authMethods: user.authMethods,
          loginCount: user.loginCount,
        };
      }
    }

    // Emit socket event to notify the polling client instantly
    const io = req.app.get('io');
    if (io) {
      io.to(`push-${requestId}`).emit('push-login-response', {
        status: loginRequest.status,
        token: jwtToken,
        user: userResponse
      });
    }

    res.json({
      success: true,
      status: loginRequest.status,
      token: jwtToken,
      user: userResponse,
      message: action === 'approve'
        ? 'Login approved! The requesting device will be signed in.'
        : 'Login denied. The requesting device has been blocked.',
    });
  } catch (err) {
    console.error('Respond to request error:', err);
    res.status(500).json({ error: 'Failed to process response' });
  }
};

