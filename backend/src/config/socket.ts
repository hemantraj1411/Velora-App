import { Server as HttpServer } from 'http';
import { initializeWebSocket } from '../services/websocketService';

let io: any;

export const setupSocket = (server: HttpServer): void => {
  io = initializeWebSocket(server);
  (global as any).io = io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};