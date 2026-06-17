import mongoose, { Schema, Document } from 'mongoose';

export interface IMilestone {
  _id?: mongoose.Types.ObjectId;
  title: string;
  completed: boolean;
  dueDate: Date;
  completedAt?: Date;
}

export interface IGoal extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  targetDate: Date;
  progress: number;
  milestones: IMilestone[];
  status: 'active' | 'completed' | 'archived';
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSchema = new Schema<IMilestone>({
  title: {
    type: String,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  completedAt: Date,
});

const GoalSchema = new Schema<IGoal>({
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
  targetDate: {
    type: Date,
    required: true,
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  milestones: [MilestoneSchema],
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active',
  },
  category: {
    type: String,
    default: 'Personal',
  },
}, {
  timestamps: true,
});

// Update progress before saving
GoalSchema.pre('save', function(next) {
  if (this.milestones && this.milestones.length > 0) {
    const completedCount = this.milestones.filter(m => m.completed).length;
    this.progress = (completedCount / this.milestones.length) * 100;
    
    if (this.progress === 100 && this.status === 'active') {
      this.status = 'completed';
    }
  }
  next();
});

export const Goal = mongoose.model<IGoal>('Goal', GoalSchema);