import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import morgan from 'morgan';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/auth.js';
import passkeyRoutes from './routes/passkeys.js';
import pushAuthRoutes from './routes/pushAuth.js';
import meetingRoutes from './routes/meetings.js';
import userRoutes from './routes/users.js';
import { startReminderScheduler } from './services/reminderScheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const getCorsOrigin = () => {
  if (process.env.NODE_ENV === 'development') return true; // Allow all in dev
  if (process.env.FRONTEND_URL) {
    // Handle potential comma-separated URLs and remove trailing slashes which break strict CORS
    return process.env.FRONTEND_URL.split(',').map(url => url.trim().replace(/\/$/, ''));
  }
  return 'http://localhost:3000';
};

// ─── Socket.io Initialization ──────────────────────────────
export const io = new Server(server, {
  cors: {
    origin: getCorsOrigin(),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  // Client joins a specific meeting room
  socket.on('join-room', (roomName) => {
    socket.join(roomName);
  });

  // Guest knocking to join a meeting
  socket.on('guest-knocking', (data) => {
    socket.to(data.roomName).emit('guest-knocking', { ...data.user, socketId: socket.id });
  });

  // Host admits a guest
  socket.on('admit-guest', (socketId) => {
    io.to(socketId).emit('guest-admitted');
  });

  // Host denies a guest
  socket.on('deny-guest', (socketId) => {
    io.to(socketId).emit('guest-denied');
  });

  // Client joins a push authentication room to listen for login approval
  socket.on('join-push-room', (requestId) => {
    socket.join(`push-${requestId}`);
  });

  socket.on('join-dashboard', (email) => {
    socket.join(`dashboard-${email.toLowerCase()}`);
  });
});

// ─── Connect MongoDB ───────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/auth-showcase', {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging forever
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB error:', err.message));

// ─── Security Middleware ───────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    contentSecurityPolicy: false, // Adjust for production
  })
);


app.use(
  cors({
    origin: getCorsOrigin(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Rate Limiting ─────────────────────────────────────────
// General API rate limiter (protects against general DDoS)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);

// Strict rate limiter for Authentication
const authLimiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per windowMs
  message: { error: 'Too many authentication attempts, please try again after 15 minutes' }
});

// ─── Body Parsing ──────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Session (needed for WebAuthn challenge storage) ───────
app.set('trust proxy', 1); // Trust reverse proxy (e.g., Render, Heroku) for secure cookies
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/auth-showcase',
      collectionName: 'sessions',
      ttl: 5 * 60, // 5 minutes (in seconds)
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 5 * 60 * 1000, // 5 minutes
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
  })
);

// ─── Logging ───────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Routes ────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/passkeys', authLimiter, passkeyRoutes);
app.use('/api/push-auth', authLimiter, pushAuthRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/users', userRoutes);

// ─── Health Check ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── Error Handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startReminderScheduler();
});

// ─── Render Keep-Alive ─────────────────────────────────────
// Free instances spin down after 15 minutes of inactivity.
// This periodically pings the health endpoint to keep it awake.
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL;
if (RENDER_URL) {
  setInterval(() => {
    fetch(`${RENDER_URL}/api/health`)
      .then(res => console.log(`[Keep-Alive] Pinged ${RENDER_URL} - Status: ${res.status}`))
      .catch(err => console.error(`[Keep-Alive] Ping failed:`, err.message));
  }, 14 * 60 * 1000); // 14 minutes
}

export default app;
