require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const authRoutes      = require('./src/routes/auth');
const profileRoutes   = require('./src/routes/profile');
const foodRoutes      = require('./src/routes/food');
const workoutRoutes   = require('./src/routes/workout');
const weightRoutes    = require('./src/routes/weight');
const statsRoutes     = require('./src/routes/stats');
const chatRoutes      = require('./src/routes/chat');
const exerciseRoutes  = require('./src/routes/exercises');
const coachRoutes     = require('./src/routes/coach');
const plansRoutes     = require('./src/routes/plans');
const messagesRoutes  = require('./src/routes/messages');
const waterRoutes          = require('./src/routes/water');
const coachAnalyticsRoutes = require('./src/routes/coachAnalytics');

const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);

// Trust proxy (for hosting on Render/Railway)
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  /\.vercel\.app$/,
].filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const allowed = allowedOrigins.some(o =>
      o instanceof RegExp ? o.test(origin) : o === origin
    );
    cb(allowed ? null : new Error('CORS not allowed'), allowed);
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '2mb' }));

// Rate limiters
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
const authLimiter    = rateLimit({ windowMs: 15 * 60 * 1000, max: 10,  standardHeaders: true, legacyHeaders: false });

app.use('/api', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Routes
app.use('/api/auth',      authRoutes);
app.use('/api/profile',   profileRoutes);
app.use('/api/food',      foodRoutes);
app.use('/api/workout',   workoutRoutes);
app.use('/api/weight',    weightRoutes);
app.use('/api/stats',     statsRoutes);
app.use('/api/chat',      chatRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/coach',     coachRoutes);
app.use('/api',           plansRoutes);   // /api/plan and /api/diet-plan
app.use('/api/messages',  messagesRoutes);
app.use('/api/water',          waterRoutes);
app.use('/api/coach-analytics', coachAnalyticsRoutes);

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', app: 'FitBot' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
});

// ── Socket.io ─────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
});

// Socket auth middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: user ${socket.userId}`);

  // Join personal room
  socket.join(`user_${socket.userId}`);

  // Send message via socket (real-time only — REST POST /api/messages/:id also saves to DB)
  socket.on('send_message', async ({ receiverId, content, imageUrl }) => {
    try {
      const msg = await prisma.coachMessage.create({
        data: { senderId: socket.userId, receiverId, content: content || '', imageUrl: imageUrl || null },
      });
      // Emit to receiver
      io.to(`user_${receiverId}`).emit('receive_message', msg);
      // Confirm to sender
      socket.emit('message_sent', msg);
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('typing', ({ receiverId }) => {
    io.to(`user_${receiverId}`).emit('partner_typing', { senderId: socket.userId });
  });

  socket.on('stop_typing', ({ receiverId }) => {
    io.to(`user_${receiverId}`).emit('partner_stop_typing', { senderId: socket.userId });
  });

  socket.on('mark_read', ({ senderId }) => {
    prisma.coachMessage.updateMany({
      where: { senderId, receiverId: socket.userId, read: false },
      data: { read: true },
    }).catch(console.error);
    io.to(`user_${senderId}`).emit('messages_read', { by: socket.userId });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: user ${socket.userId}`);
  });
});

// ── Weekly Reminders ─────────────────────────────────────
require('./src/utils/reminderJob');

// ── Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => console.log(`🏋️ FitBot server running on port ${PORT}`));
