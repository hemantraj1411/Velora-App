"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  DevicePhoneMobileIcon, 
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed (PWA mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // Check if already dismissed
    const dismissed = localStorage.getItem('velora_install_dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Listen for beforeinstallprompt event (Chrome/Android)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!localStorage.getItem('velora_install_dismissed')) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for app installed event
    const installedHandler = () => {
      setIsInstalled(true);
      setIsVisible(false);
      localStorage.setItem('velora_installed', 'true');
    };
    window.addEventListener('appinstalled', installedHandler);

    // Check if user already installed (for iOS)
    const isIOSStandalone = (navigator as any).standalone || 
                         window.matchMedia('(display-mode: standalone)').matches;
    if (isIOSStandalone) {
      setIsInstalled(true);
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        if (result.outcome === 'accepted') {
          setIsInstalled(true);
          setIsVisible(false);
          localStorage.setItem('velora_installed', 'true');
        }
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Installation error:', error);
      }
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('velora_install_dismissed', 'true');
  };

  // Don't show if installed or dismissed
  if (isInstalled || !isVisible || isDismissed) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50"
        >
          <div className="bg-[#1a2234] rounded-2xl p-4 border border-[#2a3a4a] shadow-2xl shadow-purple-500/10">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30">
                <DevicePhoneMobileIcon className="h-6 w-6 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-semibold text-sm">Install Velora App</h4>
                <p className="text-gray-400 text-xs mt-0.5">
                  {isIOS 
                    ? 'Tap the Share button then "Add to Home Screen"'
                    : isAndroid
                    ? 'Add to your home screen for easy access'
                    : 'Install for a better experience'}
                </p>

                {/* iOS Instructions */}
                {isIOS && (
                  <div className="mt-2 text-xs text-gray-500 bg-[#0f1a2a] rounded-lg p-2">
                    <ol className="list-decimal list-inside space-y-0.5">
                      <li>Tap the Share icon <span className="text-white">⎔</span></li>
                      <li>Scroll down and tap <span className="text-white">"Add to Home Screen"</span></li>
                      <li>Tap <span className="text-white">"Add"</span> in the top right</li>
                    </ol>
                  </div>
                )}

                {/* Android/Chrome Progress */}
                {!isIOS && deferredPrompt && (
                  <div className="mt-3 h-1 bg-[#2a3a4a] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 8, ease: 'linear' }}
                      className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-1 flex-shrink-0">
                {!isIOS && (
                  <button
                    onClick={handleInstall}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-200 flex items-center gap-1"
                  >
                    <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                    Install
                  </button>
                )}
                <button
                  onClick={handleDismiss}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors duration-200 text-gray-400 hover:text-white"
                  aria-label="Dismiss install prompt"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Already installed hint for iOS */}
            {isIOS && (
              <div className="mt-2 text-center">
                <p className="text-[10px] text-gray-500">
                  Already installed? Open from your home screen
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}