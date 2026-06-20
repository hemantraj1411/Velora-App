"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  ClipboardDocumentListIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  FireIcon 
} from "@heroicons/react/24/outline";

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
      const response = await api.get("/tasks/stats");
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: "Total Tasks",
      value: stats.totalTasks,
      icon: ClipboardDocumentListIcon,
      color: "from-blue-500/20 to-blue-600/20",
      textColor: "text-blue-400",
      borderColor: "border-blue-500/30",
    },
    {
      title: "Completed",
      value: stats.completedTasks,
      icon: CheckCircleIcon,
      color: "from-green-500/20 to-green-600/20",
      textColor: "text-green-400",
      borderColor: "border-green-500/30",
    },
    {
      title: "Pending",
      value: stats.pendingTasks,
      icon: ClockIcon,
      color: "from-yellow-500/20 to-yellow-600/20",
      textColor: "text-yellow-400",
      borderColor: "border-yellow-500/30",
    },
    {
      title: "Current Streak",
      value: stats.currentStreak,
      icon: FireIcon,
      color: "from-orange-500/20 to-orange-600/20",
      textColor: "text-orange-400",
      borderColor: "border-orange-500/30",
      suffix: " days",
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
            <div className="h-4 bg-gray-700 rounded w-1/2 mb-2" />
            <div className="h-8 bg-gray-700 rounded w-3/4" />
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
          className={`bg-gradient-to-br ${card.color} rounded-xl p-4 border ${card.borderColor} backdrop-blur-sm transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/10`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                {card.title}
              </p>
              <p className={`text-2xl md:text-3xl font-bold text-white mt-1`}>
                {card.value}
                {card.suffix && (
                  <span className="text-sm font-normal text-gray-400 ml-1">
                    {card.suffix}
                  </span>
                )}
              </p>
            </div>
            <div className={`p-2 rounded-lg bg-white/5 flex-shrink-0 ml-2`}>
              <card.icon className={`h-5 w-5 ${card.textColor}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}