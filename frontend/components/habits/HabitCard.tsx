"use client";

import { motion } from "framer-motion";
import { TrashIcon, FireIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { Habit } from "@/types";

interface HabitCardProps {
  habit: Habit;
  onToggle: () => void;
  onDelete: () => void;
}

export default function HabitCard({ habit, onToggle, onDelete }: HabitCardProps) {
  const isCompletedToday = habit.completions.some(
    c => new Date(c.date).toDateString() === new Date().toDateString() && c.completed
  );

  const progress = (habit.totalCompletions / 30) * 100;

  return (
    <div className="glass rounded-xl p-4 hover:shadow-lg transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{habit.icon}</span>
            <h3 className="font-semibold">{habit.name}</h3>
          </div>
          
          {habit.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {habit.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1">
              <FireIcon className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-semibold">{habit.streak} days</span>
            </div>
            <div className="text-sm text-gray-500">
              Best: {habit.longestStreak}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Monthly Progress</span>
              <span>{habit.totalCompletions}/30</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className={`p-2 rounded-lg transition ${
              isCompletedToday
                ? "bg-green-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-green-100 dark:hover:bg-green-900/30"
            }`}
          >
            <CheckCircleIcon className="h-5 w-5" />
          </button>
          
          <button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}