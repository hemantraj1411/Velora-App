import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  role: 'user' | 'premium' | 'admin';
  googleId?: string;
  emailVerified: boolean;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    emailReminders: boolean;
    defaultView: 'tasks' | 'calendar' | 'analytics';
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
  lastLoginAt: Date;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false, // Don't return password by default
  },
  avatar: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'premium', 'admin'],
    default: 'user',
  },
  googleId: {
    type: String,
    sparse: true,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light',
    },
    notifications: {
      type: Boolean,
      default: true,
    },
    emailReminders: {
      type: Boolean,
      default: true,
    },
    defaultView: {
      type: String,
      enum: ['tasks', 'calendar', 'analytics'],
      default: 'tasks',
    },
    language: {
      type: String,
      default: 'en',
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
  },
  stats: {
    totalTasks: {
      type: Number,
      default: 0,
    },
    completedTasks: {
      type: Number,
      default: 0,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    totalFocusTime: {
      type: Number,
      default: 0,
    },
    xp: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
  },
  badges: [{
    type: String,
  }],
  lastLoginAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: {
    type: String,
    sparse: true,
  },
  resetPasswordExpiry: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);