"use client";

import { useState, useEffect } from "react";
import { BellIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from "@heroicons/react/24/outline";
import { notificationSound } from "@/lib/sounds";
import { requestNotificationPermission } from "@/lib/notifications";
import toast from "react-hot-toast";

export default function NotificationSettings() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Load sound preference
    setSoundEnabled(notificationSound.getEnabled());
    
    // Check browser notification permission
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
      setBrowserNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    notificationSound.setEnabled(newState);
    
    if (newState) {
      // Play test sound
      notificationSound.play();
      toast.success('Sound notifications enabled');
    } else {
      toast.success('Sound notifications disabled');
    }
  };

  const enableBrowserNotifications = async () => {
    const granted = await requestNotificationPermission();
    setBrowserNotificationsEnabled(granted);
    setPermissionStatus(granted ? 'granted' : 'denied');
    
    if (granted) {
      toast.success('Browser notifications enabled');
      // Send a test notification
      new Notification('Notifications Enabled', {
        body: 'You will now receive task reminders and updates!',
        icon: '/icon-192.png',
      });
    } else {
      toast.error('Browser notification permission denied');
    }
  };

  const testNotification = () => {
    // Play test sound
    notificationSound.playReminder();
    
    // Show test browser notification
    if (browserNotificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Test Notification', {
        body: 'This is a test notification from Velora!',
        icon: '/icon-192.png',
      });
      toast.success('Test notification sent!');
    } else {
      toast.error('Please enable browser notifications first');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Customize how you receive notifications for tasks and reminders
        </p>
      </div>

      {/* Sound Notification Toggle */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-3">
          {soundEnabled ? (
            <SpeakerWaveIcon className="h-6 w-6 text-primary-600" />
          ) : (
            <SpeakerXMarkIcon className="h-6 w-6 text-gray-400" />
          )}
          <div>
            <p className="font-medium text-gray-800 dark:text-white">Sound Notifications</p>
            <p className="text-sm text-gray-500">Play a sound when you receive notifications</p>
          </div>
        </div>
        <button
          onClick={toggleSound}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
            soundEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              soundEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Browser Notification Toggle */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-3">
          <BellIcon className="h-6 w-6 text-primary-600" />
          <div>
            <p className="font-medium text-gray-800 dark:text-white">Browser Notifications</p>
            <p className="text-sm text-gray-500">
              {permissionStatus === 'granted' 
                ? 'Notifications are enabled' 
                : permissionStatus === 'denied'
                ? 'Notifications are blocked by your browser'
                : 'Click to enable popup notifications'}
            </p>
          </div>
        </div>
        {permissionStatus !== 'granted' ? (
          <button
            onClick={enableBrowserNotifications}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700 transition"
          >
            Enable
          </button>
        ) : (
          <span className="text-sm text-green-600">✓ Enabled</span>
        )}
      </div>

      {/* Test Button */}
      <button
        onClick={testNotification}
        className="w-full py-3 rounded-lg border border-primary-600 text-primary-600 font-medium hover:bg-primary-50 dark:hover:bg-primary-900/20 transition"
      >
        Test Notification
      </button>

      {/* Info Box */}
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          🔔 <strong>Note:</strong> Sound notifications work best on Chrome, Edge, and Safari.
          Popup notifications require your permission and may be blocked by your browser settings.
        </p>
      </div>
    </div>
  );
}