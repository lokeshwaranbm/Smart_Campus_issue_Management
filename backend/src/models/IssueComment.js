import mongoose from 'mongoose';

const IssueCommentSchema = new mongoose.Schema(
  {
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      required: true,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    authorEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    authorName: {
      type: String,
      default: '',
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    visibility: {
      type: String,
      enum: ['public', 'internal'],
      default: 'public',
      index: true,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

IssueCommentSchema.index({ issueId: 1, createdAt: -1 });
IssueCommentSchema.index({ authorEmail: 1, createdAt: -1 });

export const IssueComment = mongoose.model('IssueComment', IssueCommentSchema);
