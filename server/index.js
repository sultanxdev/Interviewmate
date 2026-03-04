import './env.js';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth.js';
import interviewRoutes from './routes/interview.js';
import userRoutes from './routes/user.js';
import paymentRoutes from './routes/payment.js';
import sessionRoutes from './routes/session.js';
import reportRoutes from './routes/report.js';
import analyticsRoutes from './routes/analytics.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/interviewmate')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/user', userRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Global Express error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// ── Start server (auto-retry next port if busy) ───────────────────────────
const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`🚀 InterviewMate server running on port ${port}`);
    console.log(`📡 HTTP API ready — no WebSocket dependencies`);
    if (port !== Number(process.env.PORT || 5000)) {
      console.warn(`⚠️  Default port was busy — using port ${port} instead. Update VITE_API_URL if needed.`);
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️  Port ${port} in use — retrying on ${port + 1}…`);
      server.close();
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
};

startServer(Number(process.env.PORT || 5000));