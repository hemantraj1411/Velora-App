"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  TrashIcon, 
  PencilIcon, 
  CheckIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { Task } from "@/types";

interface TaskCardProps {
  task: Task;
  onUpdate: (id: string, updates: Partial<Task>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function TaskCard({ task, onUpdate, onDelete }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description || "");

  // Check if task is completed
  const isCompleted = task.status === 'completed' || !!task.completedAt;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;

  const handleToggleComplete = async () => {
    const newStatus = isCompleted ? 'pending' : 'completed';
    await onUpdate(task._id, { 
      status: newStatus,
      completedAt: isCompleted ? undefined : new Date().toISOString()
    });
  };

  const handleSave = async () => {
    await onUpdate(task._id, { 
      title: editedTitle, 
      description: editedDescription 
    });
    setIsEditing(false);
  };

  const getPriorityColor = () => {
    switch (task.priority) {
      case "high": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low": return "bg-green-500/20 text-green-400 border-green-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusColor = () => {
    if (isCompleted) return "bg-green-500/20 text-green-400 border-green-500/30";
    if (isOverdue) return "bg-red-500/20 text-red-400 border-red-500/30";
    return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  };

  const getStatusText = () => {
    if (isCompleted) return "✅ Done";
    if (isOverdue) return "⚠️ Overdue";
    return "🔄 In Progress";
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`group relative rounded-xl md:rounded-2xl p-3 md:p-4 border transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 ${
        isCompleted 
          ? "border-green-500/30 bg-green-500/5" 
          : isOverdue 
          ? "border-red-500/30 bg-red-500/5" 
          : "border-[#2a3a4a] bg-[#1a2234]"
      }`}
    >
      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#0f1a2a] border border-[#2a3a4a] text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            autoFocus
          />
          <textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-[#0f1a2a] border border-[#2a3a4a] text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            placeholder="Description..."
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition flex items-center gap-1"
            >
              <CheckIcon className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Task Content */}
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            <button
              onClick={handleToggleComplete}
              className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                isCompleted
                  ? "bg-green-500 border-green-500"
                  : "border-gray-500 hover:border-purple-500"
              }`}
            >
              {isCompleted && <CheckIcon className="h-3 w-3 text-white" />}
            </button>

            {/* Task Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className={`text-sm md:text-base font-medium ${
                  isCompleted ? "text-gray-400 line-through" : "text-white"
                }`}>
                  {task.title}
                </h3>
              </div>

              {task.description && (
                <p className={`text-xs md:text-sm mt-0.5 ${
                  isCompleted ? "text-gray-500" : "text-gray-400"
                } line-clamp-2`}>
                  {task.description}
                </p>
              )}

              {/* Tags and Metadata */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {/* Priority Badge */}
                <span className={`text-[10px] md:text-xs px-2 py-0.5 rounded-full border ${getPriorityColor()}`}>
                  {task.priority || "Medium"}
                </span>

                {/* Status Badge */}
                <span className={`text-[10px] md:text-xs px-2 py-0.5 rounded-full border ${getStatusColor()}`}>
                  {getStatusText()}
                </span>

                {/* Category */}
                {task.category && (
                  <span className="text-[10px] md:text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {task.category}
                  </span>
                )}

                {/* Due Date */}
                {task.dueDate && (
                  <span className={`text-[10px] md:text-xs flex items-center gap-0.5 ${
                    isOverdue && !isCompleted ? "text-red-400" : "text-gray-400"
                  }`}>
                    <CalendarIcon className="h-3 w-3" />
                    {new Date(task.dueDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons - Always Visible */}
          <div className="flex items-center justify-end gap-1 mt-3 pt-2 border-t border-white/5">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 md:p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition min-h-[32px] min-w-[32px] md:min-h-0 md:min-w-0 flex items-center justify-center"
              title="Edit"
            >
              <PencilIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </button>
            <button
              onClick={() => onDelete(task._id)}
              className="p-1.5 md:p-1 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition min-h-[32px] min-w-[32px] md:min-h-0 md:min-w-0 flex items-center justify-center"
              title="Delete"
            >
              <TrashIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}