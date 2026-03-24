import mongoose from 'mongoose';

const SLAPolicySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
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
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
      index: true,
    },
    firstResponseMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    resolutionMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    businessHoursOnly: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

SLAPolicySchema.index({ categoryId: 1, priority: 1, isActive: 1 });
SLAPolicySchema.index({ departmentId: 1, priority: 1, isActive: 1 });

export const SLAPolicy = mongoose.model('SLAPolicy', SLAPolicySchema);
