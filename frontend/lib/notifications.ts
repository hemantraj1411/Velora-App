import { api } from './api';

// Request permission for browser notifications
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

// Show a browser notification
export function showBrowserNotification(title: string, body: string, tag?: string) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  
  const options: NotificationOptions = {
    body: body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    silent: false,
  };
  
  if (tag) options.tag = tag;
  
  const notification = new Notification(title, options);
  
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
  
  setTimeout(() => notification.close(), 5000);
}

// Check for due tasks and send notifications
export async function checkDueTasks() {
  try {
    const response = await api.get('/tasks?status=pending');
    const tasks = response.data.tasks;
    const now = new Date();
    
    for (const task of tasks) {
      const dueDate = new Date(task.dueDate);
      const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      // Send notification 1 hour before due
      if (hoursUntilDue <= 1 && hoursUntilDue > 0 && !task.reminderSent) {
        showBrowserNotification(
          'Task Due Soon!',
          `"${task.title}" is due in ${Math.ceil(hoursUntilDue)} hour(s)`
        );
        
        // Mark reminder as sent
        await api.put(`/tasks/${task._id}`, { reminderSent: true });
      }
    }
  } catch (error) {
    console.error('Failed to check due tasks:', error);
  }
}

// Start checking for due tasks every hour
if (typeof window !== 'undefined') {
  requestNotificationPermission();
  setInterval(checkDueTasks, 60 * 60 * 1000); // Check every hour
}