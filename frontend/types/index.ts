// types/index.ts

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'premium' | 'admin';
  avatar?: string;
  lastLoginAt?: string;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    emailReminders: boolean;
    defaultView: string;
    language: string;
    timezone: string;
  };
  stats: {
    totalTasks: number;
    completedTasks: number;
    currentStreak: number;
    longestStreak: number;
    totalFocusTime: number;
    xp: number;
    level: number;
  };
  badges: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  dueDate: string;
  dueTime?: string;
  subtasks: { title: string; completed: boolean }[];
  attachments: { filename: string; url: string; size: number; type: string }[];
  tags: string[];
  estimatedTime: number;
  actualTime?: number;
  completedAt?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  _id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  targetDays: number[];
  reminderTime?: string;
  streak: number;
  longestStreak: number;
  totalCompletions: number;
  completions: { date: string; completed: boolean; note?: string }[];
  color: string;
  icon: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  _id: string;
  title: string;
  description: string;
  targetDate: string;
  progress: number;
  milestones: { 
    _id?: string;
    title: string; 
    completed: boolean; 
    dueDate: string;
    completedAt?: string;
  }[];
  status: 'active' | 'completed' | 'archived';
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  _id: string;
  title: string;
  content: string;
  type: 'text' | 'voice' | 'checklist';
  checklist?: { item: string; completed: boolean }[];
  folder?: string;
  tags: string[];
  color?: string;
  isPinned: boolean;
  isArchived: boolean;
  reminder?: string;
  attachments: { filename: string; url: string; size: number; type: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface Analytics {
  _id: string;
  date: string;
  tasksCompleted: number;
  tasksCreated: number;
  habitsCompleted: number;
  focusTime: number;
  xpEarned: number;
  productivityScore: number;
  metrics: {
    completionRate: number;
    averagePriority: number;
    categoryBreakdown: Record<string, number>;
  };
}

export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  tasks: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Auth related types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

// Task filter types
export interface TaskFilters {
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

// Chart data types
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

// WebSocket event types
export interface WebSocketEvents {
  'task:created': Task;
  'task:updated': Task;
  'task:deleted': string;
  'habit:tracked': Habit;
  'notification:new': Notification;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}