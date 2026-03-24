import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    // Basic Info
    name: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // Don't return password by default
    },

    // Role & Access
    role: {
      type: String,
      enum: ['admin', 'staff', 'student'],
      default: 'student',
      index: true,
    },

    // Staff-Specific Fields (only for role = 'staff')
    department: {
      type: String,
      default: null,
    },
    registerNumber: {
      type: String,
      default: null,
    },
    semester: {
      type: String,
      default: null,
    },
    employeeId: {
      type: String,
      default: null,
    },
    assignedCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    slaOverride: {
      type: Number, // Custom SLA hours for this specific staff
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isSuspended: {
      type: Boolean,
      default: false,
      index: true,
    },
    suspendedReason: {
      type: String,
      default: null,
    },
    suspendedAt: {
      type: Date,
      default: null,
    },

    // Performance Metrics (auto-calculated)
    stats: {
      completedIssues: {
        type: Number,
        default: 0,
      },
      activeIssues: {
        type: Number,
        default: 0,
      },
      overdueIssues: {
        type: Number,
        default: 0,
      },
      slaCompliancePercent: {
        type: Number,
        default: 100,
      },
      averageResolutionHours: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Admin who created this staff
    },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to get safe user object (without password)
UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

export const User = mongoose.model('User', UserSchema);
