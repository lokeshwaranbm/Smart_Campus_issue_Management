import { User } from '../models/User.js';
import { IssueSLA } from '../models/IssueSLA.js';
import { Category } from '../models/Category.js';
import mongoose from 'mongoose';

const CATEGORY_ALIAS_TO_NAME = {
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  network: 'Network',
  wifi: 'Network',
  cleanliness: 'Cleanliness',
  hostel: 'Hostel',
  maintenance: 'Maintenance',
  other: 'Other',
  laboratory: 'Other',
  classroom: 'Other',
};

const parseCategoryInput = (value) => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];

  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      const singleQuotedArray = raw.match(/'([^']+)'/g);
      if (singleQuotedArray && singleQuotedArray.length) {
        return singleQuotedArray.map((token) => token.replace(/'/g, ''));
      }
      return [raw];
    }
  }

  return [value];
};

const normalizeAssignedCategories = async (assignedCategories) => {
  // Handle empty array or null/undefined
  if (!assignedCategories || (Array.isArray(assignedCategories) && assignedCategories.length === 0)) {
    return [];
  }

  const rawValues = parseCategoryInput(assignedCategories)
    .flat()
    .map((item) => {
      if (item && typeof item === 'object') {
        return item._id || item.id || item.value || item.name || null;
      }
      return item;
    })
    .filter(Boolean);

  if (rawValues.length === 0) {
    return [];
  }

  const objectIdStrings = new Set();
  const lookupTokens = [];

  for (const item of rawValues) {
    const value = String(item).trim();
    if (!value) continue;

    if (mongoose.Types.ObjectId.isValid(value)) {
      objectIdStrings.add(value);
      continue;
    }

    lookupTokens.push(value.toLowerCase());
  }

  // If we have valid ObjectIds and no lookup tokens, return them as is
  if (lookupTokens.length === 0 && objectIdStrings.size > 0) {
    return Array.from(objectIdStrings).map((id) => new mongoose.Types.ObjectId(id));
  }

  // Lookup categories by name if needed
  if (lookupTokens.length) {
    const activeCategories = await Category.find({ isActive: true }).select('_id name').lean();
    
    // Create multiple lookup strategies
    const nameToId = new Map();
    const aliasToId = new Map();

    activeCategories.forEach((category) => {
      const nameLower = String(category.name).toLowerCase();
      nameToId.set(nameLower, String(category._id));
      
      // Also map by alias
      Object.entries(CATEGORY_ALIAS_TO_NAME).forEach(([alias, categoryName]) => {
        if (categoryName.toLowerCase() === nameLower) {
          aliasToId.set(alias, String(category._id));
        }
      });
    });

    for (const token of lookupTokens) {
      // Try direct name match first
      let categoryId = nameToId.get(token);
      
      // Try alias match
      if (!categoryId) {
        categoryId = aliasToId.get(token);
      }
      
      // Try normalized name match
      if (!categoryId) {
        const normalizedName = (CATEGORY_ALIAS_TO_NAME[token] || token).toLowerCase();
        categoryId = nameToId.get(normalizedName);
      }
      
      if (categoryId) {
        objectIdStrings.add(categoryId);
      }
    }
  }

  return Array.from(objectIdStrings).map((id) => new mongoose.Types.ObjectId(id));
};

/**
 * Calculate and update staff performance metrics
 */
