import mongoose from 'mongoose';
import { Analytics } from '../models/Analytics';
import { Task } from '../models/Task';
import { Habit } from '../models/Habit';
import { User } from '../models/User';
import { calculateLevel } from '../utils/helpers';
import logger from '../utils/logger';

interface CategoryBreakdown {
  [key: string]: number;
}

interface ProductivityTrendEntry {
  date: Date;
  score: number;
  tasksCompleted: number;
  focusTime: number;
}

export const updateDailyAnalytics = async (userId: string): Promise<void> => {
  try {
    // Convert string ID to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [tasks, habits, user] = await Promise.all([
      Task.find({
        userId: userObjectId,
        createdAt: { $gte: today, $lt: tomorrow },
      }),
      Habit.find({ userId: userObjectId }),
      User.findById(userObjectId),
    ]);

    const completedTasks = tasks.filter(t => t.status === 'completed');
    const tasksCompleted = completedTasks.length;
    const tasksCreated = tasks.length;
    
    const habitsCompleted = habits.reduce((sum, habit) => {
      const todayCompletion = habit.completions.find(c => 
        new Date(c.date).toDateString() === today.toDateString() && c.completed
      );
      return sum + (todayCompletion ? 1 : 0);
    }, 0);

    const focusTime = tasks.reduce((sum, task) => sum + (task.actualTime || 0), 0);
    const xpEarned = tasksCompleted * 10 + habitsCompleted * 10;
    const completionRate = tasksCreated > 0 ? (tasksCompleted / tasksCreated) * 100 : 0;
    const productivityScore = calculateProductivityScore(tasksCompleted, habitsCompleted, focusTime);

    // Calculate average priority
    const averagePriority = calculateAveragePriority(tasks);
    
    // Get category breakdown
    const categoryBreakdown = getCategoryBreakdown(tasks);

    // Update or create analytics entry
    await Analytics.findOneAndUpdate(
      { userId: userObjectId, date: today },
      {
        $inc: {
          tasksCompleted,
          tasksCreated,
          habitsCompleted,
          focusTime,
          xpEarned,
        },
        $set: {
          productivityScore,
          'metrics.completionRate': completionRate,
          'metrics.averagePriority': averagePriority,
          'metrics.categoryBreakdown': categoryBreakdown,
        },
      },
      { upsert: true, new: true }
    );

    // Update user stats
    if (user) {
      const newXP = (user.stats.xp || 0) + xpEarned;
      const newLevel = calculateLevel(newXP);
      
      // Update streak if tasks were completed
      if (tasksCompleted > 0) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const hadActivityYesterday = await Task.findOne({
          userId: userObjectId,
          createdAt: { $gte: yesterday, $lt: today },
          status: 'completed',
        });
        
        if (hadActivityYesterday) {
          user.stats.currentStreak += 1;
        } else {
          user.stats.currentStreak = 1;
        }
        
        if (user.stats.currentStreak > user.stats.longestStreak) {
          user.stats.longestStreak = user.stats.currentStreak;
        }
      }
      
      await User.findByIdAndUpdate(userObjectId, {
        $inc: {
          'stats.xp': xpEarned,
          'stats.completedTasks': tasksCompleted,
          'stats.totalFocusTime': focusTime,
        },
        $set: {
          'stats.level': newLevel,
          'stats.currentStreak': user.stats.currentStreak,
          'stats.longestStreak': user.stats.longestStreak,
        },
      });
    }

    logger.info(`Analytics updated for user ${userId}`);
  } catch (error) {
    logger.error('Failed to update analytics:', error);
    throw error;
  }
};

const calculateProductivityScore = (
  tasksCompleted: number,
  habitsCompleted: number,
  focusTime: number
): number => {
  let score = 0;
  score += Math.min(tasksCompleted * 10, 50); // Max 50 points from tasks
  score += Math.min(habitsCompleted * 5, 25); // Max 25 points from habits
  score += Math.min(focusTime / 60, 25); // Max 25 points from focus time (25 hours)
  return Math.min(Math.round(score), 100);
};

