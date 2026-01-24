import './env.js';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import routes
import authRoutes from './routes/auth.js';
import interviewRoutes from './routes/interview.js';
import userRoutes from './routes/user.js';
import paymentRoutes from './routes/payment.js';
import sessionRoutes from './routes/session.js';
import reportRoutes from './routes/report.js';
import analyticsRoutes from './routes/analytics.js';

// Import WebSocket components
import socketAuthMiddleware from './websocket/middleware/auth.js';
import { registerSessionHandlers } from './websocket/handlers/sessionHandler.js';
import { registerAudioHandlers, registerTranscriptHandlers } from './websocket/handlers/audioHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server for both Express and Socket.IO
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// WebSocket authentication middleware
io.use(socketAuthMiddleware);

// WebSocket connection handler
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}, User: ${socket.userId}`);

  // Register all event handlers
  registerSessionHandlers(io, socket);
  registerAudioHandlers(io, socket);
  registerTranscriptHandlers(io, socket);

  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected: ${socket.id}, Reason: ${reason}`);
  });
});

// Make io accessible to routes (if needed)
app.set('io', io);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/interviewmate')
  .then(() => console.log('Server Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection errors:', err));

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
});