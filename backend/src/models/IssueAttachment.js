import mongoose from 'mongoose';

const IssueAttachmentSchema = new mongoose.Schema(
  {
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      required: true,
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    uploadedByEmail: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    sizeBytes: {
      type: Number,
      required: true,
      min: 1,
    },
    storageProvider: {
      type: String,
      enum: ['local', 's3', 'azure_blob', 'gcs'],
      default: 'local',
      index: true,
    },
    storageKey: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    publicUrl: {
      type: String,
      default: null,
      trim: true,
    },
    checksum: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
  },
  { timestamps: true }
);

IssueAttachmentSchema.index({ issueId: 1, createdAt: -1 });
IssueAttachmentSchema.index({ storageKey: 1 }, { unique: true });

export const IssueAttachment = mongoose.model('IssueAttachment', IssueAttachmentSchema);
