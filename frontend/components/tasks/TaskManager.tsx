"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlusIcon, SparklesIcon } from "@heroicons/react/24/outline";
import TaskCard from "./TaskCard";
import TaskForm from "./TaskForm";
import TaskFilters from "./TaskFilters";
import { api } from "@/lib/api";
import { Task } from "@/types";
import toast from "react-hot-toast";
import { notificationScheduler } from "@/lib/notificationScheduler";

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    category: "",
    search: "",
  });

  useEffect(() => {
    fetchTasks();
    
    const handleTaskCreated = (event: CustomEvent) => {
      console.log("Task created via voice:", event.detail);
      setTasks(prev => [event.detail, ...prev]);
      toast.success(`Voice task added: "${event.detail.title}"`);
      
      if (event.detail.status !== 'completed') {
        notificationScheduler.scheduleTask(event.detail);
      }
    };
    
    window.addEventListener('taskCreated', handleTaskCreated as EventListener);
    
    return () => {
      window.removeEventListener('taskCreated', handleTaskCreated as EventListener);
    };
  }, [filters]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.priority) params.append("priority", filters.priority);
      if (filters.category) params.append("category", filters.category);
      if (filters.search) params.append("search", filters.search);
      
      const response = await api.get(`/tasks?${params.toString()}`);
      const fetchedTasks = response.data.tasks || [];
      setTasks(fetchedTasks);
      
      const pendingTasks = fetchedTasks.filter((t: Task) => t.status !== 'completed');
      notificationScheduler.rescheduleAll(pendingTasks);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData: Partial<Task>) => {
    try {
      const response = await api.post("/tasks", taskData);
      const newTask = response.data.task;
      setTasks([newTask, ...tasks]);
      setShowForm(false);
      toast.success("Task created successfully");
      
      if (newTask.status !== 'completed') {
        notificationScheduler.scheduleTask(newTask);
      }
      
      return newTask;
    } catch (error) {
      console.error("Failed to create task:", error);
      toast.error("Failed to create task");
      throw error;
    }
  };

  const handleUpdateTask = async (id: string, taskData: Partial<Task>) => {
    try {
      const response = await api.put(`/tasks/${id}`, taskData);
      const updatedTask = response.data.task;
      setTasks(tasks.map(t => t._id === id ? updatedTask : t));
      setEditingTask(null);
      toast.success("Task updated successfully");
      
      if (taskData.status === 'completed') {
        notificationScheduler.cancelTask(id);
      } else {
        notificationScheduler.scheduleTask(updatedTask);
      }
      
      return updatedTask;
    } catch (error) {
      console.error("Failed to update task:", error);
      toast.error("Failed to update task");
      throw error;
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        await api.delete(`/tasks/${id}`);
        setTasks(tasks.filter(t => t._id !== id));
        toast.success("Task deleted successfully");
        notificationScheduler.cancelTask(id);
      } catch (error) {
        console.error("Failed to delete task:", error);
        toast.error("Failed to delete task");
      }
    }
  };

  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const pendingTasks = tasks.filter(t => t.status !== "completed").length;
  const highPriorityTasks = tasks.filter(t => t.priority === "high" && t.status !== "completed").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0f1a2a] to-[#1a2234] p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1a2234]/50 backdrop-blur-xl rounded-2xl p-6 border border-[#2a3a4a]">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
              My Tasks
            </h2>
            <div className="flex flex-wrap gap-3 mt-2">
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                {pendingTasks} pending
              </span>
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                {completedTasks} completed
              </span>
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                {highPriorityTasks} high priority
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all transform hover:scale-105 flex items-center gap-2 w-full md:w-auto justify-center"
          >
            <PlusIcon className="h-5 w-5" />
            <span>New Task</span>
          </button>
        </div>

        {/* Filters */}
        <TaskFilters filters={filters} setFilters={setFilters} />

        {/* Task List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#1a2234]/50 rounded-2xl p-6 animate-pulse border border-[#2a3a4a]">
                <div className="h-5 bg-[#2a3a4a] rounded-lg w-1/3 mb-3"></div>
                <div className="h-3 bg-[#2a3a4a] rounded-lg w-2/3"></div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a2234]/50 backdrop-blur-xl rounded-2xl p-16 text-center border border-[#2a3a4a]"
          >
            <div className="text-7xl mb-6">🚀</div>
            <h3 className="text-2xl font-semibold text-white mb-3">No tasks yet</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Create your first task and start your productivity journey
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              Create Your First Task
            </button>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {tasks.map((task, index) => (
                <motion.div
                  key={task._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <TaskCard
                    task={task}
                    onUpdate={handleUpdateTask}
                    onDelete={handleDeleteTask}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Task Form Modals */}
        <TaskForm
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSubmit={handleCreateTask}
        />
        
        {editingTask && (
          <TaskForm
            isOpen={!!editingTask}
            onClose={() => setEditingTask(null)}
            onSubmit={(data) => handleUpdateTask(editingTask._id, data)}
            initialData={editingTask}
          />
        )}
      </div>
    </div>
  );
}