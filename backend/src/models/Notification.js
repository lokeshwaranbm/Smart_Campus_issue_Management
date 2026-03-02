import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['assignment', 'warning', 'escalation', 'completion', 'comment', 'support'],
      default: 'assignment',
      index: true,
    },
    escalationLevel: {
      type: Number,
      enum: [0, 1, 2],
      default: 0,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    actionUrl: {
      type: String,
      default: null,
    },
    metadata: {
      categoryName: String,
      issueTitle: String,
      staffName: String,
      priorityLevel: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Automatically delete notifications after 30 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export const Notification = mongoose.model('Notification', NotificationSchema);
