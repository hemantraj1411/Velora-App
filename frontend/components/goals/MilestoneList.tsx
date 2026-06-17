"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircleIcon, 
  PlusIcon, 
  TrashIcon,
  CalendarIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";

interface Milestone {
  _id?: string;
  title: string;
  completed: boolean;
  dueDate: string;
  completedAt?: string;
}

interface MilestoneListProps {
  milestones: Milestone[];
  onToggle: (milestoneId: string, completed: boolean) => Promise<void>;
  onAdd?: (milestone: { title: string; dueDate: string }) => Promise<void>;
  onDelete?: (milestoneId: string) => Promise<void>;
  readOnly?: boolean;
}

export default function MilestoneList({ 
  milestones, 
  onToggle, 
  onAdd, 
  onDelete, 
  readOnly = false 
}: MilestoneListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: "", dueDate: "" });
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!newMilestone.title) return;
    setAdding(true);
    try {
      await onAdd?.(newMilestone);
      setNewMilestone({ title: "", dueDate: "" });
      setShowAddForm(false);
    } catch (error) {
      console.error("Failed to add milestone:", error);
    } finally {
      setAdding(false);
    }
  };

  const completedCount = milestones.filter(m => m.completed).length;
  const totalCount = milestones.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-semibold">Milestones</h4>
          <p className="text-sm text-gray-500">
            {completedCount} of {totalCount} completed
          </p>
        </div>
        {!readOnly && onAdd && (
          <button
            onClick={() => setShowAddForm(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-primary-600 to-primary-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Milestones List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {milestones.map((milestone) => {
            const daysUntil = getDaysUntilDue(milestone.dueDate);
            const isOverdue = daysUntil < 0 && !milestone.completed;
            
            return (
              <motion.div
                key={milestone._id || milestone.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`flex items-start gap-3 p-3 rounded-lg transition ${
                  milestone.completed 
                    ? "bg-green-50 dark:bg-green-900/20" 
                    : isOverdue
                    ? "bg-red-50 dark:bg-red-900/20"
                    : "bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {/* Checkbox */}
                {!readOnly && (
                  <button
                    onClick={() => onToggle(milestone._id!, !milestone.completed)}
                    className="mt-0.5 flex-shrink-0"
                  >
                    <CheckCircleIcon
                      className={`h-5 w-5 transition ${
                        milestone.completed
                          ? "text-green-600"
                          : "text-gray-400 hover:text-green-600"
                      }`}
                    />
                  </button>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-medium ${milestone.completed ? "line-through text-gray-500" : ""}`}>
                      {milestone.title}
                    </p>
                    {!readOnly && onDelete && (
                      <button
                        onClick={() => onDelete(milestone._id!)}
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Due Date */}
                  <div className="flex items-center gap-1 mt-1">
                    <CalendarIcon className="h-3 w-3 text-gray-400" />
                    <span className={`text-xs ${
                      isOverdue 
                        ? "text-red-600 font-medium" 
                        : "text-gray-500"
                    }`}>
                      Due: {new Date(milestone.dueDate).toLocaleDateString()}
                      {!milestone.completed && daysUntil > 0 && (
                        <span className="ml-1 text-gray-400">
                          ({daysUntil} day{daysUntil !== 1 ? "s" : ""} left)
                        </span>
                      )}
                      {isOverdue && (
                        <span className="ml-1">
                          (Overdue by {Math.abs(daysUntil)} day{Math.abs(daysUntil) !== 1 ? "s" : ""})
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Completed Date */}
                  {milestone.completed && milestone.completedAt && (
                    <p className="text-xs text-green-600 mt-1">
                      Completed: {new Date(milestone.completedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {milestones.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No milestones yet. Add your first milestone to track progress!
          </div>
        )}
      </div>

      {/* Add Milestone Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-3">
              <input
                type="text"
                placeholder="Milestone title"
                value={newMilestone.title}
                onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
              <input
                type="date"
                value={newMilestone.dueDate}
                onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  disabled={adding || !newMilestone.title}
                  className="flex-1 px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {adding ? "Adding..." : "Add Milestone"}
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}