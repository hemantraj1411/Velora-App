"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  PlayIcon, 
  PauseIcon, 
  ArrowPathIcon,
  MoonIcon,
  SunIcon,
  MusicalNoteIcon
} from "@heroicons/react/24/solid";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

export default function FocusMode() {
  const [time, setTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [sound, setSound] = useState<"none" | "rain" | "waves" | "forest">("none");
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && time > 0) {
      interval = setInterval(() => {
        setTime(time - 1);
      }, 1000);
    } else if (time === 0) {
      setIsActive(false);
      if (mode === "focus") {
        toast.success("Focus session complete! Take a 5-minute break.");
        setMode("break");
        setTime(5 * 60);
      } else {
        toast.success("Break complete! Ready for another focus session?");
        setMode("focus");
        setTime(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, time, mode]);

  const fetchTasks = async () => {
    try {
      const response = await api.get("/tasks?status=pending");
      setTasks(response.data.tasks.slice(0, 5));
    } catch (error) {
      console.error("Failed to fetch tasks");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const resetTimer = () => {
    setIsActive(false);
    setTime(mode === "focus" ? 25 * 60 : 5 * 60);
  };

  const completeTask = async (taskId: string) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: "completed" });
      setTasks(tasks.filter(t => t._id !== taskId));
      toast.success("Task completed! +10 XP");
    } catch (error) {
      toast.error("Failed to complete task");
    }
  };

  const sounds = [
    { id: "none", name: "No Sound", icon: MusicalNoteIcon },
    { id: "rain", name: "Rain", icon: MusicalNoteIcon },
    { id: "waves", name: "Ocean Waves", icon: MusicalNoteIcon },
    { id: "forest", name: "Forest", icon: MusicalNoteIcon },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Timer Section */}
      <div className="lg:col-span-2">
        <div className="glass rounded-xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setMode("focus")}
              className={`px-4 py-2 rounded-l-lg transition ${
                mode === "focus"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}
            >
              <SunIcon className="h-5 w-5 inline mr-2" />
              Focus
            </button>
            <button
              onClick={() => setMode("break")}
              className={`px-4 py-2 rounded-r-lg transition ${
                mode === "break"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}
            >
              <MoonIcon className="h-5 w-5 inline mr-2" />
              Break
            </button>
          </div>

          <div className="text-8xl font-mono font-bold text-primary-600 mb-8">
            {formatTime(time)}
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setIsActive(!isActive)}
              className="p-4 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition"
            >
              {isActive ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
            </button>
            <button
              onClick={resetTimer}
              className="p-4 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700 transition"
            >
              <ArrowPathIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Sound Selection */}
          <div className="mt-8">
            <h3 className="text-sm font-medium mb-3">Ambient Sound</h3>
            <div className="flex justify-center gap-2">
              {sounds.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSound(s.id as any)}
                  className={`px-3 py-2 rounded-lg text-sm transition ${
                    sound === s.id
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  <s.icon className="h-4 w-4 inline mr-1" />
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Today's Focus Tasks</h3>
        
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No pending tasks. Great job!
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-3 rounded-lg cursor-pointer transition ${
                  selectedTask === task._id
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
                onClick={() => setSelectedTask(task._id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs opacity-75">{task.estimatedTime} min</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      completeTask(task._id);
                    }}
                    className="px-2 py-1 rounded bg-green-500 text-white text-xs hover:bg-green-600 transition"
                  >
                    Complete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-6 p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20">
          <p className="text-sm">
            💡 <strong>Focus Tip:</strong> {selectedTask 
              ? `Work on "${tasks.find(t => t._id === selectedTask)?.title}" for the next 25 minutes` 
              : "Select a task to focus on"}
          </p>
        </div>
      </div>
    </div>
  );
}