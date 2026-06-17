"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  SparklesIcon, 
  PaperAirplaneIcon,
  MicrophoneIcon,
  AcademicCapIcon,
  CalendarIcon,
  ChartBarIcon,
  LightBulbIcon
} from "@heroicons/react/24/outline";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

export default function AIAssistant() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content: "Hello! I'm Velora AI, your productivity assistant powered by Groq. I can help you with:\n\n📚 Creating study plans\n📅 Planning your day\n🎯 Prioritizing tasks\n💡 Productivity tips\n\nAsk me anything! How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const response = await api.post("/ai/chat", { 
        message: currentInput
      });
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: response.data.response || "I'm here to help! What else would you like to know?",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("Chat error:", error);
      toast.error(error.response?.data?.error || "Failed to get AI response");
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: "Sorry, I encountered an error. Please check if the backend server is running and try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startVoiceInput = () => {
    if (typeof window !== 'undefined' && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        toast.success("🎤 Listening... Speak now");
      };

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        setInput(transcript);
        setTimeout(() => handleSendMessage(), 100);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast.error("Could not recognize speech");
      };

      recognition.start();
    } else {
      toast.error("Voice recognition not supported in this browser");
    }
  };

  const quickActions = [
    { id: "study", name: "Study Plan", icon: AcademicCapIcon, prompt: "Create a study plan for my exam" },
    { id: "day", name: "Plan My Day", icon: CalendarIcon, prompt: "Plan my day with my current tasks" },
    { id: "prioritize", name: "Prioritize", icon: ChartBarIcon, prompt: "Help me prioritize my tasks" },
    { id: "suggest", name: "Suggestions", icon: LightBulbIcon, prompt: "Give me productivity tips" },
  ];

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => handleSendMessage(), 100);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-r from-primary-500 to-purple-500">
            <SparklesIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">AI Assistant</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Powered by Groq AI</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action.prompt)}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition group"
            >
              <action.icon className="h-5 w-5 text-primary-500 group-hover:scale-110 transition" />
              <span className="text-xs text-gray-600 dark:text-gray-400">{action.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-2xl whitespace-pre-wrap ${
                message.type === "user"
                  ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-br-sm"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm"
              }`}
            >
              {message.content}
            </div>
          </motion.div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-2xl rounded-bl-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <button
            onClick={startVoiceInput}
            className={`p-2 rounded-lg transition ${
              isListening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
            title="Voice input"
          >
            <MicrophoneIcon className="h-5 w-5" />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Ask me anything about productivity, tasks, planning, or general questions..."
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="p-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          💡 Try asking: "How do I stay motivated?", "Tips for time management", or "Create a morning routine"
        </p>
      </div>
    </div>
  );
}