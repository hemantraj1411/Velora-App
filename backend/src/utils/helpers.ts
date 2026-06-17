import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const calculateLevel = (xp: number): number => {
  const thresholds = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000];
  let level = 1;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getDateRange = (period: 'day' | 'week' | 'month'): { start: Date; end: Date } => {
  const end = new Date();
  const start = new Date();
  
  switch (period) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      break;
  }
  
  return { start, end };
};

export const calculateStreak = (dates: Date[]): number => {
  if (dates.length === 0) return 0;
  
  let streak = 1;
  const sortedDates = dates.sort((a, b) => b.getTime() - a.getTime());
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let currentDate = today;
  for (const date of sortedDates) {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    if (checkDate.getTime() === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (checkDate.getTime() === currentDate.getTime() - 86400000) {
      streak++;
      currentDate = checkDate;
    } else {
      break;
    }
  }
  
  return streak;
};

export const sanitizeHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};