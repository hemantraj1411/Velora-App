"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlusIcon } from "@heroicons/react/24/outline";
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
    
    // Listen for voice-created tasks
    const handleTaskCreated = (event: CustomEvent) => {
      console.log("Task created via voice:", event.detail);
      setTasks(prev => [event.detail, ...prev]);
      toast.success(`Voice task added: "${event.detail.title}"`);
      
      // Schedule notification for voice-created task
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
      
      // Schedule notifications for pending tasks
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
      
      // Schedule notification for this task
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
      
      // If task is completed, cancel its notification
      if (taskData.status === 'completed') {
        notificationScheduler.cancelTask(id);
      } else {
        // Reschedule with updated data
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
        
        // Cancel scheduled notification
        notificationScheduler.cancelTask(id);
      } catch (error) {
        console.error("Failed to delete task:", error);
        toast.error("Failed to delete task");
      }
    }
  };

  const handleToggleComplete = async (task: Task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    await handleUpdateTask(task._id, { status: newStatus });
  };

  // Calculate stats
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const pendingTasks = tasks.filter(t => t.status !== "completed").length;
  const highPriorityTasks = tasks.filter(t => t.priority === "high" && t.status !== "completed").length;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold gradient-text">My Tasks</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {pendingTasks} tasks pending • {completedTasks} completed • {highPriorityTasks} high priority
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold hover:shadow-lg transition flex items-center space-x-2"
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
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 animate-pulse shadow-sm">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first task or use voice command to get started
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition"
          >
            Create Task
          </button>
        </div>
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
                  onToggleComplete={() => handleToggleComplete(task)}
                  onEdit={() => setEditingTask(task)}
                  onDelete={() => handleDeleteTask(task._id)}
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
  );
}