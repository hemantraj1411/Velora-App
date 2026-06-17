import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Task } from '../models/Task';
import axios from 'axios';

export const getCalendarEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { start, end } = req.query;
    
    const query: any = {
      userId: req.user._id,
      dueDate: {
        $gte: new Date(start as string),
        $lte: new Date(end as string),
      },
    };

    const tasks = await Task.find(query).sort({ dueDate: 1 });

    const events = tasks.map(task => ({
      id: task._id,
      title: task.title,
      start: task.dueDate,
      end: task.dueDate,
      priority: task.priority,
      status: task.status,
      category: task.category,
      description: task.description,
      allDay: !task.dueTime,
    }));

    res.json({ events });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
};

export const syncGoogleCalendar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { accessToken } = req.body;
    
    // Fetch events from Google Calendar
    const response = await axios.get('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const googleEvents = response.data.items;
    
    // Sync Google events to tasks
    const syncedTasks = [];
    for (const event of googleEvents) {
      const existingTask = await Task.findOne({
        userId: req.user._id,
        title: event.summary,
        dueDate: new Date(event.start.dateTime || event.start.date),
      });

      if (!existingTask) {
        const task = new Task({
          userId: req.user._id,
          title: event.summary,
          description: event.description || '',
          dueDate: new Date(event.start.dateTime || event.start.date),
          dueTime: event.start.dateTime ? event.start.dateTime.split('T')[1] : undefined,
          category: 'Calendar Sync',
        });
        await task.save();
        syncedTasks.push(task);
      }
    }

    res.json({
      message: `Synced ${syncedTasks.length} events from Google Calendar`,
      syncedTasks,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync Google Calendar' });
  }
};

export const getCalendarSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const settings = {
      defaultView: 'month',
      showWeekends: true,
      showTasks: true,
      showHabits: false,
      startHour: 9,
      endHour: 18,
      timezone: req.user.preferences?.timezone || 'UTC',
    };

    res.json({ settings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch calendar settings' });
  }
};

export const updateCalendarSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const settings = req.body;
    
    // Update user preferences with calendar settings
    await User.findByIdAndUpdate(req.user._id, {
      'preferences.timezone': settings.timezone,
    });

    res.json({
      message: 'Calendar settings updated successfully',
      settings,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update calendar settings' });
  }
};

// Import User model at the top
import { User } from '../models/User';