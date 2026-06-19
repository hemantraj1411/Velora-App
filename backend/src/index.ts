// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { setupSocket } from './config/socket';
import { startCronJobs } from './services/cronJobs';
import logger from './utils/logger';
import mongoose from 'mongoose';
import app from './app';

const PORT = process.env.PORT || 5000;
let server: http.Server;

const startServer = async () => {
  try {
    // Log environment variables for debugging
    logger.info(`🔍 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔍 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    logger.info(`🔍 Google Callback URL: ${process.env.GOOGLE_CALLBACK_URL || 'Not set'}`);

    // Connect to databases
    await connectDatabase();
    await connectRedis();
    
    // Create HTTP server
    server = http.createServer(app);
    
    // Setup WebSocket
    setupSocket(server);
    
    // Start cron jobs
    startCronJobs();
    
    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📡 WebSocket ready`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Received shutdown signal, closing gracefully...');
  
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
    });
  }
  
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('Error disconnecting MongoDB:', error);
  }
  
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

startServer();

export { app, server };