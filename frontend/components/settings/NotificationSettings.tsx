"use client";

import { useState, useEffect } from "react";
import { 
  BellIcon, 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";
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
      notificationSound.play();
      toast.success('🔊 Sound notifications enabled');
    } else {
      toast.success('🔇 Sound notifications disabled');
    }
  };

  const enableBrowserNotifications = async () => {
    const granted = await requestNotificationPermission();
    setBrowserNotificationsEnabled(granted);
    setPermissionStatus(granted ? 'granted' : 'denied');
    
    if (granted) {
      toast.success('🔔 Browser notifications enabled');
      try {
        new Notification('🔔 Notifications Enabled', {
          body: 'You will now receive task reminders and updates!',
          icon: '/icon-192.png',
        });
      } catch (error) {
        console.debug('Test notification error:', error);
      }
    } else {
      toast.error('❌ Browser notification permission denied');
    }
  };

  const testNotification = () => {
    // Play test sound
    notificationSound.playReminder();
    
    // Show test browser notification
    if (browserNotificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('🔔 Test Notification', {
          body: 'This is a test notification from Velora!',
          icon: '/icon-192.png',
        });
        toast.success('✅ Test notification sent!');
      } catch (error) {
        toast.error('Failed to send test notification');
      }
    } else {
      toast.error('Please enable browser notifications first');
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-2xl mx-auto px-2 md:px-0">
      {/* Header */}
      <div className="text-center md:text-left">
        <h3 className="text-xl md:text-2xl font-bold text-white">🔔 Notification Settings</h3>
        <p className="text-sm text-gray-400 mt-1">
          Customize how you receive notifications for tasks and reminders
        </p>
      </div>

      {/* Sound Notification Toggle - Mobile Friendly */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 md:p-5 rounded-xl bg-[#1a2234] border border-[#2a3a4a] hover:border-purple-500/30 transition">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
            soundEnabled ? 'bg-purple-500/20' : 'bg-gray-500/20'
          }`}>
            {soundEnabled ? (
              <SpeakerWaveIcon className="h-5 w-5 md:h-6 md:w-6 text-purple-400" />
            ) : (
              <SpeakerXMarkIcon className="h-5 w-5 md:h-6 md:w-6 text-gray-500" />
            )}
          </div>
          <div>
            <p className="font-medium text-white text-sm md:text-base">Sound Notifications</p>
            <p className="text-xs md:text-sm text-gray-400">Play a sound when you receive notifications</p>
          </div>
        </div>
        <button
          onClick={toggleSound}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition touch-manipulation flex-shrink-0 ${
            soundEnabled ? 'bg-purple-600' : 'bg-[#2a3a4a]'
          }`}
          aria-label={soundEnabled ? "Disable sound" : "Enable sound"}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
              soundEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Browser Notification Toggle - Mobile Friendly */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 md:p-5 rounded-xl bg-[#1a2234] border border-[#2a3a4a] hover:border-purple-500/30 transition">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <BellIcon className="h-5 w-5 md:h-6 md:w-6 text-blue-400" />
          </div>
          <div>
            <p className="font-medium text-white text-sm md:text-base">Browser Notifications</p>
            <p className="text-xs md:text-sm text-gray-400">
              {permissionStatus === 'granted' 
                ? '✅ Notifications are enabled' 
                : permissionStatus === 'denied'
                ? '❌ Notifications are blocked by your browser'
                : '⚡ Click to enable popup notifications'}
            </p>
          </div>
        </div>
        {permissionStatus !== 'granted' ? (
          <button
            onClick={enableBrowserNotifications}
            className="w-full sm:w-auto px-5 py-2.5 md:px-6 md:py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition touch-manipulation active:scale-95"
          >
            Enable Notifications
          </button>
        ) : (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircleIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Enabled</span>
          </div>
        )}
      </div>

      {/* Test Button - Mobile Friendly */}
      <button
        onClick={testNotification}
        className="w-full py-3.5 md:py-4 rounded-xl border-2 border-purple-500/30 text-purple-400 font-medium hover:bg-purple-500/10 transition touch-manipulation active:scale-95 text-sm md:text-base"
      >
        🔔 Test Notification
      </button>

      {/* Info Box - Mobile Friendly */}
      <div className="p-4 md:p-5 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-start gap-3">
          <InformationCircleIcon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-300 font-medium">Pro Tip</p>
            <p className="text-xs md:text-sm text-gray-400 mt-1">
              Sound notifications work best on Chrome, Edge, and Safari. 
              Popup notifications require your permission and may be blocked by your browser settings.
              <br />
              <span className="text-blue-400">💡 Enable notifications in your browser settings for the best experience.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Status Indicators - Mobile Friendly */}
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <div className="p-3 md:p-4 rounded-xl bg-[#1a2234] border border-[#2a3a4a] text-center">
          <p className="text-xs text-gray-500">Sound</p>
          <p className={`text-sm font-medium ${soundEnabled ? 'text-green-400' : 'text-gray-500'}`}>
            {soundEnabled ? '✅ On' : '❌ Off'}
          </p>
        </div>
        <div className="p-3 md:p-4 rounded-xl bg-[#1a2234] border border-[#2a3a4a] text-center">
          <p className="text-xs text-gray-500">Browser</p>
          <p className={`text-sm font-medium ${browserNotificationsEnabled ? 'text-green-400' : 'text-gray-500'}`}>
            {browserNotificationsEnabled ? '✅ On' : '❌ Off'}
          </p>
        </div>
      </div>

      {/* Mobile Bottom Padding */}
      <div className="h-4 md:h-0" />
    </div>
  );
}