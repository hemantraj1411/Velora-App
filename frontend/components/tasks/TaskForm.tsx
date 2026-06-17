"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, BellIcon } from "@heroicons/react/24/outline";
import { Task } from "@/types";
import toast from "react-hot-toast";

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Partial<Task>) => Promise<void>;
  initialData?: Task | null;
}

const categories = ["Work", "Study", "Personal", "Health", "Finance", "Shopping", "Family"];

interface FormData {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: string;
  dueDate: string;
  dueTime: string;
  estimatedTime: number;
  reminderEnabled: boolean;
}

export default function TaskForm({ isOpen, onClose, onSubmit, initialData }: TaskFormProps) {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    priority: "medium",
    category: "Personal",
    dueDate: new Date().toISOString().split("T")[0],
    dueTime: "",
    estimatedTime: 60,
    reminderEnabled: true,
  });
  const [loading, setLoading] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [timeError, setTimeError] = useState<string>("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description || "",
        priority: initialData.priority,
        category: initialData.category,
        dueDate: new Date(initialData.dueDate).toISOString().split("T")[0],
        dueTime: initialData.dueTime || "",
        estimatedTime: initialData.estimatedTime || 60,
        reminderEnabled: true,
      });
    } else {
      // Set default date to tomorrow if no time is set
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        category: "Personal",
        dueDate: tomorrow.toISOString().split("T")[0],
        dueTime: "",
        estimatedTime: 60,
        reminderEnabled: true,
      });
    }
  }, [initialData]);

  // Validate the date and time
  const validateDateTime = (date: string, time: string): { valid: boolean; message: string } => {
    if (!date) {
      return { valid: false, message: "Please select a due date" };
    }

    const now = new Date();
    const selectedDate = new Date(date);
    
    // If time is provided, set the exact time
    if (time) {
      const [hours, minutes] = time.split(':');
      selectedDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      // If no time, set to end of day (11:59 PM)
      selectedDate.setHours(23, 59, 59, 999);
    }

    // Check if the selected date/time is in the past
    if (selectedDate < now) {
      const diffMs = now.getTime() - selectedDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      
      let message = "Cannot set task in the past! ";
      if (diffMins < 60) {
        message += `The selected time is ${diffMins} minute${diffMins !== 1 ? 's' : ''} ago.`;
      } else if (diffHours < 24) {
        message += `The selected time is ${diffHours} hour${diffHours !== 1 ? 's' : ''} ago.`;
      } else {
        message += "Please select a future date and time.";
      }
      
      return { valid: false, message };
    }

    return { valid: true, message: "" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate title
    if (!formData.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }
    
    // Validate date
    const validation = validateDateTime(formData.dueDate, formData.dueTime);
    if (!validation.valid) {
      setTimeError(validation.message);
      toast.error(validation.message);
      return;
    }
    
    setTimeError("");
    setLoading(true);
    
    try {
      await onSubmit(formData);
      onClose();
      
      // Show success message with time info
      if (formData.dueTime) {
        toast.success(`Task "${formData.title}" will notify you at ${formData.dueTime}! 🔔`);
      } else {
        toast.success(`Task "${formData.title}" created successfully!`);
      }
    } catch (error) {
      console.error("Failed to save task:", error);
      toast.error("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const getTimeWarningMessage = () => {
    if (!formData.dueTime) return null;
    const validation = validateDateTime(formData.dueDate, formData.dueTime);
    if (!validation.valid) return validation.message;
    
    const selectedDate = new Date(formData.dueDate);
    const [hours, minutes] = formData.dueTime.split(':');
    selectedDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    const minutesUntilDue = Math.floor((selectedDate.getTime() - new Date().getTime()) / (1000 * 60));
    
    if (minutesUntilDue <= 5) {
      return `⚠️ This task is due in ${minutesUntilDue} minutes! You will get an immediate notification.`;
    }
    if (minutesUntilDue <= 60) {
      return `⏰ You will be notified in ${minutesUntilDue} minutes.`;
    }
    return null;
  };

  // Get minimum date for date input
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold gradient-text">
                  {initialData ? "Edit Task" : "Create New Task"}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Time Error Message */}
              {timeError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                >
                  <p className="text-sm text-red-800 dark:text-red-200">
                    ❌ {timeError}
                  </p>
                </motion.div>
              )}

              {/* Time Warning */}
              {!timeError && showTimeWarning && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                >
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    {getTimeWarningMessage()}
                  </p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter task title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    placeholder="Add description (optional)"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as "high" | "medium" | "low" })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="high">🔴 High - Urgent</option>
                      <option value="medium">🟠 Medium - Important</option>
                      <option value="low">🟢 Low - Normal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {categories.map(cat => <option key={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      min={getMinDate()}
                      onChange={(e) => {
                        setFormData({ ...formData, dueDate: e.target.value });
                        setTimeError("");
                      }}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Due Time
                    </label>
                    <input
                      id="dueTime"
                      type="time"
                      value={formData.dueTime}
                      onChange={(e) => {
                        setFormData({ ...formData, dueTime: e.target.value });
                        setTimeError("");
                      }}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Set a time to get notified exactly at that time
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estimated Time (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.estimatedTime}
                    onChange={(e) => setFormData({ ...formData, estimatedTime: parseInt(e.target.value) || 0 })}
                    min={5}
                    max={480}
                    step={5}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Quick Time Selectors */}
                {!formData.dueTime && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Quick Time Presets
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["09:00", "10:00", "12:00", "14:00", "15:00", "17:00", "18:00"].map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => {
                            const validation = validateDateTime(formData.dueDate, time);
                            if (!validation.valid) {
                              toast.error(validation.message);
                              return;
                            }
                            setFormData({ ...formData, dueTime: time });
                            setTimeError("");
                            setShowTimeWarning(true);
                            setTimeout(() => setShowTimeWarning(false), 5000);
                          }}
                          className="px-3 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-500 transition"
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notification Info */}
                {formData.dueTime && (
                  <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                    <div className="flex items-center gap-2">
                      <BellIcon className="h-5 w-5 text-primary-600" />
                      <div>
                        <p className="text-sm font-medium text-primary-800 dark:text-primary-200">
                          Notification Schedule
                        </p>
                        <p className="text-xs text-primary-600 dark:text-primary-300">
                          You will be notified at {formData.dueTime} on {new Date(formData.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold hover:shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{initialData ? "Updating..." : "Creating..."}</span>
                    </div>
                  ) : (
                    <span>{initialData ? "Update Task" : "Create Task"}</span>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}