import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  type: 'text' | 'voice' | 'checklist';
  checklist?: {
    item: string;
    completed: boolean;
  }[];
  folder?: string;
  tags: string[];
  color?: string;
  isPinned: boolean;
  isArchived: boolean;
  reminder?: Date;
  attachments: {
    filename: string;
    url: string;
    size: number;
    type: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>({
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
  content: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: ['text', 'voice', 'checklist'],
    default: 'text',
  },
  checklist: [{
    item: String,
    completed: {
      type: Boolean,
      default: false,
    },
  }],
  folder: {
    type: String,
    default: 'General',
  },
  tags: [String],
  color: String,
  isPinned: {
    type: Boolean,
    default: false,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  reminder: Date,
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    type: String,
  }],
}, {
  timestamps: true,
});

NoteSchema.index({ userId: 1, folder: 1 });
NoteSchema.index({ userId: 1, isPinned: -1, updatedAt: -1 });

export const Note = mongoose.model<INote>('Note', NoteSchema);