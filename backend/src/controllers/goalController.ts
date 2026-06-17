import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { Goal } from '../models/Goal';
import { User } from '../models/User';

export const createGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { milestones, ...restData } = req.body;
    
    // Process milestones to ensure they have proper structure
    const processedMilestones = milestones?.map((milestone: any) => ({
      title: milestone.title,
      dueDate: milestone.dueDate || new Date(),
      completed: false,
    })) || [];

    const goalData = {
      ...restData,
      milestones: processedMilestones,
      userId: req.user._id,
    };

    const goal = new Goal(goalData);
    await goal.save();

    res.status(201).json({
      message: 'Goal created successfully',
      goal,
    });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
};

export const getGoals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, category } = req.query;
    const query: any = { userId: req.user._id };
    
    if (status) {
      query.status = status;
    }
    
    if (category) {
      query.category = category;
    }

    const goals = await Goal.find(query).sort({ targetDate: 1, createdAt: -1 });

    // Calculate additional stats
    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const activeGoals = goals.filter(g => g.status === 'active').length;
    const averageProgress = totalGoals > 0 
      ? goals.reduce((sum, g) => sum + g.progress, 0) / totalGoals 
      : 0;

    res.json({ 
      goals,
      stats: {
        total: totalGoals,
        completed: completedGoals,
        active: activeGoals,
        averageProgress: Math.round(averageProgress),
      }
    });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
};

export const getGoalById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    res.json({ goal });
  } catch (error) {
    console.error('Get goal by id error:', error);
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
};

export const updateGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { milestones, ...updateData } = req.body;
    
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    // Update basic fields
    Object.assign(goal, updateData);
    
    // Update milestones if provided
    if (milestones) {
      goal.milestones = milestones.map((m: any) => ({
        title: m.title,
        dueDate: m.dueDate,
        completed: m.completed || false,
        completedAt: m.completedAt,
      }));
    }

    await goal.save();

    res.json({
      message: 'Goal updated successfully',
      goal,
    });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
};

export const deleteGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
};

export const updateMilestone = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { milestoneId } = req.params;
    const { completed, title, dueDate } = req.body;

    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    // Find milestone by _id
    const milestone = goal.milestones.find(
      (m) => m._id?.toString() === milestoneId
    );

    if (!milestone) {
      res.status(404).json({ error: 'Milestone not found' });
      return;
    }

    // Update milestone fields
    if (completed !== undefined) {
      milestone.completed = completed;
      if (completed) {
        milestone.completedAt = new Date();
      } else {
        milestone.completedAt = undefined;
      }
    }
    
    if (title) {
      milestone.title = title;
    }
    
    if (dueDate) {
      milestone.dueDate = new Date(dueDate);
    }

    // Update progress percentage
    const completedCount = goal.milestones.filter(m => m.completed).length;
    goal.progress = (completedCount / goal.milestones.length) * 100;

    // Update goal status if all milestones are completed
    if (goal.progress === 100 && goal.status === 'active') {
      goal.status = 'completed';
      
      // Award XP for completing goal
      const xpReward = Math.floor(goal.progress * 10);
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { 'stats.xp': xpReward }
      });
    }

    await goal.save();

    res.json({
      message: 'Milestone updated successfully',
      goal,
      milestone,
    });
  } catch (error) {
    console.error('Update milestone error:', error);
    res.status(500).json({ error: 'Failed to update milestone' });
  }
};

// Additional helper endpoints

export const addMilestone = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, dueDate } = req.body;
    
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    goal.milestones.push({
      title,
      dueDate: new Date(dueDate),
      completed: false,
    });

    await goal.save();

    res.json({
      message: 'Milestone added successfully',
      goal,
    });
  } catch (error) {
    console.error('Add milestone error:', error);
    res.status(500).json({ error: 'Failed to add milestone' });
  }
};

export const deleteMilestone = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { milestoneId } = req.params;
    
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    const milestoneIndex = goal.milestones.findIndex(
      (m) => m._id?.toString() === milestoneId
    );

    if (milestoneIndex === -1) {
      res.status(404).json({ error: 'Milestone not found' });
      return;
    }

    goal.milestones.splice(milestoneIndex, 1);
    await goal.save();

    res.json({
      message: 'Milestone deleted successfully',
      goal,
    });
  } catch (error) {
    console.error('Delete milestone error:', error);
    res.status(500).json({ error: 'Failed to delete milestone' });
  }
};

export const getGoalProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    const completedMilestones = goal.milestones.filter(m => m.completed).length;
    const totalMilestones = goal.milestones.length;
    const remainingDays = Math.ceil(
      (goal.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    res.json({
      goalId: goal._id,
      title: goal.title,
      progress: goal.progress,
      completedMilestones,
      totalMilestones,
      remainingDays: Math.max(0, remainingDays),
      status: goal.status,
      isOnTrack: remainingDays > 0 && goal.progress >= 50,
    });
  } catch (error) {
    console.error('Get goal progress error:', error);
    res.status(500).json({ error: 'Failed to get goal progress' });
  }
};