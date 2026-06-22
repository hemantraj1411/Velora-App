"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CalendarIcon
} from "@heroicons/react/24/outline";
import { api } from "@/lib/api";
import { Task } from "@/types";
import toast from "react-hot-toast";

type ViewMode = 'month' | 'week' | 'day';

interface MonthDay {
  date: Date;
  tasks: Task[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

interface WeekDay {
  date: Date;
  tasks: Task[];
}

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [loading, setLoading] = useState(true);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get("/tasks");
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const getTasksForDate = (date: Date): Task[] => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const getTasksForWeek = (date: Date): WeekDay[] => {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekDays: WeekDay[] = [];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      weekDays.push({
        date: day,
        tasks: getTasksForDate(day)
      });
    }
    return weekDays;
  };

  const getTasksForMonth = (): MonthDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    const days: MonthDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      
      days.push({
        date,
        tasks: getTasksForDate(date),
        isCurrentMonth,
        isToday
      });
    }
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'prev' ? -7 : 7));
    setCurrentDate(newDate);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'prev' ? -1 : 1));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatWeekRange = (date: Date) => {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    return `${startMonth} - ${endMonth}`;
  };

  const formatDay = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: 'bg-green-500/20', text: 'text-green-400', label: '✅ Done' };
      case 'in-progress':
        return { bg: 'bg-blue-500/20', text: 'text-blue-400', label: '🔄 In Progress' };
      case 'pending':
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '⏳ Pending' };
      case 'overdue':
        return { bg: 'bg-red-500/20', text: 'text-red-400', label: '⚠️ Overdue' };
      default:
        return { bg: 'bg-gray-500/20', text: 'text-gray-400', label: status };
    }
  };

  if (loading) {
    return (
      <div className="bg-[#1a2234] rounded-xl p-4 animate-pulse border border-[#2a3a4a] h-80"></div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ✅ Calendar Only - NO STATS HERE */}
      <div className="bg-[#1a2234] rounded-xl border border-[#2a3a4a] overflow-hidden">
        {/* Navigation Bar */}
        <div className="p-3 md:p-4 border-b border-[#2a3a4a]">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <button
                onClick={goToToday}
                className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition flex-shrink-0"
              >
                Today
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => viewMode === 'month' ? navigateMonth('prev') : viewMode === 'week' ? navigateWeek('prev') : navigateDay('prev')}
                  className="p-1.5 md:p-2 rounded-lg hover:bg-[#2a3a4a] transition text-gray-400 hover:text-white"
                >
                  <ChevronLeftIcon className="h-4 w-4 md:h-5 md:w-5" />
                </button>
                <button
                  onClick={() => viewMode === 'month' ? navigateMonth('next') : viewMode === 'week' ? navigateWeek('next') : navigateDay('next')}
                  className="p-1.5 md:p-2 rounded-lg hover:bg-[#2a3a4a] transition text-gray-400 hover:text-white"
                >
                  <ChevronRightIcon className="h-4 w-4 md:h-5 md:w-5" />
                </button>
              </div>
              <h2 className="text-sm md:text-lg font-semibold text-white truncate flex-1 text-center sm:text-left">
                {viewMode === 'month' && formatMonthYear(currentDate)}
                {viewMode === 'week' && formatWeekRange(currentDate)}
                {viewMode === 'day' && formatDay(currentDate)}
              </h2>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-[#0f1a2a] rounded-lg p-0.5 md:p-1 w-full sm:w-auto">
              {['month', 'week', 'day'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode as ViewMode)}
                  className={`flex-1 sm:flex-none px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-md transition capitalize ${
                    viewMode === mode
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                      : 'text-gray-400 hover:text-white hover:bg-[#2a3a4a]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Month View */}
        {viewMode === 'month' && (
          <div className="p-2 md:p-4 overflow-x-auto">
            <div className="grid grid-cols-7 gap-0.5 md:gap-1 mb-1 md:mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-center text-[10px] md:text-xs font-medium text-gray-500 py-1 md:py-2 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5 md:gap-1">
              {getTasksForMonth().map((day, index) => {
                const isSelected = selectedDate && day.date.toDateString() === selectedDate.toDateString();
                
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(day.date)}
                    className={`
                      min-h-[50px] md:min-h-[80px] lg:min-h-[100px] p-1 md:p-2 rounded-lg text-left transition-all
                      ${!day.isCurrentMonth ? 'opacity-30' : ''}
                      ${day.isToday ? 'ring-1 md:ring-2 ring-purple-500' : ''}
                      ${isSelected ? 'bg-purple-500/20 ring-1 md:ring-2 ring-purple-500' : 'hover:bg-[#2a3a4a]'}
                    `}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-xs md:text-sm font-medium ${day.isToday ? 'text-purple-400' : 'text-white'}`}>
                        {day.date.getDate()}
                      </span>
                      {day.tasks.length > 0 && (
                        <span className="text-[8px] md:text-xs px-1 md:px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                          {day.tasks.length}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 md:mt-1 space-y-0.5">
                      {day.tasks.slice(0, 2).map(task => (
                        <div key={task._id} className="flex items-center gap-0.5 md:gap-1">
                          <div className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${getPriorityColor(task.priority)}`} />
                          <p className="text-[8px] md:text-xs truncate text-gray-300">
                            {task.title}
                          </p>
                        </div>
                      ))}
                      {day.tasks.length > 2 && (
                        <p className="text-[6px] md:text-xs text-gray-500">+{day.tasks.length - 2}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Week View */}
        {viewMode === 'week' && (
          <div className="overflow-x-auto p-2 md:p-4">
            <div className="min-w-[600px] md:min-w-[800px]">
              <div className="grid grid-cols-8 border-b border-[#2a3a4a]">
                <div className="p-1 md:p-3 text-center bg-[#0f1a2a] font-medium text-gray-500 text-[10px] md:text-sm">
                  Time
                </div>
                {getTasksForWeek(currentDate).map((day, idx) => (
                  <div key={idx} className="p-1 md:p-3 text-center bg-[#0f1a2a]">
                    <p className="font-medium text-white text-[10px] md:text-sm">
                      {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className="text-[8px] md:text-xs text-gray-400">{day.date.getDate()}</p>
                  </div>
                ))}
              </div>
              {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(hour => (
                <div key={hour} className="grid grid-cols-8 border-b border-[#2a3a4a]">
                  <div className="p-1 md:p-3 text-[8px] md:text-xs text-gray-500 bg-[#0f1a2a]">
                    {hour}:00
                  </div>
                  {getTasksForWeek(currentDate).map((day, idx) => {
                    const hourTasks = day.tasks.filter(t => {
                      const taskHour = t.dueTime ? parseInt(t.dueTime.split(':')[0]) : null;
                      return taskHour === hour;
                    });
                    return (
                      <div key={idx} className="p-0.5 md:p-1 min-h-[30px] md:min-h-[50px]">
                        {hourTasks.map(task => (
                          <div key={task._id} className="text-[6px] md:text-xs p-0.5 md:p-1.5 rounded bg-purple-500/20 text-purple-300 mb-0.5 truncate">
                            {task.title}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Day View */}
        {viewMode === 'day' && (
          <div className="p-2 md:p-4">
            <div className="space-y-1 md:space-y-2">
              {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(hour => {
                const hourTasks = getTasksForDate(currentDate).filter(t => {
                  const taskHour = t.dueTime ? parseInt(t.dueTime.split(':')[0]) : null;
                  return taskHour === hour;
                });
                return (
                  <div key={hour} className="flex gap-2 md:gap-4">
                    <div className="w-12 md:w-16 text-right text-[8px] md:text-xs text-gray-500 py-1 md:py-2 flex-shrink-0">
                      {hour}:00
                    </div>
                    <div className="flex-1 border-l border-[#2a3a4a] pl-2 md:pl-4 min-h-[30px] md:min-h-[50px]">
                      {hourTasks.map(task => (
                        <div key={task._id} className="mb-1 md:mb-2 p-1.5 md:p-3 rounded-lg bg-purple-500/10 border-l-2 md:border-l-4 border-purple-500">
                          <div className="flex items-center justify-between gap-1 md:gap-2">
                            <p className="font-medium text-white text-[10px] md:text-sm truncate">{task.title}</p>
                            <span className={`text-[6px] md:text-xs px-1 md:px-2 py-0.5 rounded-full text-white ${getPriorityColor(task.priority)} flex-shrink-0`}>
                              {task.priority}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-[8px] md:text-xs text-gray-400 mt-0.5 md:mt-1 truncate">{task.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Selected Date Tasks Panel */}
      {selectedDate && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-[#1a2234] rounded-xl border border-[#2a3a4a] overflow-hidden"
          >
            <div className="p-3 md:p-4 border-b border-[#2a3a4a] flex justify-between items-center">
              <div className="min-w-0">
                <h3 className="text-sm md:text-lg font-semibold text-white truncate">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <p className="text-xs md:text-sm text-gray-400">
                  {getTasksForDate(selectedDate).length} tasks scheduled
                </p>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-1 rounded-lg hover:bg-[#2a3a4a] transition text-gray-400 hover:text-white flex-shrink-0"
              >
                <ChevronUpIcon className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </div>
            <div className="p-3 md:p-4 space-y-2 md:space-y-3 max-h-60 md:max-h-96 overflow-y-auto">
              {getTasksForDate(selectedDate).length === 0 ? (
                <div className="text-center py-4 md:py-8">
                  <p className="text-sm md:text-base text-gray-400">No tasks scheduled for this day</p>
                </div>
              ) : (
                getTasksForDate(selectedDate).map(task => {
                  const statusBadge = getStatusBadge(task.status);
                  return (
                    <div key={task._id} className="p-2 md:p-3 rounded-lg border border-[#2a3a4a] hover:bg-[#2a3a4a] transition">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 md:gap-2 mb-0.5 md:mb-1">
                            <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full flex-shrink-0 ${getPriorityColor(task.priority)}`} />
                            <p className={`font-medium text-xs md:text-sm text-white truncate ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                              {task.title}
                            </p>
                          </div>
                          {task.description && (
                            <p className="text-[10px] md:text-xs text-gray-400 mt-0.5 md:mt-1 truncate">{task.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-1 md:gap-3 mt-1 md:mt-2">
                            <span className={`text-[8px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
                              {statusBadge.label}
                            </span>
                            {task.dueTime && (
                              <span className="text-[8px] md:text-xs text-gray-500">🕐 {task.dueTime}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setExpandedTask(expandedTask === task._id ? null : task._id)}
                          className="p-1 rounded-lg hover:bg-[#2a3a4a] transition text-gray-400 hover:text-white flex-shrink-0"
                        >
                          <ChevronDownIcon className={`h-3 w-3 md:h-4 md:w-4 transition-transform ${expandedTask === task._id ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      
                      {expandedTask === task._id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-[#2a3a4a]"
                        >
                          <div className="flex flex-wrap gap-2 md:gap-3">
                            <button className="text-[10px] md:text-xs text-purple-400 hover:text-purple-300 transition">
                              ✏️ Edit
                            </button>
                            <button className="text-[10px] md:text-xs text-green-400 hover:text-green-300 transition">
                              ✅ Complete
                            </button>
                            <button className="text-[10px] md:text-xs text-red-400 hover:text-red-300 transition">
                              🗑️ Delete
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}