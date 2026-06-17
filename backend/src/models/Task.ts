import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  dueDate: Date;
  dueTime?: string;
  reminder: {
    enabled: boolean;
    times: Date[];
  };
  recurring: {
    enabled: boolean;
    pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
    interval: number;
    endDate?: Date;
  };
  subtasks: {
    title: string;
    completed: boolean;
  }[];
  attachments: {
    filename: string;
    url: string;
    size: number;
    type: string;
  }[];
  location?: string;
  tags: string[];
  estimatedTime: number;
  actualTime?: number;
  completedAt?: Date;
  order: number;
  isArchived?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },
  category: {
    type: String,
    default: 'Personal',
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'overdue'],
    default: 'pending',
  },
  dueDate: {
    type: Date,
    required: true,
  },
  dueTime: String,
  reminder: {
    enabled: {
      type: Boolean,
      default: false,
    },
    times: [Date],
  },
  recurring: {
    enabled: {
      type: Boolean,
      default: false,
    },
    pattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom'],
    },
    interval: {
      type: Number,
      default: 1,
    },
    endDate: Date,
  },
  subtasks: [{
    title: String,
    completed: {
      type: Boolean,
      default: false,
    },
  }],
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    type: String,
  }],
  location: String,
  tags: [String],
  estimatedTime: {
    type: Number,
    default: 0,
  },
  actualTime: Number,
  completedAt: Date,
  order: {
    type: Number,
    default: 0,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
TaskSchema.index({ userId: 1, dueDate: 1 });
TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, priority: 1 });
TaskSchema.index({ userId: 1, createdAt: -1 });
TaskSchema.index({ userId: 1, isArchived: 1 });

// Pre-save middleware to check for overdue tasks
TaskSchema.pre('save', function(next) {
  if (this.status !== 'completed' && this.status !== 'overdue') {
    if (this.dueDate && new Date(this.dueDate) < new Date()) {
      this.status = 'overdue';
    }
  }
  next();
});

export const Task = mongoose.model<ITask>('Task', TaskSchema);