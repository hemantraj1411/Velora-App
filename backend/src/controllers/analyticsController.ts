import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Task } from '../models/Task';
import { Habit } from '../models/Habit';
import { User } from '../models/User';

interface DailyData {
  completed: number;
  total: number;
}

interface ProductivityTrend {
  date: string;
  completionRate: number;
}

interface CategoryDistribution {
  [key: string]: number;
}

interface HabitStat {
  name: string;
  streak: number;
  totalCompletions: number;
  completionRate: number;
}

interface DailyBreakdown {
  date: string;
  tasksCompleted: number;
  tasksCreated: number;
}

interface WeeklyBreakdown {
  week: number;
  tasksCompleted: number;
  productivity: number;
}

interface TopCategory {
  name: string;
  count: number;
}

export const getProductivityStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { period = 'week' } = req.query;
    let startDate = new Date();
    
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const tasks = await Task.find({
      userId: req.user._id,
      createdAt: { $gte: startDate },
    });

    const completedTasks = tasks.filter(t => t.status === 'completed');
    const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

    // Calculate daily productivity with proper typing
    const dailyData = new Map<string, DailyData>();
    tasks.forEach(task => {
      const date = task.createdAt.toDateString();
      if (!dailyData.has(date)) {
        dailyData.set(date, { completed: 0, total: 0 });
      }
      const data = dailyData.get(date)!;
      data.total++;
      if (task.status === 'completed') data.completed++;
    });

    const productivityTrend: ProductivityTrend[] = Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      completionRate: (data.completed / data.total) * 100,
    }));

    const user = await User.findById(req.user._id);
    
    res.json({
      completionRate,
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      currentStreak: user?.stats.currentStreak || 0,
      productivityTrend,
    });
  } catch (error) {
    console.error('Get productivity stats error:', error);
    res.status(500).json({ error: 'Failed to fetch productivity stats' });
  }
};

export const getTaskAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await Task.find({ userId: req.user._id });

    const priorityDistribution = {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
    };

    const categoryDistribution: CategoryDistribution = {};
    tasks.forEach(task => {
      categoryDistribution[task.category] = (categoryDistribution[task.category] || 0) + 1;
    });

    const completionByPriority = {
      high: tasks.filter(t => t.priority === 'high' && t.status === 'completed').length,
      medium: tasks.filter(t => t.priority === 'medium' && t.status === 'completed').length,
      low: tasks.filter(t => t.priority === 'low' && t.status === 'completed').length,
    };

    // Average completion time
    const completedTasks = tasks.filter(t => t.completedAt && t.createdAt);
    let avgCompletionTime = 0;
    
    if (completedTasks.length > 0) {
      const totalTime = completedTasks.reduce((sum, task) => {
        const time = task.completedAt!.getTime() - task.createdAt.getTime();
        return sum + time;
      }, 0);
      avgCompletionTime = totalTime / completedTasks.length;
    }

    res.json({
      priorityDistribution,
      categoryDistribution,
      completionByPriority,
      avgCompletionTime: Math.round(avgCompletionTime / (1000 * 60 * 60)), // hours
    });
  } catch (error) {
    console.error('Get task analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch task analytics' });
  }
};

export const getHabitAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const habits = await Habit.find({ userId: req.user._id });

    const habitStats: HabitStat[] = habits.map(habit => ({
      name: habit.name,
      streak: habit.streak,
      totalCompletions: habit.totalCompletions,
      completionRate: (habit.totalCompletions / 30) * 100, // Last 30 days
    }));

    let bestHabit: HabitStat | null = null;
    if (habitStats.length > 0) {
      bestHabit = habitStats.reduce((best, current) => 
        current.completionRate > best.completionRate ? current : best, habitStats[0]
      );
    }

    const totalCompletions = habits.reduce((sum, h) => sum + h.totalCompletions, 0);
    const activeHabits = habits.filter(h => h.isActive).length;

    res.json({
      totalHabits: habits.length,
      activeHabits,
      totalCompletions,
      bestHabit,
      habitStats,
    });
  } catch (error) {
    console.error('Get habit analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch habit analytics' });
  }
};

export const getWeeklyReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const tasks = await Task.find({
      userId: req.user._id,
      createdAt: { $gte: weekStart },
    });

    const habits = await Habit.find({ userId: req.user._id });

    const dailyBreakdown: DailyBreakdown[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayTasks = tasks.filter(t => 
        t.createdAt.toDateString() === date.toDateString()
      );
      
      dailyBreakdown.push({
        date: date.toDateString(),
        tasksCompleted: dayTasks.filter(t => t.status === 'completed').length,
        tasksCreated: dayTasks.length,
      });
    }

    const totalFocusTime = tasks.reduce((sum, t) => sum + (t.actualTime || 0), 0);
    const xpEarned = tasks.filter(t => t.status === 'completed').length * 10;
    const habitsCompleted = habits.reduce((sum, h) => {
      const weekCompletions = h.completions.filter(c => 
        new Date(c.date) >= weekStart && c.completed
      ).length;
      return sum + weekCompletions;
    }, 0);

    res.json({
      weekRange: {
        start: weekStart.toDateString(),
        end: new Date().toDateString(),
      },
      summary: {
        tasksCompleted: tasks.filter(t => t.status === 'completed').length,
        totalTasks: tasks.length,
        habitsCompleted,
        totalFocusTime: `${Math.floor(totalFocusTime / 60)}h ${totalFocusTime % 60}m`,
        xpEarned,
      },
      dailyBreakdown,
      recommendation: getWeeklyRecommendation(tasks, habits),
    });
  } catch (error) {
    console.error('Get weekly report error:', error);
    res.status(500).json({ error: 'Failed to generate weekly report' });
  }
};

