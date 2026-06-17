"use client";

import { useEffect, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { 
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  FireIcon,
  ClockIcon,
  CalendarIcon,
  TagIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";
import { Task, Habit } from "@/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function Analytics() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, habitsRes] = await Promise.all([
        api.get("/tasks"),
        api.get("/habits"),
      ]);
      setTasks(tasksRes.data.tasks || []);
      setHabits(habitsRes.data.habits || []);
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics from actual tasks
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const pendingTasks = tasks.filter(t => t.status === "pending").length;
  const inProgressTasks = tasks.filter(t => t.status === "in-progress").length;
  const overdueTasks = tasks.filter(t => t.status === "overdue").length;
  
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const priorityDistribution = {
    high: tasks.filter(t => t.priority === "high").length,
    medium: tasks.filter(t => t.priority === "medium").length,
    low: tasks.filter(t => t.priority === "low").length,
  };
  
  const statusDistribution = {
    completed: completedTasks,
    pending: pendingTasks,
    "in-progress": inProgressTasks,
    overdue: overdueTasks,
  };
  
  // Category breakdown
  const categoryMap = new Map<string, number>();
  tasks.forEach(task => {
    const cat = task.category;
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
  });
  const categoryDistribution = Object.fromEntries(categoryMap);
  
  // Daily task completion for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });
  
  const dailyCompleted = last7Days.map(date => {
    return tasks.filter(t => 
      t.status === "completed" && 
      t.completedAt && 
      new Date(t.completedAt).toDateString() === date.toDateString()
    ).length;
  });
  
  const dailyCreated = last7Days.map(date => {
    return tasks.filter(t => 
      new Date(t.createdAt).toDateString() === date.toDateString()
    ).length;
  });
  
  // Weekly data
  const weeklyCompleted = tasks.filter(t => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return t.status === "completed" && new Date(t.completedAt || t.createdAt) >= weekAgo;
  }).length;
  
  const weeklyCreated = tasks.filter(t => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(t.createdAt) >= weekAgo;
  }).length;
  
  // Monthly data
  const monthlyCompleted = tasks.filter(t => {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return t.status === "completed" && new Date(t.completedAt || t.createdAt) >= monthAgo;
  }).length;
  
  // Habit stats
  const activeHabits = habits.filter(h => h.isActive).length;
  const totalHabitCompletions = habits.reduce((sum, h) => sum + h.totalCompletions, 0);
  const bestStreak = Math.max(...habits.map(h => h.longestStreak), 0);
  
  // Productivity score calculation
  const productivityScore = completionRate;
  
  // Chart data
  const barData = {
    labels: last7Days.map(d => d.toLocaleDateString('en-US', { weekday: 'short' })),
    datasets: [
      {
        label: "Tasks Created",
        data: dailyCreated,
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
        borderRadius: 8,
      },
      {
        label: "Tasks Completed",
        data: dailyCompleted,
        backgroundColor: "rgba(34, 197, 94, 0.5)",
        borderColor: "rgb(34, 197, 94)",
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };
  
  const priorityChartData = {
    labels: ["High", "Medium", "Low"],
    datasets: [
      {
        data: [priorityDistribution.high, priorityDistribution.medium, priorityDistribution.low],
        backgroundColor: ["#ef4444", "#f59e0b", "#10b981"],
        borderWidth: 0,
      },
    ],
  };
  
  const statusChartData = {
    labels: ["Completed", "Pending", "In Progress", "Overdue"],
    datasets: [
      {
        data: [statusDistribution.completed, statusDistribution.pending, statusDistribution["in-progress"], statusDistribution.overdue],
        backgroundColor: ["#10b981", "#f59e0b", "#3b82f6", "#ef4444"],
        borderWidth: 0,
      },
    ],
  };
  
  const productivityTrendData = {
    labels: last7Days.map(d => d.toLocaleDateString('en-US', { weekday: 'short' })),
    datasets: [
      {
        label: "Productivity Score",
        data: last7Days.map(date => {
          const dayTasks = tasks.filter(t => 
            new Date(t.createdAt).toDateString() === date.toDateString()
          );
          const dayCompleted = dayTasks.filter(t => t.status === "completed").length;
          return dayTasks.length > 0 ? (dayCompleted / dayTasks.length) * 100 : 0;
        }),
        borderColor: "rgb(139, 92, 246)",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "rgb(139, 92, 246)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          boxWidth: 10,
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };
  
  const summaryCards = [
    {
      title: "Productivity Score",
      value: `${Math.round(productivityScore)}%`,
      icon: ArrowTrendingUpIcon,
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-500/10",
      trend: productivityScore >= 70 ? "Excellent!" : productivityScore >= 40 ? "Good" : "Needs Improvement",
    },
    {
      title: "Tasks Completed",
      value: `${completedTasks}/${totalTasks}`,
      icon: CheckCircleIcon,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/10",
      trend: `${completionRate.toFixed(0)}% completion rate`,
    },
    {
      title: "Current Streak",
      value: `${habits.reduce((max, h) => Math.max(max, h.streak), 0)} days`,
      icon: FireIcon,
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-500/10",
      trend: "Best: " + bestStreak + " days",
    },
    {
      title: "Active Habits",
      value: activeHabits,
      icon: CalendarIcon,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
      trend: `${totalHabitCompletions} total completions`,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Analytics Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Track your productivity and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod("week")}
            className={`px-4 py-2 rounded-lg capitalize transition-all duration-200 ${
              period === "week"
                ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md"
                : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setPeriod("month")}
            className={`px-4 py-2 rounded-lg capitalize transition-all duration-200 ${
              period === "month"
                ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md"
                : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setPeriod("year")}
            className={`px-4 py-2 rounded-lg capitalize transition-all duration-200 ${
              period === "year"
                ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md"
                : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            Year
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.title}</p>
                <p className="text-2xl font-bold mt-2 gradient-text">{card.value}</p>
                {card.trend && (
                  <p className="text-xs text-gray-500 mt-1">{card.trend}</p>
                )}
              </div>
              <div className={`p-3 rounded-xl ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 bg-gradient-to-r ${card.color} bg-clip-text text-transparent`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productivity Trend */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-primary-600" />
            Productivity Trend
          </h3>
          <Line data={productivityTrendData} options={chartOptions} />
        </motion.div>

        {/* Priority Distribution */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TagIcon className="h-5 w-5 text-primary-600" />
            Task Distribution by Priority
          </h3>
          <div className="max-w-xs mx-auto">
            <Doughnut data={priorityChartData} options={chartOptions} />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                High Priority
              </span>
              <span className="font-semibold">{priorityDistribution.high} tasks</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                Medium Priority
              </span>
              <span className="font-semibold">{priorityDistribution.medium} tasks</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                Low Priority
              </span>
              <span className="font-semibold">{priorityDistribution.low} tasks</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Daily Activity */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold mb-4">Daily Activity (Last 7 Days)</h3>
        <Bar data={barData} options={chartOptions} />
      </motion.div>

      {/* Task Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold mb-4">Task Status Overview</h3>
          <div className="max-w-xs mx-auto">
            <Doughnut data={statusChartData} options={chartOptions} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <p className="text-2xl font-bold text-green-600">{statusDistribution.completed}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Completed</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
              <p className="text-2xl font-bold text-yellow-600">{statusDistribution.pending}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Pending</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <p className="text-2xl font-bold text-blue-600">{statusDistribution["in-progress"]}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">In Progress</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
              <p className="text-2xl font-bold text-red-600">{statusDistribution.overdue}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Overdue</p>
            </div>
          </div>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
          {Object.keys(categoryDistribution).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tasks with categories yet
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(categoryDistribution).map(([category, count]) => (
                <div key={category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{category}</span>
                    <span className="font-medium">{count as number} tasks</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-primary-600 to-primary-500 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${((count as number) / totalTasks) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Weekly/Monthly Summary */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold mb-4">Period Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <p className="text-sm text-gray-600 dark:text-gray-400">Last 7 Days</p>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-2xl font-bold text-blue-600">{weeklyCreated}</p>
                <p className="text-xs text-gray-500">Tasks Created</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{weeklyCompleted}</p>
                <p className="text-xs text-gray-500">Tasks Completed</p>
              </div>
            </div>
          </div>
          <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <p className="text-sm text-gray-600 dark:text-gray-400">Last 30 Days</p>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-2xl font-bold text-purple-600">{tasks.filter(t => {
                  const monthAgo = new Date();
                  monthAgo.setMonth(monthAgo.getMonth() - 1);
                  return new Date(t.createdAt) >= monthAgo;
                }).length}</p>
                <p className="text-xs text-gray-500">Tasks Created</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{monthlyCompleted}</p>
                <p className="text-xs text-gray-500">Tasks Completed</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Insights */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-primary-100 dark:border-primary-800"
      >
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          💡 Insights & Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-white/50 dark:bg-black/20">
            <p className="text-sm text-gray-600 dark:text-gray-400">Task Efficiency</p>
            <p className="font-semibold">
              {completionRate > 70 
                ? "🎉 Excellent! Keep up the great work!"
                : completionRate > 40 
                ? "👍 Good progress, but can improve"
                : "📈 Focus on completing more tasks daily"}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-white/50 dark:bg-black/20">
            <p className="text-sm text-gray-600 dark:text-gray-400">Priority Focus</p>
            <p className="font-semibold capitalize">
              {priorityDistribution.high > priorityDistribution.medium + priorityDistribution.low
                ? "⚡ High priority tasks need attention"
                : "🎯 Balanced task distribution"}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-white/50 dark:bg-black/20">
            <p className="text-sm text-gray-600 dark:text-gray-400">Habit Building</p>
            <p className="font-semibold">
              {bestStreak > 0 
                ? `🔥 ${bestStreak} day streak! Keep building habits!`
                : "🌱 Start building daily habits for consistency"}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}