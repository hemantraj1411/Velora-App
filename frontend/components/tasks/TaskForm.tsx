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

  const validateDateTime = (date: string, time: string): { valid: boolean; message: string } => {
    if (!date) {
      return { valid: false, message: "Please select a due date" };
    }

    const now = new Date();
    const selectedDate = new Date(date);
    
    if (time) {
      const [hours, minutes] = time.split(':');
      selectedDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      selectedDate.setHours(23, 59, 59, 999);
    }

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
    
    if (!formData.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }
    
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
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-gradient-to-br from-[#0f1a2a] to-[#1a2234] rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#2a3a4a]"
          >
            <div className="sticky top-0 bg-gradient-to-r from-[#1a2234] to-[#0f1a2a] border-b border-[#2a3a4a] p-5 rounded-t-3xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  {initialData ? "✏️ Edit Task" : "✨ Create New Task"}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-[#2a3a4a] transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {timeError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30"
                >
                  <p className="text-sm text-red-400">❌ {timeError}</p>
                </motion.div>
              )}

              {!timeError && showTimeWarning && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30"
                >
                  <p className="text-sm text-yellow-400">{getTimeWarningMessage()}</p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    placeholder="What do you need to do?"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#2a3a4a] bg-[#0f1a2a] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Add some details (optional)"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-[#2a3a4a] bg-[#0f1a2a] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as "high" | "medium" | "low" })}
                      className="w-full px-4 py-3 rounded-xl border border-[#2a3a4a] bg-[#0f1a2a] text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    >
                      <option value="high">🔴 High</option>
                      <option value="medium">🟠 Medium</option>
                      <option value="low">🟢 Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#2a3a4a] bg-[#0f1a2a] text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    >
                      {categories.map(cat => <option key={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
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
                      className="w-full px-4 py-3 rounded-xl border border-[#2a3a4a] bg-[#0f1a2a] text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
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
                      className="w-full px-4 py-3 rounded-xl border border-[#2a3a4a] bg-[#0f1a2a] text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Estimated Time (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.estimatedTime}
                    onChange={(e) => setFormData({ ...formData, estimatedTime: parseInt(e.target.value) || 0 })}
                    min={5}
                    max={480}
                    step={5}
                    className="w-full px-4 py-3 rounded-xl border border-[#2a3a4a] bg-[#0f1a2a] text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                {!formData.dueTime && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
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
                          className="px-3 py-1.5 text-sm rounded-xl border border-[#2a3a4a] text-gray-300 hover:border-purple-500 hover:text-white hover:bg-purple-500/10 transition-all"
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {formData.dueTime && (
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-3">
                      <BellIcon className="h-5 w-5 text-purple-400" />
                      <div>
                        <p className="text-sm font-medium text-purple-400">
                          Notification Schedule
                        </p>
                        <p className="text-xs text-gray-400">
                          You will be notified at {formData.dueTime} on {new Date(formData.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
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