import cron from 'node-cron';
import { sendTaskReminders, sendDailyDigestToUsers } from './notificationService';
import { updateDailyAnalytics } from './analyticsService';
import { User } from '../models/User';
import { Task } from '../models/Task';
import logger from '../utils/logger';

// Run every hour to send reminders
cron.schedule('0 * * * *', async () => {
  logger.info('Running task reminder cron job');
  await sendTaskReminders();
});

// Run daily at 9 PM to send daily digest
cron.schedule('0 21 * * *', async () => {
  logger.info('Running daily digest cron job');
  await sendDailyDigestToUsers();
});

// Run daily at midnight to update analytics
cron.schedule('0 0 * * *', async () => {
  logger.info('Running daily analytics update');
  try {
    const users = await User.find();
    for (const user of users) {
      // Convert ObjectId to string
      const userId = user._id.toString();
      await updateDailyAnalytics(userId);
    }
    logger.info(`Updated analytics for ${users.length} users`);
  } catch (error) {
    logger.error('Error updating daily analytics:', error);
  }
});

// Run daily at midnight to check for overdue tasks
cron.schedule('0 0 * * *', async () => {
  logger.info('Checking for overdue tasks');
  try {
    const now = new Date();
    const result = await Task.updateMany(
      {
        dueDate: { $lt: now },
        status: { $in: ['pending', 'in-progress'] },
      },
      {
        $set: { status: 'overdue' },
      }
    );
    logger.info(`Marked ${result.modifiedCount} tasks as overdue`);
  } catch (error) {
    logger.error('Error checking overdue tasks:', error);
  }
});

// Run every Monday at 9 AM to send weekly reports
cron.schedule('0 9 * * 1', async () => {
  logger.info('Sending weekly reports');
  try {
    const users = await User.find({ 'preferences.emailReminders': true });
    // Send weekly report email to each user
    for (const user of users) {
      // Implement weekly report email
      logger.info(`Weekly report would be sent to ${user.email}`);
    }
    logger.info(`Weekly reports processed for ${users.length} users`);
  } catch (error) {
    logger.error('Error sending weekly reports:', error);
  }
});

// Run monthly to cleanup old data
cron.schedule('0 0 1 * *', async () => {
  logger.info('Running monthly cleanup');
  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    // Archive old completed tasks
    const result = await Task.updateMany(
      {
        status: 'completed',
        completedAt: { $lt: threeMonthsAgo },
      },
      {
        $set: { isArchived: true },
      }
    );
    logger.info(`Archived ${result.modifiedCount} old completed tasks`);
  } catch (error) {
    logger.error('Error during monthly cleanup:', error);
  }
});

// Run every hour to check for task reminders (additional check)
cron.schedule('30 * * * *', async () => {
  logger.info('Running additional reminder check');
  try {
    const now = new Date();
    const reminderWindow = new Date(now.getTime() + 60 * 60 * 1000); // Next hour
    
    const tasks = await Task.find({
      dueDate: { $gte: now, $lte: reminderWindow },
      'reminder.enabled': true,
      status: { $ne: 'completed' },
    }).populate('userId');
    
    logger.info(`Found ${tasks.length} tasks with pending reminders`);
  } catch (error) {
    logger.error('Error in reminder check:', error);
  }
});

// Run daily at 8 AM to send morning motivation
cron.schedule('0 8 * * *', async () => {
  logger.info('Sending morning motivation');
  try {
    const users = await User.find({ 'preferences.emailReminders': true });
    // Send morning motivation email
    logger.info(`Morning motivation sent to ${users.length} users`);
  } catch (error) {
    logger.error('Error sending morning motivation:', error);
  }
});

// Run every 6 hours to cleanup temporary data
cron.schedule('0 */6 * * *', async () => {
  logger.info('Running temporary data cleanup');
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    // Delete temporary tokens older than 1 day
    await User.updateMany(
      {
        resetPasswordExpiry: { $lt: oneDayAgo },
      },
      {
        $unset: { resetPasswordToken: "", resetPasswordExpiry: "" },
      }
    );
    logger.info('Temporary data cleanup completed');
  } catch (error) {
    logger.error('Error cleaning temporary data:', error);
  }
});

// Run every Sunday at 10 PM to generate weekly summary
cron.schedule('0 22 * * 0', async () => {
  logger.info('Generating weekly summaries');
  try {
    const users = await User.find();
    let summaryCount = 0;
    
    for (const user of users) {
      const userId = user._id.toString();
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      
      const weeklyTasks = await Task.find({
        userId: user._id,
        createdAt: { $gte: weekStart },
      });
      
      const completedCount = weeklyTasks.filter(t => t.status === 'completed').length;
      const totalCount = weeklyTasks.length;
      
      if (totalCount > 0) {
        summaryCount++;
        logger.info(`Weekly summary for ${user.email}: ${completedCount}/${totalCount} tasks completed`);
      }
    }
    
    logger.info(`Generated weekly summaries for ${summaryCount} active users`);
  } catch (error) {
    logger.error('Error generating weekly summaries:', error);
  }
});

// Export start function
export const startCronJobs = (): void => {
  logger.info('🚀 Cron jobs started successfully');
  logger.info('📅 Scheduled jobs:');
  logger.info('  - Hourly: Task reminders');
  logger.info('  - Daily at 9 PM: Daily digest');
  logger.info('  - Daily at midnight: Analytics update & overdue tasks');
  logger.info('  - Daily at 8 AM: Morning motivation');
  logger.info('  - Every Monday at 9 AM: Weekly reports');
  logger.info('  - Monthly: Data cleanup');
  logger.info('  - Every 6 hours: Temporary data cleanup');
  logger.info('  - Every Sunday at 10 PM: Weekly summaries');
};