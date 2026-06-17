"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PlusIcon, TrophyIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import GoalCard from "./GoalCard";
import { api } from "@/lib/api";
import { Goal } from "@/types";
import toast from "react-hot-toast";

export default function GoalManager() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    targetDate: "",
    category: "Personal",
    milestones: [] as { title: string; dueDate: string }[],
  });
  const [newMilestone, setNewMilestone] = useState({ title: "", dueDate: "" });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await api.get("/goals");
      setGoals(response.data.goals || []);
    } catch (error) {
      console.error("Failed to fetch goals:", error);
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title || !newGoal.targetDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await api.post("/goals", {
        ...newGoal,
        milestones: newGoal.milestones.map(m => ({
          title: m.title,
          dueDate: m.dueDate,
          completed: false,
        })),
        status: "active",
      });
      
      setGoals([response.data.goal, ...goals]);
      setShowForm(false);
      setNewGoal({ title: "", description: "", targetDate: "", category: "Personal", milestones: [] });
      toast.success("Goal created successfully!");
    } catch (error) {
      console.error("Failed to create goal:", error);
      toast.error("Failed to create goal");
    }
  };

  const handleAddMilestone = () => {
    if (!newMilestone.title || !newMilestone.dueDate) {
      toast.error("Please fill in milestone details");
      return;
    }
    setNewGoal({
      ...newGoal,
      milestones: [...newGoal.milestones, { title: newMilestone.title, dueDate: newMilestone.dueDate }],
    });
    setNewMilestone({ title: "", dueDate: "" });
  };

  const handleRemoveMilestone = (index: number) => {
    setNewGoal({
      ...newGoal,
      milestones: newGoal.milestones.filter((_, i) => i !== index),
    });
  };

  const handleUpdateMilestone = async (goalId: string, milestoneId: string, completed: boolean) => {
    try {
      const response = await api.put(`/goals/${goalId}/milestone/${milestoneId}`, { completed });
      setGoals(goals.map(g => g._id === goalId ? response.data.goal : g));
      toast.success(completed ? "Milestone completed!" : "Milestone updated");
    } catch (error) {
      console.error("Failed to update milestone:", error);
      toast.error("Failed to update milestone");
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;
    
    try {
      await api.delete(`/goals/${goalId}`);
      setGoals(goals.filter(g => g._id !== goalId));
      toast.success("Goal deleted");
    } catch (error) {
      console.error("Failed to delete goal:", error);
      toast.error("Failed to delete goal");
    }
  };

  const activeGoals = goals.filter(g => g.status === "active");
  const completedGoals = goals.filter(g => g.status === "completed");
  const averageProgress = activeGoals.length > 0 
    ? activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length 
    : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse shadow-sm">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold gradient-text flex items-center gap-2">
            🎯 Goals
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Active: {activeGoals.length} • Completed: {completedGoals.length} • Progress: {Math.round(averageProgress)}%
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold hover:shadow-lg transition flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          New Goal
        </button>
      </div>

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Set your first goal and start achieving milestones
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition"
          >
            Create Goal
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Goals */}
          {activeGoals.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Active Goals</h3>
              {activeGoals.map((goal, index) => (
                <motion.div
                  key={goal._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GoalCard
                    goal={goal}
                    onUpdateMilestone={(milestoneId, completed) => 
                      handleUpdateMilestone(goal._id, milestoneId, completed)
                    }
                    onDelete={() => handleDeleteGoal(goal._id)}
                  />
                </motion.div>
              ))}
            </>
          )}

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-8">
                🏆 Completed Goals
              </h3>
              <div className="space-y-4">
                {completedGoals.map((goal) => (
                  <GoalCard
                    key={goal._id}
                    goal={goal}
                    onDelete={() => handleDeleteGoal(goal._id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Create Goal Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold gradient-text">Create New Goal</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={handleCreateGoal} className="space-y-4">
                {/* Goal Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Goal Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Learn React in 3 Months"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    placeholder="What do you want to achieve?"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Target Date & Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Target Date *
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      value={newGoal.targetDate}
                      onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      value={newGoal.category}
                      onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="Personal">Personal</option>
                      <option value="Work">Work</option>
                      <option value="Study">Study</option>
                      <option value="Health">Health</option>
                      <option value="Finance">Finance</option>
                    </select>
                  </div>
                </div>

                {/* Milestones Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Milestones
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Milestone title"
                      value={newMilestone.title}
                      onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                    <input
                      type="date"
                      value={newMilestone.dueDate}
                      onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
                      className="w-32 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddMilestone}
                      className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition text-sm"
                    >
                      Add
                    </button>
                  </div>

                  {/* Milestone List */}
                  {newGoal.milestones.length > 0 && (
                    <div className="space-y-2">
                      {newGoal.milestones.map((milestone, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                          <div>
                            <p className="text-sm font-medium">{milestone.title}</p>
                            <p className="text-xs text-gray-500">Due: {new Date(milestone.dueDate).toLocaleDateString()}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMilestone(index)}
                            className="text-red-600 hover:text-red-700 transition"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold hover:shadow-lg transition"
                >
                  Create Goal
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}