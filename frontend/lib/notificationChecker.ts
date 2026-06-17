import { api } from './api';
import { showBrowserNotification, requestNotificationPermission } from './notifications';

let lastCheckTime = new Date();

export async function checkForDueTasks() {
  try {
    const response = await api.get('/tasks?status=pending');
    const tasks = response.data.tasks;
    const now = new Date();
    
    for (const task of tasks) {
      const dueDate = new Date(task.dueDate);
      const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      // Send notification for tasks due within 1 hour
      if (hoursUntilDue <= 1 && hoursUntilDue > 0 && !task.reminderSent) {
        showBrowserNotification(
          '⏰ Task Due Soon!',
          `"${task.title}" is due in ${Math.ceil(hoursUntilDue)} hour(s)`
        );
        
        // Mark reminder as sent
        await api.put(`/tasks/${task._id}`, { reminderSent: true });
      }
      
      // Send notification for overdue tasks
      if (hoursUntilDue < 0 && !task.reminderSent) {
        showBrowserNotification(
          '⚠️ Task Overdue!',
          `"${task.title}" is now overdue. Please complete it as soon as possible.`
        );
        
        await api.put(`/tasks/${task._id}`, { reminderSent: true });
      }
    }
  } catch (error) {
    console.error('Failed to check due tasks:', error);
  }
}

// Start checking every 5 minutes for due tasks
if (typeof window !== 'undefined') {
  requestNotificationPermission();
  
  // Check immediately
  checkForDueTasks();
  
  // Then check every 5 minutes
  setInterval(checkForDueTasks, 5 * 60 * 1000);
}