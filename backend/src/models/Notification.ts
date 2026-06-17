import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'task' | 'reminder' | 'achievement' | 'system';
  read: boolean;
  taskId?: mongoose.Types.ObjectId;
  scheduledFor?: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['task', 'reminder', 'achievement', 'system'],
    default: 'task',
  },
  read: {
    type: Boolean,
    default: false,
  },
  taskId: {
    type: Schema.Types.ObjectId,
    ref: 'Task',
  },
  scheduledFor: Date,
  sentAt: Date,
}, {
  timestamps: true,
});

NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);