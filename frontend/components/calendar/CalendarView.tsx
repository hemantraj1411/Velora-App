"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CalendarDaysIcon
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
      case 'medium': return 'bg-orange-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: '✓ Completed' };
      case 'in-progress':
        return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'In Progress' };
      case 'pending':
        return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: 'Pending' };
      case 'overdue':
        return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Overdue' };
      default:
        return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', label: status };
    }
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status !== 'completed').length,
    overdue: tasks.filter(t => t.status === 'overdue').length
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Tasks</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              <p className="text-sm text-gray-500">Overdue</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Navigation Bar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={goToToday}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                Today
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => viewMode === 'month' ? navigateMonth('prev') : viewMode === 'week' ? navigateWeek('prev') : navigateDay('prev')}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => viewMode === 'month' ? navigateMonth('next') : viewMode === 'week' ? navigateWeek('next') : navigateDay('next')}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
              <h2 className="text-xl font-semibold ml-2">
                {viewMode === 'month' && formatMonthYear(currentDate)}
                {viewMode === 'week' && formatWeekRange(currentDate)}
                {viewMode === 'day' && formatDay(currentDate)}
              </h2>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                  viewMode === 'month'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                  viewMode === 'week'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                  viewMode === 'day'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Day
              </button>
            </div>
          </div>
        </div>

        {/* Month View */}
        {viewMode === 'month' && (
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {getTasksForMonth().map((day, index) => {
                const hasHighPriority = day.tasks.some(t => t.priority === 'high' && t.status !== 'completed');
                const isSelected = selectedDate && day.date.toDateString() === selectedDate.toDateString();
                
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(day.date)}
                    className={`
                      min-h-[100px] p-2 rounded-lg text-left transition-all
                      ${!day.isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800'}
                      ${day.isToday ? 'ring-2 ring-primary-500' : ''}
                      ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}
                    `}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-sm font-medium ${day.isToday ? 'text-primary-600 font-bold' : ''}`}>
                        {day.date.getDate()}
                      </span>
                      {day.tasks.length > 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600">
                          {day.tasks.length}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 space-y-1">
                      {day.tasks.slice(0, 2).map(task => (
                        <div key={task._id} className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                          <p className="text-xs truncate text-gray-600 dark:text-gray-400">
                            {task.title}
                          </p>
                        </div>
                      ))}
                      {day.tasks.length > 2 && (
                        <p className="text-xs text-gray-400">+{day.tasks.length - 2} more</p>
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
          <div className="overflow-x-auto p-4">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-8 border-b border-gray-100 dark:border-gray-700">
                <div className="p-3 text-center bg-gray-50 dark:bg-gray-800/50 font-medium text-gray-500">
                  Time
                </div>
                {getTasksForWeek(currentDate).map((day, idx) => (
                  <div key={idx} className="p-3 text-center bg-gray-50 dark:bg-gray-800/50">
                    <p className="font-medium text-gray-800 dark:text-white">
                      {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className="text-sm text-gray-500">{day.date.getDate()}</p>
                  </div>
                ))}
              </div>
              {[9, 10, 11, 12, 13, 14, 15, 16, 17].map(hour => (
                <div key={hour} className="grid grid-cols-8 border-b border-gray-100 dark:border-gray-700">
                  <div className="p-3 text-sm text-gray-500 bg-gray-50 dark:bg-gray-800/50">
                    {hour}:00
                  </div>
                  {getTasksForWeek(currentDate).map((day, idx) => {
                    const hourTasks = day.tasks.filter(t => {
                      const taskHour = t.dueTime ? parseInt(t.dueTime.split(':')[0]) : null;
                      return taskHour === hour;
                    });
                    return (
                      <div key={idx} className="p-2 min-h-[60px]">
                        {hourTasks.map(task => (
                          <div key={task._id} className="text-xs p-1 rounded bg-primary-100 dark:bg-primary-900/30 mb-1 truncate">
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
          <div className="p-4">
            <div className="space-y-4">
              {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(hour => {
                const hourTasks = getTasksForDate(currentDate).filter(t => {
                  const taskHour = t.dueTime ? parseInt(t.dueTime.split(':')[0]) : null;
                  return taskHour === hour;
                });
                return (
                  <div key={hour} className="flex gap-4">
                    <div className="w-16 text-right text-sm text-gray-500 py-2">
                      {hour}:00
                    </div>
                    <div className="flex-1 border-l border-gray-200 dark:border-gray-700 pl-4 min-h-[60px]">
                      {hourTasks.map(task => (
                        <div key={task._id} className="mb-2 p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-800 dark:text-white">{task.title}</p>
                            <span className={`text-xs px-2 py-1 rounded-full text-white ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
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
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <p className="text-sm text-gray-500">
                  {getTasksForDate(selectedDate).length} tasks scheduled
                </p>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <ChevronUpIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {getTasksForDate(selectedDate).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No tasks scheduled for this day</p>
                </div>
              ) : (
                getTasksForDate(selectedDate).map(task => {
                  const statusBadge = getStatusBadge(task.status);
                  return (
                    <div key={task._id} className="p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:shadow-sm transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                            <p className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                              {task.title}
                            </p>
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
                              {statusBadge.label}
                            </span>
                            {task.dueTime && (
                              <span className="text-xs text-gray-500">🕐 {task.dueTime}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setExpandedTask(expandedTask === task._id ? null : task._id)}
                          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        >
                          <ChevronDownIcon className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {expandedTask === task._id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700"
                        >
                          <div className="flex gap-2">
                            <button className="text-sm text-primary-600 hover:underline">Edit</button>
                            <button className="text-sm text-green-600 hover:underline">Mark Complete</button>
                            <button className="text-sm text-red-600 hover:underline">Delete</button>
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