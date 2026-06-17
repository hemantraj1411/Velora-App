import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { Types } from 'mongoose';
import { createNotification } from './notificationController';
import { Notification } from '../models/Notification';

// Helper function to check and send time-based notifications
async function checkAndSendTimeNotifications(task: any, userId: Types.ObjectId) {
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  
  // Parse due time if exists
  let dueDateTime = new Date(dueDate);
  if (task.dueTime) {
    const [hours, minutes] = task.dueTime.split(':');
    dueDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  }
  
  const timeUntilDue = dueDateTime.getTime() - now.getTime();
  const minutesUntilDue = Math.floor(timeUntilDue / (1000 * 60));
  const hoursUntilDue = Math.floor(timeUntilDue / (1000 * 60 * 60));
  
  // Send notification based on time until due
  if (minutesUntilDue <= 5 && minutesUntilDue > 0) {
    await createNotification(
      userId,
      '🔔 IMMEDIATE: Task Due Very Soon!',
      `Task "${task.title}" is due in ${minutesUntilDue} minutes!`,
      'reminder',
      task._id
    );
  } else if (minutesUntilDue <= 30 && minutesUntilDue > 5) {
    await createNotification(
      userId,
      '⏰ Task Due Soon',
      `Task "${task.title}" is due in ${minutesUntilDue} minutes.`,
      'reminder',
      task._id
    );
  } else if (hoursUntilDue <= 1 && hoursUntilDue > 0) {
    await createNotification(
      userId,
      '⏰ Task Due in 1 Hour',
      `Task "${task.title}" is due in ${hoursUntilDue} hour(s).`,
      'reminder',
      task._id
    );
  } else if (hoursUntilDue <= 24 && hoursUntilDue > 1) {
    await createNotification(
      userId,
      '📅 Task Due Today',
      `Task "${task.title}" is due today at ${task.dueTime || 'end of day'}.`,
      'reminder',
      task._id
    );
  }
}

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const taskData = {
      ...req.body,
      userId: req.user._id,
    };

    const task = new Task(taskData);
    await task.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.totalTasks': 1 },
    });

    // ❌ REMOVED: No "New Task Created" notification
    // Only schedule time-based notifications
    // Check and send time-based notifications immediately
    await checkAndSendTimeNotifications(task, req.user._id);

    res.status(201).json({
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      status,
      priority,
      category,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
      sortBy = 'dueDate',
      sortOrder = 'asc',
    } = req.query;

    const query: any = { userId: req.user._id };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.dueDate = {};
      if (startDate) query.dueDate.$gte = new Date(startDate as string);
      if (endDate) query.dueDate.$lte = new Date(endDate as string);
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      Task.countDocuments(query),
    ]);

    res.json({
      tasks,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export const getTaskById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Check if due date or time was changed
    if (req.body.dueDate || req.body.dueTime) {
      await checkAndSendTimeNotifications(task, req.user._id);
    }

    // Create notification for task completion
    if (req.body.status === 'completed' && task.status !== 'completed') {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { 'stats.completedTasks': 1, 'stats.xp': 10 },
      });
      
      await createNotification(
        req.user._id,
        '🎉 Task Completed!',
        `Great job! You completed "${task.title}" and earned 10 XP!`,
        'achievement',
        task._id
      );
    }

    res.json({
      message: 'Task updated successfully',
      task,
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

export const getTaskStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await Task.aggregate([
      { $match: { userId: new Types.ObjectId(req.user._id) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] },
          },
          overdue: {
            $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] },
          },
          highPriority: {
            $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] },
          },
        },
      },
    ]);

    res.json(stats[0] || {
      total: 0,
      completed: 0,
      pending: 0,
      inProgress: 0,
      overdue: 0,
      highPriority: 0,
    });
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({ error: 'Failed to fetch task stats' });
  }
};

// Function to check for due tasks and send reminders
export const checkDueTasksReminders = async (): Promise<void> => {
  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Tasks due in the next hour
    const urgentTasks = await Task.find({
      status: { $ne: 'completed' },
      dueDate: { $lte: oneHourFromNow, $gte: now },
      reminderSent: { $ne: true },
    });

    // Tasks due in the next 24 hours (but not in the next hour)
    const upcomingTasks = await Task.find({
      status: { $ne: 'completed' },
      dueDate: { $lte: oneDayFromNow, $gt: oneHourFromNow },
      lastDayReminderSent: { $exists: false },
    });

    // Send urgent reminders
    for (const task of urgentTasks) {
      await createNotification(
        task.userId,
        '⏰ URGENT: Task Due Soon!',
        `Task "${task.title}" is due in less than an hour!`,
        'reminder',
        task._id
      );
      
      await Task.findByIdAndUpdate(task._id, { reminderSent: true, lastReminderSent: now });
    }
    
    // Send daily reminders for upcoming tasks
    for (const task of upcomingTasks) {
      await createNotification(
        task.userId,
        '📅 Task Due Tomorrow',
        `Task "${task.title}" is due tomorrow. Plan your schedule accordingly.`,
        'reminder',
        task._id
      );
      
      await Task.findByIdAndUpdate(task._id, { lastDayReminderSent: now });
    }
  } catch (error) {
    console.error('Check due tasks error:', error);
  }
};

// Mark task as complete with XP calculation
export const completeTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const task = await Task.findOne({ _id: id, userId: req.user._id });
    
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    
    if (task.status === 'completed') {
      res.status(400).json({ error: 'Task is already completed' });
      return;
    }
    
    // Calculate XP based on priority and completion time
    let xpEarned = 10; // Base XP
    
    if (task.priority === 'high') xpEarned += 5;
    if (task.priority === 'medium') xpEarned += 3;
    
    // Bonus XP for completing early
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    if (now < dueDate) {
      const daysEarly = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      xpEarned += Math.min(daysEarly * 2, 20);
    }
    
    task.status = 'completed';
    task.completedAt = now;
    await task.save();
    
    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 
        'stats.completedTasks': 1, 
        'stats.xp': xpEarned 
      },
    });
    
    await createNotification(
      req.user._id,
      '🎉 Task Completed!',
      `Great job! You completed "${task.title}" and earned ${xpEarned} XP!`,
      'achievement',
      task._id
    );
    
    res.json({
      success: true,
      message: 'Task completed successfully',
      task,
      xpEarned,
    });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
};