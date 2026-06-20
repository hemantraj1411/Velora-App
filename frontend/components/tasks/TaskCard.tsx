"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  CheckCircleIcon, 
  TrashIcon, 
  PencilIcon, 
  ClockIcon, 
  FlagIcon,
  CalendarIcon,
  CheckBadgeIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { Task } from "@/types";

interface TaskCardProps {
  task: Task;
  onToggleComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 8640000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export default function TaskCard({ task, onToggleComplete, onEdit, onDelete }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (task.status === "completed") {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [task.status]);

  const priorityColors = {
    high: "border-red-500/50 bg-red-500/10 text-red-400",
    medium: "border-orange-500/50 bg-orange-500/10 text-orange-400",
    low: "border-green-500/50 bg-green-500/10 text-green-400",
  };

  const statusColors = {
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    "in-progress": "bg-blue-500/10 text-blue-400 border-blue-500/30",
    completed: "bg-green-500/10 text-green-400 border-green-500/30",
    overdue: "bg-red-500/10 text-red-400 border-red-500/30",
  };

  const getPriorityIcon = () => {
    switch (task.priority) {
      case "high": return <FlagIcon className="h-4 w-4" />;
      case "medium": return <ClockIcon className="h-4 w-4" />;
      default: return <CheckCircleIcon className="h-4 w-4" />;
    }
  };

  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "completed";
  const dueDateDistance = formatDistanceToNow(new Date(task.dueDate));

  return (
    <>
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            className="text-7xl"
          >
            🎉
          </motion.div>
        </div>
      )}

      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className={`relative rounded-2xl p-5 transition-all hover:shadow-xl hover:shadow-purple-500/5 ${
          task.status === "completed" 
            ? "bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30" 
            : "bg-[#1a2234] border border-[#2a3a4a]"
        } ${isOverdue ? "border-red-500/50" : ""}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {task.status === "completed" && (
          <div className="absolute -top-2 -right-2">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full p-1.5 shadow-lg shadow-green-500/30">
              <CheckBadgeIcon className="h-5 w-5" />
            </div>
          </div>
        )}

        <div className="flex items-start gap-4">
          <button
            onClick={onToggleComplete}
            className={`mt-1 flex-shrink-0 transition-all transform hover:scale-110 ${
              task.status === "completed" ? "opacity-100" : "opacity-60 hover:opacity-100"
            }`}
            title={task.status === "completed" ? "Mark as incomplete" : "Mark as complete"}
          >
            <CheckCircleIcon
              className={`h-7 w-7 transition-all ${
                task.status === "completed"
                  ? "text-green-500 drop-shadow-lg drop-shadow-green-500/50"
                  : "text-gray-500 hover:text-green-400"
              }`}
            />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <h3 className={`text-lg font-semibold ${task.status === "completed" ? "line-through text-gray-500" : "text-white"}`}>
                {task.title}
              </h3>
              
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={onEdit}
                  className="p-2 rounded-xl hover:bg-[#2a3a4a] transition-colors"
                  title="Edit task"
                >
                  <PencilIcon className="h-4 w-4 text-gray-400 hover:text-white" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-2 rounded-xl hover:bg-red-500/20 transition-colors"
                  title="Delete task"
                >
                  <TrashIcon className="h-4 w-4 text-gray-400 hover:text-red-400" />
                </button>
              </div>
            </div>

            {task.description && (
              <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              <span className={`text-xs px-3 py-1 rounded-full inline-flex items-center gap-1 border ${priorityColors[task.priority]}`}>
                {getPriorityIcon()}
                <span className="capitalize">{task.priority}</span>
              </span>

              <span className="text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                {task.category}
              </span>

              <span className={`text-xs px-3 py-1 rounded-full border ${statusColors[task.status]}`}>
                {task.status === "completed" ? "✅ Done" : task.status.replace("-", " ")}
              </span>

              <span className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 border ${
                isOverdue 
                  ? "bg-red-500/10 text-red-400 border-red-500/30" 
                  : task.status === "completed"
                  ? "bg-green-500/10 text-green-400 border-green-500/30"
                  : "bg-gray-500/10 text-gray-400 border-gray-500/30"
              }`}>
                <CalendarIcon className="h-3 w-3" />
                <span>{dueDateDistance}</span>
              </span>
            </div>

            {isHovered && task.status !== "completed" && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 pt-3 border-t border-[#2a3a4a]"
              >
                <button
                  onClick={onToggleComplete}
                  className="w-full text-sm py-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium hover:shadow-lg hover:shadow-green-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  Mark as Complete
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}