export const getMonthlyReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - 1);
    monthStart.setHours(0, 0, 0, 0);

    const tasks = await Task.find({
      userId: req.user._id,
      createdAt: { $gte: monthStart },
    });

    const habits = await Habit.find({ userId: req.user._id });
    const user = await User.findById(req.user._id);

    const weeklyBreakdown: WeeklyBreakdown[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7) - 7);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      const weekTasks = tasks.filter(t => 
        t.createdAt >= weekStart && t.createdAt < weekEnd
      );
      
      const completedCount = weekTasks.filter(t => t.status === 'completed').length;
      const productivity = weekTasks.length > 0 
        ? (completedCount / weekTasks.length) * 100 
        : 0;
      
      weeklyBreakdown.push({
        week: i + 1,
        tasksCompleted: completedCount,
        productivity: Math.round(productivity),
      });
    }

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const averageProductivity = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    res.json({
      month: new Date().toLocaleString('default', { month: 'long' }),
      year: new Date().getFullYear(),
      summary: {
        totalTasks,
        completedTasks,
        averageProductivity: Math.round(averageProductivity),
        xpGained: user?.stats.xp || 0,
        levelUp: user?.stats.level || 1,
        currentStreak: user?.stats.currentStreak || 0,
        bestStreak: user?.stats.longestStreak || 0,
      },
      weeklyBreakdown,
      topCategories: getTopCategories(tasks),
    });
  } catch (error) {
    console.error('Get monthly report error:', error);
    res.status(500).json({ error: 'Failed to generate monthly report' });
  }
};

// Helper functions with proper typing
function getWeeklyRecommendation(tasks: any[], habits: any[]): string {
  const completionRate = tasks.length > 0 
    ? tasks.filter(t => t.status === 'completed').length / tasks.length 
    : 0;
  
  if (completionRate < 0.5) {
    return "Focus on completing pending tasks. Try breaking down large tasks into smaller ones.";
  } else if (completionRate < 0.8) {
    return "Good progress! Consider using the Pomodoro technique to improve focus.";
  } else {
    return "Excellent productivity! Set some challenging goals for next week.";
  }
}

function getTopCategories(tasks: any[]): TopCategory[] {
  const categories: CategoryDistribution = {};
  tasks.forEach(task => {
    categories[task.category] = (categories[task.category] || 0) + 1;
  });
  
  return Object.entries(categories)
    .map(([name, count]) => ({ 
      name, 
      count: count as number 
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

// Additional analytics endpoints
export const getRealTimeStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayTasks, pendingTasks, completedToday] = await Promise.all([
      Task.find({
        userId: req.user._id,
        createdAt: { $gte: today, $lt: tomorrow },
      }),
      Task.find({
        userId: req.user._id,
        status: 'pending',
        dueDate: { $gte: today },
      }),
      Task.find({
        userId: req.user._id,
        status: 'completed',
        completedAt: { $gte: today, $lt: tomorrow },
      }),
    ]);

    const user = await User.findById(req.user._id);

    res.json({
      today: {
        tasksCreated: todayTasks.length,
        tasksCompleted: completedToday.length,
        pendingTasks: pendingTasks.length,
      },
      streak: {
        current: user?.stats.currentStreak || 0,
        longest: user?.stats.longestStreak || 0,
      },
      productivity: {
        score: calculateProductivityScore(completedToday.length, todayTasks.length),
        level: user?.stats.level || 1,
        xp: user?.stats.xp || 0,
        xpToNextLevel: calculateXpToNextLevel(user?.stats.xp || 0),
      },
    });
  } catch (error) {
    console.error('Get real-time stats error:', error);
    res.status(500).json({ error: 'Failed to fetch real-time stats' });
  }
};

function calculateProductivityScore(completed: number, created: number): number {
  if (created === 0) return 0;
  const score = (completed / created) * 100;
  return Math.min(Math.round(score), 100);
}

function calculateXpToNextLevel(currentXp: number): number {
  const levelThresholds = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000];
  for (let i = 0; i < levelThresholds.length; i++) {
    if (currentXp < levelThresholds[i]) {
      return levelThresholds[i] - currentXp;
    }
  }
  return 0;
}