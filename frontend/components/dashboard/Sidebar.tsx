"use client";

import { motion } from "framer-motion";
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  RocketLaunchIcon,
  ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "@/hooks/useAuth";

interface Tab {
  id: string;
  label: string;
  icon: string;
  color: string;
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  tabs: Tab[];
  isMobile?: boolean;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  setIsOpen, 
  tabs, 
  isMobile = false 
}: SidebarProps) {
  const { user, logout } = useAuth();

  const sidebarWidth = isOpen ? (isMobile ? 280 : 256) : (isMobile ? 0 : 80);

  return (
    <>
      <motion.aside
        initial={{ width: sidebarWidth }}
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.3 }}
        className="fixed left-0 top-0 h-full bg-[#0a0f1e] border-r border-[#1a2234] shadow-xl z-40 overflow-hidden"
        style={{ width: sidebarWidth }}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-4 flex items-center justify-between border-b border-[#1a2234]">
            <div className="flex items-center space-x-2 overflow-hidden">
              <RocketLaunchIcon className="h-8 w-8 text-purple-400 flex-shrink-0" />
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xl font-bold text-white whitespace-nowrap"
                >
                  Velora
                </motion.span>
              )}
            </div>
            {!isMobile && (
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 rounded-lg hover:bg-[#1a2234] transition"
              >
                {isOpen ? <ChevronLeftIcon className="h-5 w-5 text-gray-400" /> : <ChevronRightIcon className="h-5 w-5 text-gray-400" />}
              </button>
            )}
          </div>

          {/* User Info - Only show when sidebar is open */}
          {isOpen && user && (
            <div className="p-4 border-b border-[#1a2234]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-md">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-gray-400">Current Streak</span>
                <span className="font-semibold text-purple-400">{user.stats?.currentStreak || 0} days</span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-md`
                    : "text-gray-400 hover:bg-[#1a2234] hover:text-white"
                }`}
              >
                <span className="text-xl flex-shrink-0">{tab.icon}</span>
                {isOpen && <span className="whitespace-nowrap text-sm font-medium">{tab.label}</span>}
              </button>
            ))}
          </nav>

          {/* Footer - Only Sign Out */}
          <div className="p-3 border-t border-[#1a2234]">
            <button
              onClick={logout}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-900/20 hover:text-red-300 transition"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
              {isOpen && <span className="text-sm">Sign Out</span>}
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}