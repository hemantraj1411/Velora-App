// src/globals.d.ts
import { Server as SocketServer } from 'socket.io';
import { RedisClientType } from 'redis';

declare namespace NodeJS {
  interface ProcessEnv {
    // Server Configuration
    PORT?: string;
    NODE_ENV?: string;
    FRONTEND_URL?: string;
    
    // Database
    MONGODB_URI?: string;
    
    // Redis
    REDIS_HOST?: string;
    REDIS_PORT?: string;
    REDIS_PASSWORD?: string;
    
    // JWT
    JWT_SECRET?: string;
    JWT_REFRESH_SECRET?: string;
    JWT_EXPIRES_IN?: string;
    JWT_REFRESH_EXPIRES_IN?: string;
    
    // AI APIs
    GROQ_API_KEY?: string;
    GROQ_MODEL?: string;
    OPENAI_API_KEY?: string;
    GEMINI_API_KEY?: string;
    
    // Email
    SMTP_HOST?: string;
    SMTP_PORT?: string;
    SMTP_USER?: string;
    SMTP_PASS?: string;
    EMAIL_FROM?: string;
    
    // Google OAuth
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    GOOGLE_CALLBACK_URL?: string;
    
    // WebSocket
    SOCKET_PORT?: string;
    
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS?: string;
    RATE_LIMIT_MAX_REQUESTS?: string;
    
    // File Upload
    MAX_FILE_SIZE?: string;
    ALLOWED_FILE_TYPES?: string;
  }
}

// Global object extensions
declare global {
  var io: SocketServer | undefined;
  var redisClient: RedisClientType | undefined;
  
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Fix for process object
declare var process: NodeJS.Process;

// Fix for __dirname in ES modules
declare var __dirname: string;
declare var __filename: string;

// Export nothing to make this a module
export {};