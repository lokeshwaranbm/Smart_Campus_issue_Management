import mongoose from 'mongoose';

const RemarkSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    authorEmail: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CommentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  userEmail: { type: String, required: true },
  userName: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

const IssueSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true }, // backward-compatible display ID
    issueCode: { type: String, unique: true, sparse: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true,
    },
    location: { type: String, default: '' },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CampusLocation',
      default: null,
      index: true,
    },
    blockNumber: { type: String, default: '' },
    floorNumber: { type: String, default: '' },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    imageUrl: { type: String, default: null },
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'IssueAttachment' }],
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: [
        'submitted',
        'assigned',
        'contractor_assigned',
        'in_progress',
        'resolved',
        'closed',
        'open',
        'acknowledged',
        'on_hold',
        'rejected',
      ],
      default: 'submitted',
      index: true,
    },
    source: {
      type: String,
      enum: ['mobile', 'web', 'kiosk', 'api'],
      default: 'web',
      index: true,
    },
    isAnonymous: { type: Boolean, default: false },
    studentEmail: { type: String, required: true, index: true },
    studentName: { type: String, default: '' },
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    assignedTo: { type: String, default: null },       // staff email
    assignedToName: { type: String, default: null },
    assignedToId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    assignedDepartment: { type: String, default: null, index: true },
    assignedAt: { type: Date, default: null },
    assignedToType: {
      type: String,
      enum: ['staff', 'contractor'],
      default: 'staff',
      index: true,
    },
    assignedBy: { type: String, default: null, index: true },
    autoAssigned: { type: Boolean, default: false },
    internalAssignedTo: { type: String, default: null },
    internalAssignedToName: { type: String, default: null },
    internalAssignedToId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    internalAssignedDepartment: { type: String, default: null },
    contractorEmail: { type: String, default: null, index: true },
    contractorName: { type: String, default: null },
    contractorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    contractorStatus: {
      type: String,
      enum: ['none', 'pending', 'accepted', 'rejected'],
      default: 'none',
      index: true,
    },
    contractorAssignedAt: { type: Date, default: null },
    contractorRespondedAt: { type: Date, default: null },
    contractorCompanyName: { type: String, default: '' },
    contractorPhone: { type: String, default: '' },
    contractorEstimatedCost: { type: Number, default: null },
    contractorExpectedCompletionDate: { type: Date, default: null },
    contractorRemarks: { type: String, default: '' },
    lastUpdatedBy: { type: String, default: null },
    dueAt: { type: Date, default: null, index: true },
    firstResponseAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    reopenCount: { type: Number, default: 0 },
    tags: [{ type: String, trim: true }],
    supports: { type: Number, default: 0 },
    supportedBy: [{ type: String }],
    attachmentCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    remarks: [RemarkSchema],
    comments: [CommentSchema],
  },
  { timestamps: true }
);

IssueSchema.pre('validate', function syncIssueIdentifiers(next) {
  if (!this.issueCode && this.id) {
    this.issueCode = this.id;
  }

  if (!this.id && this.issueCode) {
    this.id = this.issueCode;
  }

  if (this.status === 'resolved' && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }

  if (this.status === 'closed' && !this.closedAt) {
    this.closedAt = new Date();
  }

  next();
});

IssueSchema.index({ status: 1, priority: 1, createdAt: -1 });
IssueSchema.index({ reporterId: 1, createdAt: -1 });
IssueSchema.index({ assignedToId: 1, status: 1, updatedAt: -1 });
IssueSchema.index({ departmentId: 1, status: 1, createdAt: -1 });
IssueSchema.index({ locationId: 1, createdAt: -1 });
IssueSchema.index({ dueAt: 1, status: 1 });
IssueSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const Issue = mongoose.model('Issue', IssueSchema);
