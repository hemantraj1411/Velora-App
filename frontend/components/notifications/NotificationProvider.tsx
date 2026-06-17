"use client";

import { useEffect, useState, ReactNode } from "react";
import { notificationScheduler } from "@/lib/notificationScheduler";
import { alarmSound } from "@/lib/alarmSound";
import NotificationPopup from "./NotificationPopup";
import { api } from "@/lib/api";

interface NotificationProviderProps {
  children: ReactNode;
}

export default function NotificationProvider({ children }: NotificationProviderProps) {
  const [activeNotification, setActiveNotification] = useState<any>(null);

  useEffect(() => {
    // Initialize alarm sound on user interaction
    const initAlarm = () => {
      alarmSound.init();
      document.removeEventListener('click', initAlarm);
    };
    document.addEventListener('click', initAlarm);

    // Load tasks and schedule notifications
    const loadTasks = async () => {
      try {
        const response = await api.get('/tasks');
        const tasks = response.data.tasks || [];
        const pendingTasks = tasks.filter((task: any) => task.status !== 'completed');
        notificationScheduler.rescheduleAll(pendingTasks);
      } catch (error) {
        console.error('Failed to load tasks for scheduling:', error);
      }
    };

    loadTasks();

    // Listen for notifications
    const unsubscribe = notificationScheduler.onNotification((task) => {
      setActiveNotification(task);
    });

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      unsubscribe();
      document.removeEventListener('click', initAlarm);
    };
  }, []);

  return (
    <>
      {children}
      {activeNotification && (
        <NotificationPopup
          task={activeNotification}
          onDismiss={() => setActiveNotification(null)}
        />
      )}
    </>
  );
}