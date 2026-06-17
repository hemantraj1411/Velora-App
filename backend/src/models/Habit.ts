import mongoose, { Schema, Document } from 'mongoose';

export interface IHabit extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  targetDays: number[];
  reminderTime?: string;
  streak: number;
  longestStreak: number;
  totalCompletions: number;
  completions: {
    date: Date;
    completed: boolean;
    note?: string;
  }[];
  color: string;
  icon: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HabitSchema = new Schema<IHabit>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily',
  },
  targetDays: [{
    type: Number,
    min: 0,
    max: 6,
  }],
  reminderTime: String,
  streak: {
    type: Number,
    default: 0,
  },
  longestStreak: {
    type: Number,
    default: 0,
  },
  totalCompletions: {
    type: Number,
    default: 0,
  },
  completions: [{
    date: {
      type: Date,
      default: Date.now,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    note: String,
  }],
  color: {
    type: String,
    default: '#8b5cf6',
  },
  icon: {
    type: String,
    default: '⭐',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes
HabitSchema.index({ userId: 1, isActive: 1 });
HabitSchema.index({ userId: 1, name: 1 });

// Method to check if habit is completed today
HabitSchema.methods.isCompletedToday = function(): boolean {
  const today = new Date().toDateString();
  return this.completions.some((c: any) => 
    new Date(c.date).toDateString() === today && c.completed
  );
};

// Method to toggle completion for today
HabitSchema.methods.toggleToday = async function(note?: string): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const existingCompletion = this.completions.find((c: any) => 
    new Date(c.date).toDateString() === today.toDateString()
  );
  
  if (existingCompletion) {
    existingCompletion.completed = !existingCompletion.completed;
    if (note) existingCompletion.note = note;
  } else {
    this.completions.push({
      date: today,
      completed: true,
      note: note || '',
    });
  }
  
  // Update streak
  if (this.isCompletedToday()) {
    this.streak++;
    if (this.streak > this.longestStreak) {
      this.longestStreak = this.streak;
    }
    this.totalCompletions++;
  } else {
    this.streak = 0;
  }
  
  await this.save();
};

export const Habit = mongoose.model<IHabit>('Habit', HabitSchema);