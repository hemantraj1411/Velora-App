"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  ClipboardDocumentListIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  FireIcon 
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

interface Stats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  currentStreak: number;
}

export default function StatsCards() {
  const [stats, setStats] = useState<Stats>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    currentStreak: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Try to get stats from the API
      const response = await api.get("/tasks/stats");
      console.log("Stats response:", response.data);
      
      // Handle different response formats
      let statsData = response.data;
      if (response.data.data) {
        statsData = response.data.data;
      }
      
      setStats({
        totalTasks: statsData.totalTasks || statsData.total || 0,
        completedTasks: statsData.completedTasks || statsData.completed || 0,
        pendingTasks: statsData.pendingTasks || statsData.pending || 0,
        currentStreak: statsData.currentStreak || statsData.streak || 0,
      });
    } catch (error: any) {
      console.error("Failed to fetch stats:", error);
      // If the endpoint doesn't exist, try to calculate from tasks
      await fetchTasksAndCalculateStats();
    } finally {
      setLoading(false);
    }
  };

  // Fallback: Calculate stats from tasks if /stats endpoint doesn't exist
  const fetchTasksAndCalculateStats = async () => {
    try {
      const response = await api.get("/tasks");
      const tasks = response.data.tasks || response.data || [];
      
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t: any) => 
        t.status === 'completed' || t.completed === true
      ).length;
      const pendingTasks = totalTasks - completedTasks;
      
      // Calculate streak from habits or tasks
      let streak = 0;
      try {
        const habitResponse = await api.get("/habits");
        const habits = habitResponse.data.habits || habitResponse.data || [];
        if (habits.length > 0) {
          streak = habits.reduce((max: number, h: any) => Math.max(max, h.streak || 0), 0);
        }
      } catch (habitError) {
        // Habits endpoint might not exist
        console.debug("Habits endpoint not available");
      }
      
      setStats({
        totalTasks,
        completedTasks,
        pendingTasks,
        currentStreak: streak,
      });
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      toast.error("Could not load stats");
    }
  };

  const cards = [
    {
      title: "Total Tasks",
      value: stats.totalTasks,
      icon: ClipboardDocumentListIcon,
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-400",
    },
    {
      title: "Completed",
      value: stats.completedTasks,
      icon: CheckCircleIcon,
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      iconBg: "bg-green-500/20",
      iconColor: "text-green-400",
    },
    {
      title: "Pending",
      value: stats.pendingTasks,
      icon: ClockIcon,
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
      iconBg: "bg-yellow-500/20",
      iconColor: "text-yellow-400",
    },
    {
      title: "Current Streak",
      value: stats.currentStreak,
      icon: FireIcon,
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
      iconBg: "bg-orange-500/20",
      iconColor: "text-orange-400",
      suffix: stats.currentStreak !== 1 ? " days" : " day",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-[#1a2234] rounded-xl p-4 animate-pulse border border-[#2a3a4a]"
          >
            <div className="h-3 bg-gray-700 rounded w-1/2 mb-2" />
            <div className="h-7 bg-gray-700 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`${card.bg} rounded-xl p-4 border ${card.border} transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/10`}
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider truncate">
                {card.title}
              </p>
              <p className="text-2xl md:text-3xl font-bold text-white mt-1">
                {card.value}
                {card.suffix && (
                  <span className="text-sm font-normal text-gray-400 ml-1">
                    {card.suffix}
                  </span>
                )}
              </p>
            </div>
            <div className={`${card.iconBg} p-2.5 rounded-lg flex-shrink-0 ml-2`}>
              <card.icon className={`h-5 w-5 ${card.iconColor}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}