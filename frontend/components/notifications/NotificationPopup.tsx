"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  XMarkIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from "@heroicons/react/24/outline";
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
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Play alarm sound
    alarmSound.playAlarm();

    // Send browser notification (without vibrate in options)
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('⏰ Task Reminder!', {
          body: `"${task.title}" is due now!`,
          icon: '/icon-192.png',
          requireInteraction: true,
        });
      } catch (error) {
        console.debug('Notification error:', error);
      }
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
        setRemainingTime(`⏰ ${diffMins}m remaining`);
      } else {
        const diffHours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        setRemainingTime(`⏰ ${diffHours}h ${mins}m remaining`);
      }
    };

    updateRemainingTime();
    const interval = setInterval(updateRemainingTime, 10000);

    // ✅ FIXED: Vibration using navigator.vibrate API (not in Notification options)
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }

    // Request notification permission if not granted
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

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
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
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
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 sm:bottom-4 sm:left-4 sm:right-4 sm:max-w-md sm:mx-auto z-[100] px-2 sm:px-0"
      >
        <div className="bg-[#1a2234] rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-purple-500/20 border border-[#2a3a4a] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-orange-500 p-3 sm:p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                <span className="text-xl sm:text-2xl">🔔</span>
              </div>
              <div>
                <span className="text-white font-semibold text-sm sm:text-base">Task Reminder!</span>
                <p className="text-white/80 text-xs sm:text-sm">{remainingTime}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsVisible(false);
                onDismiss();
              }}
              className="text-white hover:bg-white/20 rounded-lg p-1.5 sm:p-2 transition touch-manipulation"
            >
              <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-3 sm:p-5">
            {/* Mobile Expand/Collapse */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between text-white sm:hidden mb-2 touch-manipulation"
            >
              <span className="text-sm font-medium truncate flex-1 text-left">{task.title}</span>
              {isExpanded ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
              )}
            </button>

            {/* Task Details */}
            <div className={`${isExpanded ? 'block' : 'hidden sm:block'}`}>
              <h3 className="hidden sm:block text-lg font-bold text-white truncate">
                {task.title}
              </h3>
              {task.description && (
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}
              
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <ClockIcon className="h-4 w-4 flex-shrink-0" />
                  <span>Due: {task.dueTime || 'End of day'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                  <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-orange-400 animate-pulse">
                  <span>{remainingTime}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons - Mobile Friendly */}
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleMarkComplete}
                className="flex-1 px-4 py-3 sm:py-2 rounded-xl bg-gradient-to-r from-green-600 to-green-500 text-white font-medium hover:shadow-lg hover:shadow-green-500/25 transition-all flex items-center justify-center gap-2 touch-manipulation min-h-[48px] active:scale-95"
              >
                <CheckCircleIcon className="h-5 w-5" />
                <span>Mark Complete</span>
              </button>
              <button
                onClick={handleSnooze}
                className="px-4 py-3 sm:py-2 rounded-xl border border-[#2a3a4a] text-gray-300 hover:bg-[#2a3a4a] transition touch-manipulation min-h-[48px] flex items-center justify-center gap-2 active:scale-95"
              >
                <span>⏰</span>
                <span>Snooze 5min</span>
              </button>
            </div>

            {/* Dismiss hint for mobile */}
            <div className="mt-2 text-center sm:hidden">
              <button
                onClick={() => {
                  setIsVisible(false);
                  onDismiss();
                }}
                className="text-xs text-gray-500 hover:text-gray-400 transition touch-manipulation py-2 w-full"
              >
                Swipe down or tap to dismiss
              </button>
            </div>
          </div>

          {/* Progress bar - Mobile friendly */}
          <div className="h-1 bg-[#2a3a4a] overflow-hidden">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 60, ease: 'linear' }}
              className="h-full bg-gradient-to-r from-red-500 to-orange-500"
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}