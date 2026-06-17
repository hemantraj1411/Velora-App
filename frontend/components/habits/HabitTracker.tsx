"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PlusIcon, FireIcon } from "@heroicons/react/24/outline";
import HabitCard from "./HabitCard";
import HabitForm from "./HabitForm";
import { api } from "@/lib/api";
import { Habit } from "@/types";
import toast from "react-hot-toast";

export default function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const response = await api.get("/habits");
      setHabits(response.data.habits);
    } catch (error) {
      toast.error("Failed to load habits");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHabit = async (habitData: Partial<Habit>) => {
    try {
      const response = await api.post("/habits", habitData);
      setHabits([response.data.habit, ...habits]);
      setShowForm(false);
      toast.success("Habit created successfully");
    } catch (error) {
      toast.error("Failed to create habit");
    }
  };

  const handleToggleHabit = async (habitId: string, date: Date) => {
    try {
      const response = await api.post(`/habits/${habitId}/track`, { date, completed: true });
      setHabits(habits.map(h => h._id === habitId ? response.data.habit : h));
      toast.success("Habit tracked!");
    } catch (error) {
      toast.error("Failed to track habit");
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (confirm("Delete this habit?")) {
      try {
        await api.delete(`/habits/${habitId}`);
        setHabits(habits.filter(h => h._id !== habitId));
        toast.success("Habit deleted");
      } catch (error) {
        toast.error("Failed to delete habit");
      }
    }
  };

  const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);
  const totalCompletions = habits.reduce((sum, h) => sum + h.totalCompletions, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Habit Tracker</h2>
          <p className="text-gray-600 dark:text-gray-400">
            🔥 Total Streak: {totalStreak} days • ✅ Total Completions: {totalCompletions}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold hover:shadow-lg transition flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          New Habit
        </button>
      </div>

      {/* Habits Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-xl p-4 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : habits.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <FireIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No habits yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first habit to start building consistency</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition"
          >
            Create Habit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {habits.map((habit, index) => (
            <motion.div
              key={habit._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <HabitCard
                habit={habit}
                onToggle={() => handleToggleHabit(habit._id, new Date())}
                onDelete={() => handleDeleteHabit(habit._id)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Habit Form Modal */}
      <HabitForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreateHabit}
      />
    </div>
  );
}