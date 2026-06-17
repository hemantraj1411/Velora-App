"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import StatsCards from "@/components/dashboard/StatsCards";
import TasksManager from "@/components/tasks/TaskManager";
import HabitTracker from "@/components/habits/HabitTracker";
import GoalManager from "@/components/goals/GoalManager";
import AIAssistant from "@/components/ai/AIAssistant";
import CalendarView from "@/components/calendar/CalendarView";
import Analytics from "@/components/analytics/Analytics";
import NoteManager from "@/components/notes/NoteManager";
import FocusMode from "@/components/focus/FocusMode";
import LoadingSpinner from "@/components/common/LoadingSpinner";

// ✅ Removed 'teams' from TabType
type TabType = 'tasks' | 'habits' | 'goals' | 'calendar' | 'analytics' | 'notes' | 'focus' | 'ai';

interface Tab {
  id: TabType;
  label: string;
  icon: string;
  color: string;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Handle mobile responsiveness
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  // ✅ Removed 'teams' tab
  const tabs: Tab[] = [
    { id: 'tasks', label: 'Tasks', icon: '📋', color: 'bg-blue-500' },
    { id: 'habits', label: 'Habits', icon: '🔥', color: 'bg-orange-500' },
    { id: 'goals', label: 'Goals', icon: '🎯', color: 'bg-purple-500' },
    { id: 'calendar', label: 'Calendar', icon: '📅', color: 'bg-green-500' },
    { id: 'analytics', label: 'Analytics', icon: '📊', color: 'bg-indigo-500' },
    { id: 'notes', label: 'Notes', icon: '📝', color: 'bg-yellow-500' },
    { id: 'focus', label: 'Focus', icon: '🎧', color: 'bg-red-500' },
    { id: 'ai', label: 'AI Assistant', icon: '🤖', color: 'bg-pink-500' },
  ];

  const handleSetActiveTab = (tab: string) => {
    setActiveTab(tab as TabType);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'tasks':
        return <TasksManager />;
      case 'habits':
        return <HabitTracker />;
      case 'goals':
        return <GoalManager />;
      case 'calendar':
        return <CalendarView />;
      case 'analytics':
        return <Analytics />;
      case 'notes':
        return <NoteManager />;
      case 'focus':
        return <FocusMode />;
      case 'ai':
        return <AIAssistant />;
      default:
        return <TasksManager />;
    }
  };

  // Calculate margin based on sidebar state
  const getMainMargin = () => {
    if (isMobile) return 'ml-0';
    return isSidebarOpen ? 'ml-64' : 'ml-20';
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleSetActiveTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        tabs={tabs}
        isMobile={isMobile}
      />
      
      <main className={`transition-all duration-300 ${getMainMargin()}`}>
        <Header 
          user={user}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          isMobile={isMobile}
        />
        
        <div className="p-4 md:p-6">
          <StatsCards />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile overlay when sidebar is open */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}