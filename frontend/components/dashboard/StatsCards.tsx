"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  CheckCircleIcon, 
  ClockIcon, 
  FireIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";
import { api } from "@/lib/api";

interface Stats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  currentStreak: number;
  productivityScore: number;
}

export default function StatsCards() {
  const [stats, setStats] = useState<Stats>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    currentStreak: 0,
    productivityScore: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get("/tasks/stats");
      const userResponse = await api.get("/auth/profile");
      setStats({
        totalTasks: response.data.total || 0,
        completedTasks: response.data.completed || 0,
        pendingTasks: response.data.pending || 0,
        currentStreak: userResponse.data.user.stats.currentStreak || 0,
        productivityScore: response.data.completionRate || 0,
      });
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
      icon: CheckCircleIcon,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Completed",
      value: stats.completedTasks,
      icon: SparklesIcon,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Pending",
      value: stats.pendingTasks,
      icon: ClockIcon,
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Current Streak",
      value: `${stats.currentStreak} days`,
      icon: FireIcon,
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="glass rounded-xl p-6 hover:shadow-xl transition-all"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{card.title}</p>
              <p className="text-2xl font-bold mt-2 gradient-text">{card.value}</p>
            </div>
            <div className={`p-3 rounded-xl ${card.bgColor}`}>
              <card.icon className={`h-6 w-6 bg-gradient-to-r ${card.color} bg-clip-text text-transparent`} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}