const calculateAveragePriority = (tasks: any[]): number => {
  if (tasks.length === 0) return 0;
  
  const priorityWeight: { [key: string]: number } = { 
    high: 3, 
    medium: 2, 
    low: 1 
  };
  
  const total = tasks.reduce((sum, task) => {
    const weight = priorityWeight[task.priority] || 1;
    return sum + weight;
  }, 0);
  
  return parseFloat((total / tasks.length).toFixed(2));
};

const getCategoryBreakdown = (tasks: any[]): CategoryBreakdown => {
  const breakdown: CategoryBreakdown = {};
  tasks.forEach(task => {
    const category = task.category || 'Uncategorized';
    breakdown[category] = (breakdown[category] || 0) + 1;
  });
  return breakdown;
};

export const getProductivityTrend = async (
  userId: string, 
  days: number = 7
): Promise<ProductivityTrendEntry[]> => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    const analytics = await Analytics.find({
      userId: userObjectId,
      date: { $gte: startDate },
    }).sort({ date: 1 });

    // Fill in missing dates with zero values
    const result: ProductivityTrendEntry[] = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i <= days; i++) {
      const dateStr = currentDate.toDateString();
      const entry = analytics.find(a => a.date.toDateString() === dateStr);
      
      result.push({
        date: new Date(currentDate),
        score: entry?.productivityScore || 0,
        tasksCompleted: entry?.tasksCompleted || 0,
        focusTime: entry?.focusTime || 0,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return result;
  } catch (error) {
    logger.error('Failed to get productivity trend:', error);
    return [];
  }
};

export const getUserStats = async (userId: string): Promise<any> => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const user = await User.findById(userObjectId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);
    
    const monthStart = new Date(today);
    monthStart.setMonth(monthStart.getMonth() - 1);
    
    const [todayStats, weekStats, monthStats] = await Promise.all([
      Analytics.findOne({ userId: userObjectId, date: today }),
      Analytics.find({ userId: userObjectId, date: { $gte: weekStart } }),
      Analytics.find({ userId: userObjectId, date: { $gte: monthStart } }),
    ]);
    
    return {
      user: {
        name: user.name,
        email: user.email,
        level: user.stats.level,
        xp: user.stats.xp,
        currentStreak: user.stats.currentStreak,
        longestStreak: user.stats.longestStreak,
        totalTasks: user.stats.totalTasks,
        completedTasks: user.stats.completedTasks,
        totalFocusTime: user.stats.totalFocusTime,
        badges: user.badges,
      },
      today: {
        tasksCompleted: todayStats?.tasksCompleted || 0,
        tasksCreated: todayStats?.tasksCreated || 0,
        productivityScore: todayStats?.productivityScore || 0,
        focusTime: todayStats?.focusTime || 0,
      },
      week: {
        tasksCompleted: weekStats.reduce((sum, s) => sum + s.tasksCompleted, 0),
        averageProductivity: weekStats.length > 0 
          ? weekStats.reduce((sum, s) => sum + s.productivityScore, 0) / weekStats.length 
          : 0,
      },
      month: {
        tasksCompleted: monthStats.reduce((sum, s) => sum + s.tasksCompleted, 0),
        averageProductivity: monthStats.length > 0 
          ? monthStats.reduce((sum, s) => sum + s.productivityScore, 0) / monthStats.length 
          : 0,
      },
    };
  } catch (error) {
    logger.error('Failed to get user stats:', error);
    throw error;
  }
};

export const getLeaderboardData = async (limit: number = 10): Promise<any[]> => {
  try {
    const users = await User.find({})
      .sort({ 'stats.xp': -1 })
      .limit(limit)
      .select('name stats.xp stats.level stats.currentStreak avatar');
    
    return users.map((user, index) => ({
      rank: index + 1,
      name: user.name,
      xp: user.stats.xp,
      level: user.stats.level,
      streak: user.stats.currentStreak,
      avatar: user.avatar,
    }));
  } catch (error) {
    logger.error('Failed to get leaderboard data:', error);
    return [];
  }
};