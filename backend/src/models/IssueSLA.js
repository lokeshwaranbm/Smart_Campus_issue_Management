import mongoose from 'mongoose';

const IssueSLASchema = new mongoose.Schema(
  {
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      required: true,
      unique: true,
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    slaDeadline: {
      type: Date,
      required: true,
      index: true,
    },
    escalationLevel: {
      type: Number,
      enum: [0, 1, 2],
      default: 0,
      index: true,
    },
    isOverdue: {
      type: Boolean,
      default: false,
      index: true,
    },
    warningSent: {
      type: Boolean,
      default: false,
    },
    escalationWarningsSent: {
      type: Number,
      default: 0,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completedOnTime: {
      type: Boolean,
      default: null,
    },
    overdueHours: {
      type: Number,
      default: 0,
    },
    lastEscalationAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const IssueSLA = mongoose.model('IssueSLA', IssueSLASchema);
