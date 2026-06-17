"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BellIcon, TrashIcon, TrashIcon as TrashCanIcon, CheckIcon } from "@heroicons/react/24/outline";
import { api } from "@/lib/api";
import { showBrowserNotification, requestNotificationPermission } from "@/lib/notifications";
import { notificationSound } from "@/lib/sounds";
import toast from "react-hot-toast";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'task' | 'reminder' | 'achievement' | 'system';
  read: boolean;
  createdAt: string;
  taskId?: string;
}

// Track shown notifications to prevent duplicates
const shownNotificationIds = new Set<string>();

// Show immediate notification for time-sensitive tasks
const showImmediateNotification = (notification: Notification): void => {
  if (shownNotificationIds.has(notification._id)) return;
  
  shownNotificationIds.add(notification._id);
  setTimeout(() => shownNotificationIds.delete(notification._id), 10000);
  
  // Play sound based on notification type
  if (notification.type === 'reminder') {
    notificationSound.playReminder();
  } else if (notification.type === 'achievement') {
    notificationSound.playAchievement();
  } else {
    notificationSound.play();
  }
  
  // Show browser notification
  if (Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.message,
      icon: '/icon-192.png',
    });
  }
  
  // Show toast
  toast(notification.message, {
    icon: notification.type === 'reminder' ? '⏰' : '📋',
    duration: notification.type === 'reminder' ? 10000 : 5000,
  });
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDeleteMode, setIsDeleteMode] = useState<boolean>(false);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isFetching = useRef<boolean>(false);

  useEffect(() => {
    fetchNotifications();
    requestNotificationPermission();
    
    const interval = setInterval(fetchNotifications, 30000);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsDeleteMode(false);
        setSelectedNotifications(new Set());
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async (): Promise<void> => {
    if (isFetching.current) return;
    isFetching.current = true;
    
    try {
      const response = await api.get('/notifications?limit=50');
      const allNotifications: Notification[] = response.data.notifications;
      const newUnreadCount: number = response.data.unreadCount;
      
      // 🔥 FILTER: Only keep reminder and achievement notifications, exclude task creation
      const filteredNotifications = allNotifications.filter((n: Notification) => 
        n.type === 'reminder' || n.type === 'achievement'
      );
      
      const existingIds = new Set(notifications.map((n: Notification) => n._id));
      const brandNewNotifications = filteredNotifications.filter((n: Notification) => 
        !existingIds.has(n._id) && !n.read
      );
      
      for (const notification of brandNewNotifications) {
        if (notification.type === 'reminder') {
          showImmediateNotification(notification);
        } else if (notification.type === 'achievement') {
          notificationSound.playAchievement();
          showBrowserNotification(notification.title, notification.message);
          toast(notification.message, { 
            icon: '🏆', 
            duration: 5000 
          });
        }
      }
      
      setNotifications(filteredNotifications);
      
      // Calculate unread count from filtered notifications
      const unreadFiltered = filteredNotifications.filter((n: Notification) => !n.read).length;
      setUnreadCount(unreadFiltered);
      
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      isFetching.current = false;
      setLoading(false);
    }
  };

  const markAsRead = async (id: string): Promise<void> => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev: Notification[]) =>
        prev.map((n: Notification) => n._id === id ? { ...n, read: true } : n)
      );
      setUnreadCount((prev: number) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async (): Promise<void> => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev: Notification[]) =>
        prev.map((n: Notification) => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id: string): Promise<void> => {
    try {
      await api.delete(`/notifications/${id}`);
      const wasUnread = notifications.find((n: Notification) => n._id === id)?.read === false;
      setNotifications((prev: Notification[]) => prev.filter((n: Notification) => n._id !== id));
      if (wasUnread) {
        setUnreadCount((prev: number) => Math.max(0, prev - 1));
      }
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const deleteSelectedNotifications = async (): Promise<void> => {
    if (selectedNotifications.size === 0) {
      toast.error('No notifications selected');
      return;
    }
    
    try {
      const deletePromises = Array.from(selectedNotifications).map(id => 
        api.delete(`/notifications/${id}`)
      );
      await Promise.all(deletePromises);
      
      let unreadDeleted = 0;
      setNotifications((prev: Notification[]) => {
        const remaining = prev.filter((n: Notification) => {
          if (selectedNotifications.has(n._id)) {
            if (!n.read) unreadDeleted++;
            return false;
          }
          return true;
        });
        return remaining;
      });
      
      setUnreadCount((prev: number) => Math.max(0, prev - unreadDeleted));
      setSelectedNotifications(new Set());
      setIsDeleteMode(false);
      toast.success(`Deleted ${selectedNotifications.size} notification(s)`);
    } catch (error) {
      console.error('Failed to delete notifications:', error);
      toast.error('Failed to delete notifications');
    }
  };

  const deleteAllNotifications = async (): Promise<void> => {
    if (notifications.length === 0) {
      toast.error('No notifications to delete');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete all ${notifications.length} notifications?`)) {
      try {
        const deletePromises = notifications.map(n => api.delete(`/notifications/${n._id}`));
        await Promise.all(deletePromises);
        
        setNotifications([]);
        setUnreadCount(0);
        setSelectedNotifications(new Set());
        setIsDeleteMode(false);
        toast.success('All notifications deleted');
      } catch (error) {
        console.error('Failed to delete all notifications:', error);
        toast.error('Failed to delete notifications');
      }
    }
  };

  const toggleSelectNotification = (id: string): void => {
    setSelectedNotifications((prev: Set<string>) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllNotifications = (): void => {
    if (selectedNotifications.size === notifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(notifications.map(n => n._id)));
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'achievement': return '🏆';
      case 'reminder': return '⏰';
      case 'task': return '📋';
      default: return '🔔';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (isOpen) {
            setIsDeleteMode(false);
            setSelectedNotifications(new Set());
          }
        }}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-[420px] bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">Notifications</h3>
                  <p className="text-xs text-gray-500">
                    {unreadCount} unread • {notifications.length} total
                  </p>
                </div>
                <div className="flex gap-2">
                  {!isDeleteMode ? (
                    <>
                      {notifications.length > 0 && (
                        <button
                          onClick={() => setIsDeleteMode(true)}
                          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 transition"
                          title="Delete notifications"
                        >
                          <TrashCanIcon className="h-4 w-4" />
                        </button>
                      )}
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-primary-600 hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllNotifications}
                        className="text-xs text-primary-600 hover:underline"
                      >
                        {selectedNotifications.size === notifications.length ? 'Deselect all' : 'Select all'}
                      </button>
                      <button
                        onClick={deleteSelectedNotifications}
                        disabled={selectedNotifications.size === 0}
                        className="text-xs text-red-600 hover:underline disabled:opacity-50"
                      >
                        Delete ({selectedNotifications.size})
                      </button>
                      <button
                        onClick={deleteAllNotifications}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete all
                      </button>
                      <button
                        onClick={() => {
                          setIsDeleteMode(false);
                          setSelectedNotifications(new Set());
                        }}
                        className="text-xs text-gray-500 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <BellIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No notifications yet</p>
                  <p className="text-xs mt-1">New notifications will appear here</p>
                </div>
              ) : (
                notifications.map((notification: Notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${
                      !notification.read ? 'bg-primary-50 dark:bg-primary-900/10' : ''
                    } ${isDeleteMode ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (isDeleteMode) {
                        toggleSelectNotification(notification._id);
                      } else {
                        markAsRead(notification._id);
                      }
                    }}
                  >
                    <div className="flex gap-3">
                      {/* Selection checkbox in delete mode */}
                      {isDeleteMode && (
                        <div className="flex-shrink-0 mt-1">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                            selectedNotifications.has(notification._id)
                              ? 'bg-primary-500 border-primary-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {selectedNotifications.has(notification._id) && (
                              <CheckIcon className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="text-2xl flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm text-gray-800 dark:text-white">
                            {notification.title}
                          </p>
                          {!isDeleteMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification._id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                            >
                              <TrashIcon className="h-3 w-3 text-gray-400" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && !isDeleteMode && (
                        <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0"></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer with actions */}
            {notifications.length > 0 && !isDeleteMode && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">
                    {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-500 hover:text-primary-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}