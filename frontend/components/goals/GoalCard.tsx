"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircleIcon, ClockIcon, ChevronDownIcon, ChevronUpIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Goal } from "@/types";

interface GoalCardProps {
  goal: Goal;
  onUpdateMilestone?: (milestoneId: string, completed: boolean) => void;
  onDelete?: () => void;
}

export default function GoalCard({ goal, onUpdateMilestone, onDelete }: GoalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const completedCount = goal.milestones.filter(m => m.completed).length;
  const totalCount = goal.milestones.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const remainingDays = Math.ceil(
    (new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="flex-1 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{goal.title}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${
              goal.status === "completed" 
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            }`}>
              {goal.status}
            </span>
          </div>
          
          {goal.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">{goal.description}</p>
          )}

          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <ClockIcon className="h-4 w-4" />
              <span>{remainingDays > 0 ? `${remainingDays} days left` : "Due soon"}</span>
            </div>
            <div>Progress: {Math.round(progress)}%</div>
            <div>Category: {goal.category}</div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary-600 to-primary-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {goal.status === "completed" && (
            <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition"
              title="Delete goal"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            {expanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Milestones */}
      {expanded && goal.milestones.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Milestones</h4>
          <div className="space-y-2">
            {goal.milestones.map((milestone, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                {onUpdateMilestone ? (
                  <button
                    onClick={() => onUpdateMilestone(milestone._id!, !milestone.completed)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                      milestone.completed
                        ? "bg-green-500 border-green-500"
                        : "border-gray-400 hover:border-primary-500"
                    }`}
                  >
                    {milestone.completed && <CheckCircleIcon className="h-4 w-4 text-white" />}
                  </button>
                ) : (
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    milestone.completed
                      ? "bg-green-500 border-green-500"
                      : "border-gray-400"
                  }`}>
                    {milestone.completed && <CheckCircleIcon className="h-4 w-4 text-white" />}
                  </div>
                )}
                <span className={`text-sm ${milestone.completed ? "line-through text-gray-500" : "text-gray-700 dark:text-gray-300"}`}>
                  {milestone.title}
                </span>
                <span className="text-xs text-gray-500 ml-auto">
                  Due: {new Date(milestone.dueDate).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}