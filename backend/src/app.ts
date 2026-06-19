import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import fileUpload from 'express-fileupload';
import session from 'express-session';
import passport from 'passport';
import morgan from 'morgan';
import path from 'path';

import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';
import aiRoutes from './routes/aiRoutes';
import habitRoutes from './routes/habitRoutes';
import goalRoutes from './routes/goalRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import calendarRoutes from './routes/calendarRoutes';
import noteRoutes from './routes/noteRoutes';
import notificationRoutes from './routes/notificationRoutes';

import { errorHandler } from './middleware/errorHandler';
import { authLimiter, apiLimiter } from './middleware/rateLimiter';
import logger from './utils/logger';
import { setupPassport } from './config/passport';

const app = express();

// Custom Morgan stream
const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Request logging with Morgan
app.use(morgan('combined', { stream: morganStream }));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

// ==================== UPDATED CORS CONFIGURATION ====================
const allowedOrigins = [
  'http://localhost:3000',
  'https://velora-app-three.vercel.app',
  'https://velora-app-mu.vercel.app',
  'https://velora-app-rust.vercel.app',
  'https://velora-app-ih0n.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      logger.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// ==================== ✅ UPDATED SESSION CONFIGURATION ====================
// Session middleware (required for Passport)
const isProduction = process.env.NODE_ENV === 'production';

app.use(session({
  secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    // ✅ FIX: secure: false for localhost (HTTP), true for production (HTTPS)
    secure: isProduction,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    // ✅ ADD: SameSite for better compatibility
    sameSite: isProduction ? 'none' : 'lax',
  },
  // ✅ ADD: Name to avoid conflicts
  name: 'velora.sid',
}));

// Log session configuration
logger.info(`🔐 Session configured with secure: ${isProduction}, sameSite: ${isProduction ? 'none' : 'lax'}`);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());
setupPassport();

// Rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// File upload middleware
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 },
  useTempFiles: true,
  tempFileDir: '/tmp/',
  abortOnLimit: true,
  createParentPath: true,
  safeFileNames: true,
  preserveExtension: true,
}));

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ==================== API ROUTES ====================
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/notifications', notificationRoutes);

// ==================== 404 HANDLER ====================
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// ==================== GLOBAL ERROR HANDLER ====================
app.use(errorHandler);

export default app;