export const calculateStaffPerformance = async (staffId) => {
  try {
    const staff = await User.findById(staffId);
    if (!staff) {
      throw new Error('Staff not found');
    }

    // Get all issues assigned to this staff
    const allIssues = await IssueSLA.find({ assignedTo: staffId })
      .populate('issueId', 'status');

    // Calculate metrics
    const completedIssues = allIssues.filter((issue) => issue.completedAt !== null);
    const activeIssues = allIssues.filter((issue) => issue.completedAt === null);
    const overdueIssues = allIssues.filter(
      (issue) => issue.isOverdue && issue.completedAt === null
    );

    // SLA Compliance %
    let slaCompliancePercent = 100;
    if (completedIssues.length > 0) {
      const onTimeCount = completedIssues.filter((i) => i.completedOnTime === true).length;
      slaCompliancePercent = Math.round((onTimeCount / completedIssues.length) * 100);
    }

    // Average Resolution Time (in hours)
    let averageResolutionHours = 0;
    if (completedIssues.length > 0) {
      const totalHours = completedIssues.reduce((sum, issue) => {
        const createdTime = issue.createdAt;
        const completedTime = issue.completedAt;
        const hours = (completedTime - createdTime) / (1000 * 60 * 60);
        return sum + hours;
      }, 0);
      averageResolutionHours = Math.round(totalHours / completedIssues.length);
    }

    // Update staff stats
    staff.stats = {
      completedIssues: completedIssues.length,
      activeIssues: activeIssues.length,
      overdueIssues: overdueIssues.length,
      slaCompliancePercent,
      averageResolutionHours,
      lastUpdated: new Date(),
    };

    await staff.save();
    return staff.stats;
  } catch (error) {
    console.error('Error calculating staff performance:', error);
    throw error;
  }
};

/**
 * Get all staff with populated categories and stats
 */
export const getAllStaff = async (filters = {}) => {
  try {
    const query = { role: 'staff' };

    // Apply filters
    if (filters.department) {
      query.department = filters.department;
    }
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }
    if (filters.isSuspended !== undefined) {
      query.isSuspended = filters.isSuspended;
    }

    const staff = await User.find(query)
      .populate('assignedCategories', 'name slaHours')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return staff;
  } catch (error) {
    console.error('Error fetching staff:', error);
    throw error;
  }
};

/**
 * Get single staff with detailed information
 */
export const getStaffById = async (staffId) => {
  try {
    const staff = await User.findById(staffId)
      .populate('assignedCategories', 'name slaHours')
      .populate('createdBy', 'name email');

    if (!staff) {
      throw new Error('Staff member not found');
    }

    // Recalculate metrics
    await calculateStaffPerformance(staffId);

    return staff;
  } catch (error) {
    console.error('Error fetching staff:', error);
    throw error;
  }
};

/**
 * Create new staff member
 */
export const createStaff = async (staffData, createdByAdminId) => {
  try {
    const { name, email, phone, employeeId, department, assignedCategories, slaOverride, password } =
      staffData;

    const normalizedAssignedCategories = await normalizeAssignedCategories(assignedCategories);

    // Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new Error('Email already in use');
    }

    // Generate password if not provided
    const staffPassword = password || generateRandomPassword();

    const staff = await User.create({
      name,
      email,
      phone,
      employeeId,
      department,
      assignedCategories: normalizedAssignedCategories,
      slaOverride,
      password: staffPassword,
      role: 'staff',
      isActive: true,
      ...(createdByAdminId ? { createdBy: createdByAdminId } : {}),
    });

    // Populate and return
    const populatedStaff = await staff.populate('assignedCategories', 'name slaHours');

    return {
      staff: populatedStaff,
      credentials: {
        email,
        password: staffPassword,
      },
    };
  } catch (error) {
    console.error('Error creating staff:', error);
    throw error;
  }
};

/**
 * Update staff information
 */
export const updateStaff = async (staffId, updateData) => {
  try {
    const { name, email, phone, employeeId, department, assignedCategories, slaOverride } = updateData;
    const hasAssignedCategories = assignedCategories !== undefined;
    
    console.log('updateStaff called with:', {
      staffId,
      assignedCategories,
      hasAssignedCategories,
    });

    let normalizedAssignedCategories;
    if (hasAssignedCategories) {
      normalizedAssignedCategories = await normalizeAssignedCategories(assignedCategories);
      console.log('After normalization:', {
        input: assignedCategories,
        output: normalizedAssignedCategories.map(c => c.toString()),
      });
    }

    // Check if new email is unique (if changing email)
    if (email) {
      const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: staffId } });
      if (existing) {
        throw new Error('Email already in use');
      }
    }

    const updatePayload = {
      ...(name && { name }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(employeeId !== undefined && { employeeId }),
      ...(department && { department }),
      ...(hasAssignedCategories && { assignedCategories: normalizedAssignedCategories }),
      ...(slaOverride !== undefined && { slaOverride }),
    };

    console.log('Update payload:', updatePayload);

    const staff = await User.findByIdAndUpdate(
      staffId,
      updatePayload,
      { new: true }
    ).populate('assignedCategories', 'name slaHours');

    console.log('Staff after update:', {
      id: staff._id,
      assignedCategories: staff.assignedCategories,
    });

    return staff;
  } catch (error) {
    console.error('Error updating staff:', error);
    throw error;
  }
};

