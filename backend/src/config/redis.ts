import { createClient } from 'redis';
import logger from '../utils/logger';

// Mock Redis client for when Redis is not available
const mockRedisClient = {
  get: async () => null,
  set: async () => {},
  setEx: async () => {},
  del: async () => {},
  keys: async () => [],
  quit: async () => {},
  on: () => {},
  connect: async () => {},
  isOpen: false,
  isReady: false,
};

let redisClient: any = mockRedisClient;
let isRedisAvailable = false;

export const connectRedis = async (): Promise<void> => {
  // Check if Redis should be enabled
  const useRedis = process.env.USE_REDIS === 'true';
  
  if (!useRedis) {
    logger.info('Redis is disabled (USE_REDIS not set to true)');
    return;
  }

  try {
    const actualRedisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      password: process.env.REDIS_PASSWORD,
    });

    actualRedisClient.on('connect', () => {
      logger.info('Redis connected successfully');
      isRedisAvailable = true;
    });

    actualRedisClient.on('error', (error) => {
      logger.warn('Redis connection error:', error.message);
      isRedisAvailable = false;
    });

    await actualRedisClient.connect();
    redisClient = actualRedisClient;
  } catch (error) {
    logger.warn('Failed to connect to Redis, continuing without cache');
    redisClient = mockRedisClient;
    isRedisAvailable = false;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient && redisClient !== mockRedisClient && redisClient.quit) {
    await redisClient.quit();
  }
};

// Export redisClient so it can be imported in other files
export { redisClient };

// Cache helper functions that work even without Redis
export const cacheGet = async <T>(key: string): Promise<T | null> => {
  if (!isRedisAvailable) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
};

export const cacheSet = async (key: string, value: any, ttl: number = 3600): Promise<void> => {
  if (!isRedisAvailable) return;
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    // Silently fail
  }
};

export const cacheDel = async (key: string): Promise<void> => {
  if (!isRedisAvailable) return;
  try {
    await redisClient.del(key);
  } catch (error) {
    // Silently fail
  }
};

export const cacheClearPattern = async (pattern: string): Promise<void> => {
  if (!isRedisAvailable) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    // Silently fail
  }
};