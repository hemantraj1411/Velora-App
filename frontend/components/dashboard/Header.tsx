"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Bars3Icon, 
  MicrophoneIcon
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import NotificationBell from "./NotificationBell";

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'premium' | 'admin';
  avatar?: string;
  lastLoginAt?: string;
  preferences?: {
    theme: 'light' | 'dark';
    notifications: boolean;
    emailReminders: boolean;
    defaultView: string;
    language: string;
    timezone: string;
  };
  stats?: {
    totalTasks: number;
    completedTasks: number;
    currentStreak: number;
    longestStreak: number;
    totalFocusTime: number;
    xp: number;
    level: number;
  };
  badges?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface HeaderProps {
  user: User | null;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isMobile?: boolean;
}

export default function Header({ user, isSidebarOpen, setIsSidebarOpen, isMobile = false }: HeaderProps) {
  const [isListening, setIsListening] = useState(false);

  const createTaskFromVoice = async (command: string) => {
    try {
      // Parse the voice command to extract task details
      const taskData = parseVoiceCommand(command);
      
      // Send to backend
      const response = await api.post("/tasks", taskData);
      
      if (response.data) {
        toast.success(`Task created: "${taskData.title}"`);
        // Dispatch a custom event to refresh tasks
        window.dispatchEvent(new CustomEvent('taskCreated', { detail: response.data.task }));
      }
    } catch (error) {
      console.error("Failed to create task:", error);
      toast.error("Failed to create task. Please try again.");
    }
  };

  const parseVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    // Default task values
    let title = command;
    let priority: 'high' | 'medium' | 'low' = 'medium';
    let dueDate = new Date();
    let category = "Personal";
    
    // Detect priority
    if (lowerCommand.includes("urgent") || lowerCommand.includes("important") || lowerCommand.includes("asap")) {
      priority = 'high';
    } else if (lowerCommand.includes("someday") || lowerCommand.includes("when possible")) {
      priority = 'low';
    }
    
    // Detect due date
    if (lowerCommand.includes("tomorrow")) {
      dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else if (lowerCommand.includes("next week")) {
      dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    } else if (lowerCommand.includes("next month")) {
      dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    } else {
      dueDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // Default 2 days
    }
    
    // Detect category
    if (lowerCommand.includes("work") || lowerCommand.includes("meeting") || lowerCommand.includes("project")) {
      category = "Work";
    } else if (lowerCommand.includes("study") || lowerCommand.includes("learn") || lowerCommand.includes("exam")) {
      category = "Study";
    } else if (lowerCommand.includes("health") || lowerCommand.includes("gym") || lowerCommand.includes("exercise")) {
      category = "Health";
    } else if (lowerCommand.includes("shopping") || lowerCommand.includes("buy")) {
      category = "Shopping";
    } else if (lowerCommand.includes("family") || lowerCommand.includes("home")) {
      category = "Family";
    } else if (lowerCommand.includes("finance") || lowerCommand.includes("bill") || lowerCommand.includes("payment")) {
      category = "Finance";
    }
    
    // Clean up title (remove command words)
    const removeWords = ["remind me to", "add task", "create task", "new task", "urgent", "important", "tomorrow", "next week"];
    let cleanTitle = command;
    removeWords.forEach(word => {
      cleanTitle = cleanTitle.replace(new RegExp(word, 'gi'), '');
    });
    title = cleanTitle.trim().charAt(0).toUpperCase() + cleanTitle.trim().slice(1);
    
    return {
      title: title,
      description: `Created via voice command: ${command}`,
      priority,
      category,
      dueDate: dueDate.toISOString().split('T')[0],
      dueTime: "12:00",
      estimatedTime: 30,
    };
  };

  const startVoiceInput = () => {
    if (typeof window !== 'undefined' && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        toast.success("🎤 Listening... Speak your task now");
      };

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        toast.loading(`Creating task: "${transcript}"`, { duration: 2000 });
        
        // Create task from voice command
        await createTaskFromVoice(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        
        if (event.error === "no-speech") {
          toast.error("No speech detected. Please try again.");
        } else if (event.error === "audio-capture") {
          toast.error("No microphone found. Please check your microphone.");
        } else {
          toast.error("Could not recognize speech. Please try again.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      toast.error("Voice recognition is not supported in your browser. Please use Chrome, Edge, or Safari.");
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
          
          {!isMobile && (
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Connected</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Notification Bell */}
          <NotificationBell />
          
          {/* Voice Input Button */}
          <button
            onClick={startVoiceInput}
            className={`p-2 rounded-lg transition relative ${
              isListening
                ? "bg-red-500 text-white animate-pulse"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
            title="Click to add task by voice"
          >
            <MicrophoneIcon className="h-5 w-5" />
            {isListening && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </button>

          {/* User Avatar - Mobile only */}
          {isMobile && user && (
            <div className="md:hidden flex items-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}