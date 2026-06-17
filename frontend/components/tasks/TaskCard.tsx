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
  CheckBadgeIcon
} from "@heroicons/react/24/outline";
import { Task } from "@/types";

interface TaskCardProps {
  task: Task;
  onToggleComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

// Helper function to format distance to now
function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? "s" : ""} ago`;
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? "s" : ""} ago`;
}

export default function TaskCard({ task, onToggleComplete, onEdit, onDelete }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Celebration effect when task becomes completed
  useEffect(() => {
    if (task.status === "completed") {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [task.status]);

  const priorityColors = {
    high: "text-red-600 bg-red-100 dark:bg-red-900/30",
    medium: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
    low: "text-green-600 bg-green-100 dark:bg-green-900/30",
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    "in-progress": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const getPriorityIcon = () => {
    switch (task.priority) {
      case "high":
        return <FlagIcon className="h-4 w-4" />;
      case "medium":
        return <ClockIcon className="h-4 w-4" />;
      default:
        return <CheckCircleIcon className="h-4 w-4" />;
    }
  };

  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "completed";
  const dueDateDistance = formatDistanceToNow(new Date(task.dueDate));

  return (
    <>
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            className="text-6xl"
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
        className={`relative rounded-xl p-4 transition-all hover:shadow-md ${
          task.status === "completed" 
            ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" 
            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        } ${isOverdue ? "border-red-300 dark:border-red-800" : ""}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Completion Badge for completed tasks */}
        {task.status === "completed" && (
          <div className="absolute -top-2 -right-2">
            <div className="bg-green-500 text-white rounded-full p-1 shadow-lg">
              <CheckBadgeIcon className="h-5 w-5" />
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          {/* Complete Button - Click to mark complete/incomplete */}
          <button
            onClick={onToggleComplete}
            className={`mt-1 flex-shrink-0 transition-transform hover:scale-110 ${
              task.status === "completed" ? "opacity-100" : "opacity-70 hover:opacity-100"
            }`}
            title={task.status === "completed" ? "Mark as incomplete" : "Mark as complete"}
          >
            <CheckCircleIcon
              className={`h-6 w-6 transition-all ${
                task.status === "completed"
                  ? "text-green-600 drop-shadow-md"
                  : "text-gray-400 hover:text-green-500"
              }`}
            />
          </button>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className={`font-semibold ${task.status === "completed" ? "line-through text-gray-500" : "text-gray-800 dark:text-white"}`}>
                {task.title}
              </h3>
              
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={onEdit}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  title="Edit task"
                >
                  <PencilIcon className="h-4 w-4 text-gray-500" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                  title="Delete task"
                >
                  <TrashIcon className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>

            {task.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              {/* Priority Badge */}
              <span className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${priorityColors[task.priority]}`}>
                {getPriorityIcon()}
                <span className="capitalize">{task.priority}</span>
              </span>

              {/* Category Badge */}
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                {task.category}
              </span>

              {/* Status Badge */}
              <span className={`text-xs px-2 py-1 rounded-full ${statusColors[task.status]}`}>
                {task.status === "completed" ? "✓ Completed" : task.status.replace("-", " ")}
              </span>

              {/* Due Date */}
              <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                isOverdue 
                  ? "bg-red-100 dark:bg-red-900/30 text-red-600" 
                  : task.status === "completed"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600"
              }`}>
                <CalendarIcon className="h-3 w-3" />
                <span>{dueDateDistance}</span>
              </span>
            </div>

            {/* Hover instruction for completion */}
            {isHovered && task.status !== "completed" && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-xs text-gray-400 flex items-center gap-1"
              >
                <CheckCircleIcon className="h-3 w-3" />
                Click the circle to mark as complete
              </motion.div>
            )}

            {/* Direct Complete Button at bottom */}
            {task.status !== "completed" && (
              <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={onToggleComplete}
                  className="w-full text-xs text-center py-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition flex items-center justify-center gap-1"
                >
                  <CheckCircleIcon className="h-3 w-3" />
                  Mark as Complete
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}