import mongoose from 'mongoose';

const CampusLocationSchema = new mongoose.Schema(
  {
    campus: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    zone: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    building: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    floor: {
      type: String,
      default: '',
      trim: true,
    },
    room: {
      type: String,
      default: '',
      trim: true,
    },
    label: {
      type: String,
      default: '',
      trim: true,
    },
    geo: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: undefined,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

CampusLocationSchema.index({ campus: 1, building: 1, floor: 1, room: 1 });
CampusLocationSchema.index({ geo: '2dsphere' });

export const CampusLocation = mongoose.model('CampusLocation', CampusLocationSchema);