/**
 * Suspend staff account (temporary disable)
 */
export const suspendStaff = async (staffId, reason = '') => {
  try {
    const staff = await User.findByIdAndUpdate(
      staffId,
      {
        isSuspended: true,
        suspendedReason: reason,
        suspendedAt: new Date(),
      },
      { new: true }
    );

    return staff;
  } catch (error) {
    console.error('Error suspending staff:', error);
    throw error;
  }
};

/**
 * Reactivate suspended staff
 */
export const reactivateStaff = async (staffId) => {
  try {
    const staff = await User.findByIdAndUpdate(
      staffId,
      {
        isSuspended: false,
        suspendedReason: null,
        suspendedAt: null,
      },
      { new: true }
    );

    return staff;
  } catch (error) {
    console.error('Error reactivating staff:', error);
    throw error;
  }
};

/**
 * Delete staff (only if no active issues)
 */
export const deleteStaff = async (staffId) => {
  try {
    // Check if staff has active issues
    const activeIssues = await IssueSLA.countDocuments({
      assignedTo: staffId,
      completedAt: null,
    });

    if (activeIssues > 0) {
      throw new Error(
        `Cannot delete staff with ${activeIssues} active issue(s). Please reassign first.`
      );
    }

    // Delete staff
    const staff = await User.findByIdAndDelete(staffId);

    return {
      success: true,
      message: `Staff member ${staff.name} deleted successfully`,
      staff,
    };
  } catch (error) {
    console.error('Error deleting staff:', error);
    throw error;
  }
};

/**
 * Assign categories to staff
 */
export const assignCategoriesToStaff = async (staffId, categoryIds) => {
  try {
    const staff = await User.findByIdAndUpdate(
      staffId,
      { assignedCategories: categoryIds },
      { new: true }
    ).populate('assignedCategories', 'name slaHours');

    return staff;
  } catch (error) {
    console.error('Error assigning categories:', error);
    throw error;
  }
};

/**
 * Get staff issues (for detailed view)
 */
export const getStaffIssues = async (staffId, filter = 'all') => {
  try {
    const query = { assignedTo: staffId };

    if (filter === 'active') {
      query.completedAt = null;
    } else if (filter === 'completed') {
      query.completedAt = { $ne: null };
    } else if (filter === 'overdue') {
      query.isOverdue = true;
      query.completedAt = null;
    }

    const issues = await IssueSLA.find(query)
      .populate('issueId', 'title status studentName category')
      .populate('categoryId', 'name slaHours')
      .sort({ slaDeadline: 1 });

    return issues;
  } catch (error) {
    console.error('Error fetching staff issues:', error);
    throw error;
  }
};

/**
 * Get staff performance report
 */
export const getStaffPerformanceReport = async () => {
  try {
    const staff = await User.find({ role: 'staff' })
      .populate('assignedCategories', 'name')
      .sort({ 'stats.slaCompliancePercent': -1 });

    // Calculate overall metrics
    const totalStaff = staff.length;
    const totalCompleted = staff.reduce((sum, s) => sum + s.stats.completedIssues, 0);
    const totalActive = staff.reduce((sum, s) => sum + s.stats.activeIssues, 0);
    const totalOverdue = staff.reduce((sum, s) => sum + s.stats.overdueIssues, 0);
    const avgCompliancePercent = Math.round(
      staff.reduce((sum, s) => sum + s.stats.slaCompliancePercent, 0) / (totalStaff || 1)
    );

    return {
      staff,
      summary: {
        totalStaff,
        totalCompleted,
        totalActive,
        totalOverdue,
        avgCompliancePercent,
      },
    };
  } catch (error) {
    console.error('Error generating performance report:', error);
    throw error;
  }
};

/**
 * Generate random password
 */
function generateRandomPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
