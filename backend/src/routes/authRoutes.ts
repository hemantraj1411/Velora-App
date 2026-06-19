import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import {
  register,
  login,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
  logout,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

// Email/Password routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

// Helper function to get JWT secret with proper type
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return secret;
};

const getJwtRefreshSecret = (): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
  }
  return secret;
};

// ==================== ✅ UPDATED GOOGLE OAUTH ROUTES ====================

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  // ✅ Initiate Google login with proper scope handling
  router.get('/google', (req, res, next) => {
    // ✅ FIX: Safely extract scope from query parameter
    let scope = 'email profile';
    
    if (req.query.scope) {
      if (typeof req.query.scope === 'string') {
        scope = req.query.scope;
      } else if (Array.isArray(req.query.scope) && req.query.scope.length > 0) {
        scope = req.query.scope[0] as string;
      }
    }
    
    logger.info(`🔑 Google auth initiated with scope: ${scope}`);
    
    // Use passport to authenticate with Google
    passport.authenticate('google', {
      scope: scope.split(' '),
      prompt: 'select_account',
      accessType: 'offline',
      session: false,
    })(req, res, next);
  });
  
  // ✅ IMPROVED Google callback with better error handling
  router.get('/google/callback',
    (req, res, next) => {
      logger.info(`📥 Google callback received`);
      logger.info(`📥 Query params:`, req.query);
      logger.info(`📥 Session ID:`, req.sessionID);
      next();
    },
    (req, res, next) => {
      // ✅ Custom passport authenticate with error handling
      passport.authenticate('google', { 
        session: false,
        failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}?error=google_auth_failed`,
        failureMessage: true,
      })(req, res, (err: any) => {
        if (err) {
          logger.error('❌ Passport authentication error:', err);
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          return res.redirect(`${frontendUrl}?error=${encodeURIComponent(err.message)}`);
        }
        next();
      });
    },
    (req, res) => {
      try {
        const user = req.user as any;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        
        // ✅ Check if user exists
        if (!user) {
          logger.error('❌ No user returned from Google');
          return res.redirect(`${frontendUrl}?error=no_user_found`);
        }
        
        // ✅ Check if user has email
        if (!user.email) {
          logger.error('❌ User has no email:', user);
          return res.redirect(`${frontendUrl}?error=no_email_provided`);
        }
        
        logger.info(`✅ Google auth successful for user: ${user.email}`);
        
        // Generate JWT token
        const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
        const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
        
        const token = jwt.sign(
          { userId: user._id, email: user.email }, 
          getJwtSecret(),
          { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
        );
        
        const refreshToken = jwt.sign(
          { userId: user._id, email: user.email },
          getJwtRefreshSecret(),
          { expiresIn: refreshExpiresIn as jwt.SignOptions['expiresIn'] }
        );
        
        // ✅ Redirect with query params (not hash) for better compatibility
        logger.info(`✅ Redirecting to: ${frontendUrl}/auth/callback?token=...&refreshToken=...`);
        res.redirect(`${frontendUrl}/auth/callback?token=${token}&refreshToken=${refreshToken}`);
      } catch (error) {
        logger.error('❌ Google callback error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}?error=${encodeURIComponent((error as Error).message)}`);
      }
    }
  );
}

export default router;