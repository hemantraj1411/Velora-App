import { User } from '../models/User';
import { Task } from '../models/Task';
import { sendEmail, sendReminderEmail } from './emailService';
import logger from '../utils/logger';

export const sendTaskReminders = async (): Promise<void> => {
  try {
    const now = new Date();
    const reminderWindow = new Date(now.getTime() + 60 * 60 * 1000); // Next hour
    
    const tasks = await Task.find({
      dueDate: { $gte: now, $lte: reminderWindow },
      'reminder.enabled': true,
      status: { $ne: 'completed' },
    }).populate('userId');

    for (const task of tasks) {
      const user = task.userId as any;
      if (user.preferences?.emailReminders) {
        await sendReminderEmail(user.email, task);
        logger.info(`Reminder sent for task: ${task.title}`);
      }
    }
  } catch (error) {
    logger.error('Failed to send reminders:', error);
  }
};

export const sendDailyDigestToUsers = async (): Promise<void> => {
  try {
    const users = await User.find({
      'preferences.emailReminders': true,
    });

    for (const user of users) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const tasks = await Task.find({
        userId: user._id,
        createdAt: { $gte: todayStart },
      });

      const pendingTasks = await Task.find({
        userId: user._id,
        status: 'pending',
        dueDate: { $lte: new Date() },
      });

      await sendDailyDigest(user.email, [...tasks, ...pendingTasks]);
    }
  } catch (error) {
    logger.error('Failed to send daily digest:', error);
  }
};

// Import sendDailyDigest
import { sendDailyDigest } from './emailService';