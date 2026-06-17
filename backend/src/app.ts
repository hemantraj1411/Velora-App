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
// ❌ REMOVED: import teamRoutes from './routes/teamRoutes';

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

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Session middleware (required for Passport)
app.use(session({
  secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

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
// ❌ REMOVED: app.use('/api/teams', teamRoutes);

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