import mongoose from 'mongoose';

const IssueUpdateSchema = new mongoose.Schema(
  {
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: [
        'created',
        'status_changed',
        'assigned',
        'reassigned',
        'comment_added',
        'attachment_added',
        'sla_warning',
        'sla_breached',
        'resolved',
        'closed',
        'reopened',
      ],
      required: true,
      index: true,
    },
    previousValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    changedByEmail: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
      index: true,
    },
  },
  { timestamps: true }
);

IssueUpdateSchema.index({ issueId: 1, createdAt: -1 });
IssueUpdateSchema.index({ eventType: 1, createdAt: -1 });

export const IssueUpdate = mongoose.model('IssueUpdate', IssueUpdateSchema);
