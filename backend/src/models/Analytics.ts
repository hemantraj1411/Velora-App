import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalytics extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  tasksCompleted: number;
  tasksCreated: number;
  habitsCompleted: number;
  focusTime: number;
  xpEarned: number;
  productivityScore: number;
  metrics: {
    completionRate: number;
    averagePriority: number;
    categoryBreakdown: Map<string, number>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AnalyticsSchema = new Schema<IAnalytics>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  tasksCompleted: {
    type: Number,
    default: 0,
  },
  tasksCreated: {
    type: Number,
    default: 0,
  },
  habitsCompleted: {
    type: Number,
    default: 0,
  },
  focusTime: {
    type: Number,
    default: 0,
  },
  xpEarned: {
    type: Number,
    default: 0,
  },
  productivityScore: {
    type: Number,
    default: 0,
  },
  metrics: {
    completionRate: {
      type: Number,
      default: 0,
    },
    averagePriority: {
      type: Number,
      default: 0,
    },
    categoryBreakdown: {
      type: Map,
      of: Number,
      default: {},
    },
  },
}, {
  timestamps: true,
});

// Create compound index for efficient queries
AnalyticsSchema.index({ userId: 1, date: -1 });

export const Analytics = mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);