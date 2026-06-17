// Notification Scheduler Service
// This service handles scheduling and triggering task notifications

type NotificationCallback = (task: any) => void;

class NotificationScheduler {
  private scheduledTasks: Map<string, { task: any; timeoutId: NodeJS.Timeout }> = new Map();
  private listeners: NotificationCallback[] = [];

  constructor() {
    // Load scheduled tasks from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.loadScheduledTasks();
    }
  }

  // Schedule a task notification
  scheduleTask(task: any): void {
    if (!task.dueDate) {
      console.warn('Task has no due date, cannot schedule:', task);
      return;
    }

    // Cancel existing schedule for this task
    this.cancelTask(task._id);

    const dueDateTime = new Date(task.dueDate);
    
    // If task has due time, set exact time
    if (task.dueTime) {
      const [hours, minutes] = task.dueTime.split(':');
      dueDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      // Default to end of day (11:59 PM)
      dueDateTime.setHours(23, 59, 59, 999);
    }

    const now = new Date();
    const timeUntilDue = dueDateTime.getTime() - now.getTime();

    // If task is already past due, don't schedule
    if (timeUntilDue <= 0) {
      console.log(`Task "${task.title}" is already past due`);
      return;
    }

    // Schedule the notification
    const timeoutId = setTimeout(() => {
      this.triggerNotification(task);
    }, timeUntilDue);

    // Store the scheduled task
    this.scheduledTasks.set(task._id, {
      task,
      timeoutId,
    });

    // Save to localStorage for persistence
    this.saveScheduledTasks();

    console.log(`📅 Scheduled notification for task "${task.title}" at ${dueDateTime.toLocaleString()}`);
  }

  // Cancel a scheduled task
  cancelTask(taskId: string): void {
    const scheduled = this.scheduledTasks.get(taskId);
    if (scheduled) {
      clearTimeout(scheduled.timeoutId);
      this.scheduledTasks.delete(taskId);
      this.saveScheduledTasks();
      console.log(`❌ Cancelled notification for task: ${scheduled.task.title}`);
    }
  }

  // Trigger notification for a task
  private triggerNotification(task: any): void {
    // Remove from scheduled tasks
    this.scheduledTasks.delete(task._id);
    this.saveScheduledTasks();

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(task);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });

    console.log(`🔔 Notification triggered for task: "${task.title}"`);
  }

  // Add a notification listener
  onNotification(callback: NotificationCallback): () => void {
    this.listeners.push(callback);
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Get all scheduled tasks
  getScheduledTasks(): any[] {
    return Array.from(this.scheduledTasks.values()).map(s => s.task);
  }

  // Clear all scheduled notifications
  clearAll(): void {
    this.scheduledTasks.forEach((scheduled) => {
      clearTimeout(scheduled.timeoutId);
    });
    this.scheduledTasks.clear();
    this.saveScheduledTasks();
    console.log('🗑️ All scheduled notifications cleared');
  }

  // Save scheduled tasks to localStorage for persistence
  private saveScheduledTasks(): void {
    if (typeof window === 'undefined') return;
    
    const tasks = Array.from(this.scheduledTasks.values()).map(s => {
      const task = { ...s.task };
      // Calculate remaining time
      const dueDateTime = new Date(task.dueDate);
      if (task.dueTime) {
        const [hours, minutes] = task.dueTime.split(':');
        dueDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      } else {
        dueDateTime.setHours(23, 59, 59, 999);
      }
      task._remainingTime = Math.max(0, dueDateTime.getTime() - new Date().getTime());
      return task;
    });
    
    try {
      localStorage.setItem('scheduled_tasks', JSON.stringify(tasks));
    } catch (error) {
      console.error('Failed to save scheduled tasks:', error);
    }
  }

  // Load scheduled tasks from localStorage
  private loadScheduledTasks(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('scheduled_tasks');
      if (stored) {
        const tasks = JSON.parse(stored);
        tasks.forEach((task: any) => {
          // Reschedule tasks that are still in the future
          const dueDateTime = new Date(task.dueDate);
          if (task.dueTime) {
            const [hours, minutes] = task.dueTime.split(':');
            dueDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          }
          
          if (dueDateTime.getTime() > new Date().getTime()) {
            this.scheduleTask(task);
          }
        });
        console.log(`📂 Loaded ${tasks.length} scheduled tasks from storage`);
      }
    } catch (error) {
      console.error('Failed to load scheduled tasks:', error);
    }
  }

  // Reschedule all tasks (useful when app resumes)
  rescheduleAll(tasks: any[]): void {
    this.clearAll();
    tasks.forEach(task => {
      if (task.status !== 'completed') {
        this.scheduleTask(task);
      }
    });
  }
}

// Singleton instance
export const notificationScheduler = new NotificationScheduler();