export const TASK_PRIORITIES = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
} as const;

export const HABIT_FREQUENCY = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
} as const;

export const USER_ROLES = {
  USER: 'user',
  PREMIUM: 'premium',
  ADMIN: 'admin',
} as const;

export const REMINDER_TIMES = [
  { label: '5 minutes before', minutes: 5 },
  { label: '15 minutes before', minutes: 15 },
  { label: '30 minutes before', minutes: 30 },
  { label: '1 hour before', minutes: 60 },
  { label: '2 hours before', minutes: 120 },
  { label: '1 day before', minutes: 1440 },
];

export const CATEGORIES = [
  'Work',
  'Study',
  'Personal',
  'Health',
  'Finance',
  'Shopping',
  'Family',
  'Social',
  'Other',
];

export const BADGES = {
  '7_DAY_STREAK': '7 Day Streak',
  '30_DAY_STREAK': '30 Day Streak',
  '100_TASKS': '100 Tasks Completed',
  '500_TASKS': '500 Tasks Completed',
  'PRODUCTIVITY_MASTER': 'Productivity Master',
  'EARLY_BIRD': 'Early Bird',
  'NIGHT_OWL': 'Night Owl',
};

export const XP_REWARDS = {
  TASK_COMPLETED: 10,
  HABIT_COMPLETED: 10,
  DAILY_LOGIN: 5,
  STREAK_BONUS: 50,
  GOAL_COMPLETED: 100,
};

export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  1000,   // Level 5
  2000,   // Level 6
  3500,   // Level 7
  5000,   // Level 8
  7500,   // Level 9
  10000,  // Level 10
];