import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Habit } from '../models/Habit';
import { User } from '../models/User';

export const createHabit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const habitData = {
      ...req.body,
      userId: req.user._id,
    };

    const habit = new Habit(habitData);
    await habit.save();

    res.status(201).json({
      message: 'Habit created successfully',
      habit,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create habit' });
  }
};

export const getHabits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { isActive } = req.query;
    const query: any = { userId: req.user._id };
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const habits = await Habit.find(query).sort({ createdAt: -1 });

    res.json({ habits });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
};

export const getHabitById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!habit) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }

    res.json({ habit });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch habit' });
  }
};

export const updateHabit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!habit) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }

    res.json({
      message: 'Habit updated successfully',
      habit,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update habit' });
  }
};

export const deleteHabit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const habit = await Habit.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!habit) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }

    res.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete habit' });
  }
};

export const trackHabit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, completed, note } = req.body;
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!habit) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }

    const today = new Date(date || Date.now());
    today.setHours(0, 0, 0, 0);

    const existingEntry = habit.completions.find(
      (c) => new Date(c.date).toDateString() === today.toDateString()
    );

    if (existingEntry) {
      existingEntry.completed = completed;
      existingEntry.note = note;
    } else {
      habit.completions.push({
        date: today,
        completed,
        note,
      });
    }

    // Update streak
    if (completed) {
      habit.streak++;
      if (habit.streak > habit.longestStreak) {
        habit.longestStreak = habit.streak;
      }
      habit.totalCompletions++;
    } else {
      habit.streak = 0;
    }

    await habit.save();

    // Update user XP
    if (completed) {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { 'stats.xp': 10 },
      });
    }

    res.json({
      message: 'Habit tracked successfully',
      habit,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to track habit' });
  }
};

export const getHabitStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const habits = await Habit.find({ userId: req.user._id });
    
    const stats = {
      totalHabits: habits.length,
      activeHabits: habits.filter(h => h.isActive).length,
      totalCompletions: habits.reduce((sum, h) => sum + h.totalCompletions, 0),
      longestStreak: Math.max(...habits.map(h => h.longestStreak), 0),
      currentStreak: Math.max(...habits.map(h => h.streak), 0),
      completionRate: 0,
    };

    if (stats.totalCompletions > 0) {
      const totalPossible = habits.length * 30; // Last 30 days
      stats.completionRate = (stats.totalCompletions / totalPossible) * 100;
    }

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch habit stats' });
  }
};