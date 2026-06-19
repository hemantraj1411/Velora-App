import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User';
import logger from '../utils/logger';

export const setupPassport = (): void => {
  // Only setup Google OAuth if credentials are provided
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    try {
      // ✅ Use environment variable with production fallback
      const callbackURL = process.env.GOOGLE_CALLBACK_URL || 
        (process.env.NODE_ENV === 'production' 
          ? 'https://velora-app-ih0n.onrender.com/api/auth/google/callback'
          : 'http://localhost:5000/api/auth/google/callback');

      logger.info(`🔑 Google OAuth Callback URL: ${callbackURL}`);

      passport.use(
        new GoogleStrategy(
          {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: callbackURL,
            // ✅ Add these options for better compatibility
            passReqToCallback: true,
          },
          async (req, accessToken, refreshToken, profile, done) => {
            try {
              logger.info(`🔍 Google profile received: ${profile.id} - ${profile.displayName}`);
              
              // Check if user exists with googleId
              let user = await User.findOne({ googleId: profile.id });
              
              if (!user) {
                // Check if user exists with email
                const email = profile.emails?.[0]?.value;
                if (email) {
                  user = await User.findOne({ email });
                }
                
                if (user) {
                  // Link Google account to existing user
                  user.googleId = profile.id;
                  await user.save();
                  logger.info(`✅ Google account linked to existing user: ${user.email}`);
                } else {
                  // Create new user
                  user = new User({
                    name: profile.displayName || 'Google User',
                    email: email || `${profile.id}@google.user`,
                    googleId: profile.id,
                    avatar: profile.photos?.[0]?.value || '',
                    password: Math.random().toString(36).slice(-16),
                    emailVerified: true,
                    stats: {
                      totalTasks: 0,
                      completedTasks: 0,
                      currentStreak: 0,
                      longestStreak: 0,
                      totalFocusTime: 0,
                      xp: 0,
                      level: 1,
                    },
                    preferences: {
                      theme: 'dark',
                      notifications: true,
                      emailReminders: true,
                      defaultView: 'tasks',
                      language: 'en',
                      timezone: 'UTC',
                    },
                  });
                  await user.save();
                  logger.info(`✅ New user created via Google: ${user.email}`);
                }
              }
              
              return done(null, user);
            } catch (error) {
              logger.error('❌ Google OAuth error:', error);
              return done(error as Error, undefined);
            }
          }
        )
      );
      
      logger.info('✅ Google OAuth configured successfully');
    } catch (error) {
      logger.error('❌ Failed to configure Google OAuth:', error);
    }
  } else {
    logger.warn('⚠️ Google OAuth credentials not provided. Google login disabled.');
  }

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};