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

// Google OAuth routes
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  // Initiate Google login
  router.get('/google',
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      session: false 
    })
  );
  
  // Google callback - THIS IS WHERE THE REDIRECT GOES
  router.get('/google/callback',
    passport.authenticate('google', { 
      session: false,
      failureRedirect: `${process.env.FRONTEND_URL}/?error=google_auth_failed`
    }),
    (req, res) => {
      try {
        // Generate JWT token
        const user = req.user as any;
        const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
        const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
        
        const token = jwt.sign(
          { userId: user._id }, 
          getJwtSecret(),
          { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
        );
        
        const refreshToken = jwt.sign(
          { userId: user._id },
          getJwtRefreshSecret(),
          { expiresIn: refreshExpiresIn as jwt.SignOptions['expiresIn'] }
        );
        
        // Redirect to frontend with tokens
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/callback?token=${token}&refreshToken=${refreshToken}`);
      } catch (error) {
        console.error('Google callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/?error=token_generation_failed`);
      }
    }
  );
}

export default router;