"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, CheckCircleIcon, ClockIcon, CalendarIcon } from "@heroicons/react/24/outline";
import { alarmSound } from "@/lib/alarmSound";
import { notificationScheduler } from "@/lib/notificationScheduler";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

interface NotificationPopupProps {
  task: any;
  onDismiss: () => void;
}

export default function NotificationPopup({ task, onDismiss }: NotificationPopupProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [remainingTime, setRemainingTime] = useState("");

  useEffect(() => {
    // Play alarm sound
    alarmSound.playAlarm();

    // Send browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⏰ Task Reminder!', {
        body: `"${task.title}" is due now!`,
        icon: '/icon-192.png',
        requireInteraction: true,
      });
    }

    // Calculate remaining time until due
    const updateRemainingTime = () => {
      const dueDateTime = new Date(task.dueDate);
      if (task.dueTime) {
        const [hours, minutes] = task.dueTime.split(':');
        dueDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
      const diffMs = dueDateTime.getTime() - new Date().getTime();
      
      if (diffMs <= 0) {
        setRemainingTime("🔔 Due now!");
        return;
      }

      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 60) {
        setRemainingTime(`⏰ ${diffMins} minute${diffMins !== 1 ? 's' : ''} remaining`);
      } else {
        const diffHours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        setRemainingTime(`⏰ ${diffHours}h ${mins}m remaining`);
      }
    };

    updateRemainingTime();
    const interval = setInterval(updateRemainingTime, 10000);

    return () => {
      clearInterval(interval);
      alarmSound.stopAlarm();
    };
  }, [task]);

  const handleMarkComplete = async () => {
    try {
      await api.put(`/tasks/${task._id}`, { status: 'completed' });
      toast.success('✅ Task marked as complete!');
      setIsVisible(false);
      onDismiss();
    } catch (error) {
      toast.error('Failed to mark task as complete');
    }
  };

  const handleSnooze = () => {
    // Snooze for 5 minutes
    const snoozeTime = new Date();
    snoozeTime.setMinutes(snoozeTime.getMinutes() + 5);
    
    const snoozeTask = {
      ...task,
      dueDate: snoozeTime.toISOString(),
      dueTime: `${snoozeTime.getHours().toString().padStart(2, '0')}:${snoozeTime.getMinutes().toString().padStart(2, '0')}`,
    };
    
    notificationScheduler.scheduleTask(snoozeTask);
    setIsVisible(false);
    onDismiss();
    toast.success('⏰ Snoozed for 5 minutes');
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-6 right-6 z-[100] max-w-md w-full"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-primary-500 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white text-2xl animate-pulse">🔔</span>
              <span className="text-white font-semibold">Task Reminder!</span>
            </div>
            <button
              onClick={() => {
                setIsVisible(false);
                onDismiss();
              }}
              className="text-white hover:bg-white/20 rounded-lg p-1 transition"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {task.description}
                  </p>
                )}
                
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <ClockIcon className="h-4 w-4" />
                    <span>Due: {task.dueTime || 'End of day'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-orange-600 dark:text-orange-400">
                    <span>{remainingTime}</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleMarkComplete}
                    className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    Mark Complete
                  </button>
                  <button
                    onClick={handleSnooze}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Snooze 5min
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}