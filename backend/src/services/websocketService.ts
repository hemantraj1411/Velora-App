import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import logger from '../utils/logger';

interface ConnectedUser {
  userId: string;
  socketId: string;
}

const connectedUsers: Map<string, ConnectedUser> = new Map();

export const initializeWebSocket = (server: HttpServer): SocketServer => {
  const io = new SocketServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.user._id;
    
    // Store connected user
    connectedUsers.set(userId, {
      userId,
      socketId: socket.id,
    });
    
    logger.info(`User ${userId} connected: ${socket.id}`);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Handle task updates
    socket.on('task:update', async (data) => {
      socket.to(`user:${data.userId}`).emit('task:updated', data);
    });

    // Handle habit updates
    socket.on('habit:update', async (data) => {
      socket.to(`user:${data.userId}`).emit('habit:updated', data);
    });

    // Handle real-time collaboration
    socket.on('collaborate:join', (data) => {
      socket.join(`collab:${data.roomId}`);
      socket.to(`collab:${data.roomId}`).emit('collaborate:user-joined', {
        userId: socket.data.user._id,
        name: socket.data.user.name,
      });
    });

    socket.on('collaborate:leave', (data) => {
      socket.leave(`collab:${data.roomId}`);
      socket.to(`collab:${data.roomId}`).emit('collaborate:user-left', {
        userId: socket.data.user._id,
      });
    });

    socket.on('collaborate:content', (data) => {
      socket.to(`collab:${data.roomId}`).emit('collaborate:content-updated', data);
    });

    // Handle notifications
    socket.on('notification:read', (data) => {
      // Mark notification as read in database
      socket.emit('notification:confirmed', { id: data.id });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      connectedUsers.delete(userId);
      logger.info(`User ${userId} disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Emit real-time updates
export const emitTaskUpdate = (userId: string, task: any): void => {
  const io = global.io;
  if (io) {
    io.to(`user:${userId}`).emit('task:updated', task);
  }
};

export const emitHabitUpdate = (userId: string, habit: any): void => {
  const io = global.io;
  if (io) {
    io.to(`user:${userId}`).emit('habit:updated', habit);
  }
};

export const emitNotification = (userId: string, notification: any): void => {
  const io = global.io;
  if (io) {
    io.to(`user:${userId}`).emit('notification:new', notification);
  }
};