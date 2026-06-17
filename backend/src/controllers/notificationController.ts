import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Notification } from '../models/Notification';
import mongoose from 'mongoose';

export const getUserNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { limit = 50, unreadOnly = false } = req.query;
    
    const query: any = { userId: req.user._id };
    if (unreadOnly === 'true') {
      query.read = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string));
    
    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false,
    });
    
    res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    await Notification.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { read: true }
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true }
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

// Bulk delete notifications
export const deleteMultipleNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'No notification IDs provided' });
      return;
    }
    
    const result = await Notification.deleteMany({
      _id: { $in: ids },
      userId: req.user._id,
    });
    
    res.json({ 
      success: true, 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Delete multiple notifications error:', error);
    res.status(500).json({ error: 'Failed to delete notifications' });
  }
};

// Delete all notifications for a user
export const deleteAllNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await Notification.deleteMany({
      userId: req.user._id,
    });
    
    res.json({ 
      success: true, 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({ error: 'Failed to delete notifications' });
  }
};

// Helper function to create a notification
export const createNotification = async (
  userId: mongoose.Types.ObjectId,
  title: string,
  message: string,
  type: 'task' | 'reminder' | 'achievement' | 'system' = 'task',
  taskId?: mongoose.Types.ObjectId
): Promise<void> => {
  try {
    await Notification.create({
      userId,
      title,
      message,
      type,
      taskId,
    });
    console.log(`✅ Notification created: ${title} for user ${userId}`);
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

// Helper to get unread count for a user
export const getUnreadCount = async (userId: mongoose.Types.ObjectId): Promise<number> => {
  try {
    return await Notification.countDocuments({
      userId,
      read: false,
    });
  } catch (error) {
    console.error('Failed to get unread count:', error);
    return 0;
  }
};

// Helper to create task reminder notifications
export const createTaskReminder = async (
  userId: mongoose.Types.ObjectId,
  taskId: mongoose.Types.ObjectId,
  taskTitle: string,
  dueDate: Date
): Promise<void> => {
  const hoursUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60));
  
  let message = '';
  if (hoursUntilDue <= 1) {
    message = `Task "${taskTitle}" is due in less than an hour!`;
  } else if (hoursUntilDue <= 24) {
    message = `Task "${taskTitle}" is due in ${hoursUntilDue} hours!`;
  } else {
    const daysUntilDue = Math.ceil(hoursUntilDue / 24);
    message = `Task "${taskTitle}" is due in ${daysUntilDue} days!`;
  }
  
  await createNotification(
    userId,
    '⏰ Task Reminder',
    message,
    'reminder',
    taskId
  );
};

// Helper to create achievement notifications
export const createAchievementNotification = async (
  userId: mongoose.Types.ObjectId,
  achievement: string,
  xpEarned: number
): Promise<void> => {
  await createNotification(
    userId,
    '🏆 Achievement Unlocked!',
    `${achievement}! You earned ${xpEarned} XP!`,
    'achievement'
  );
};