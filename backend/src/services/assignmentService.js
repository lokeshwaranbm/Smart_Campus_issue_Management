/**
 * Auto-assignment logic for issues based on category
 * Handles round-robin load balancing and staff availability
 */

import { Category } from '../models/Category.js';
import { IssueSLA } from '../models/IssueSLA.js';

/**
 * Get staff member with least assignments for category (round-robin)
 */
export const getAvailableStaffForCategory = async (categoryId) => {
  try {
    const category = await Category.findById(categoryId)
      .populate('assignedStaff');

    if (!category || !Array.isArray(category.assignedStaff) || category.assignedStaff.length === 0) {
      console.warn(`No staff assigned to category ${categoryId}`);
      return null;
    }

    // Count active assignments for each staff member
    const staffLoadMap = {};

    for (const staff of category.assignedStaff) {
      const activeAssignments = await IssueSLA.countDocuments({
        assignedTo: staff._id,
        completedAt: null,
      });

      staffLoadMap[staff._id] = {
        staff,
        load: activeAssignments,
      };
    }

    // Return staff with minimum load (least burdened)
    const leastBurdened = Object.values(staffLoadMap).reduce((prev, current) =>
      prev.load < current.load ? prev : current
    );

    console.log(`Assigning issue to ${leastBurdened.staff.name} (load: ${leastBurdened.load})`);
    return leastBurdened.staff;
  } catch (error) {
    console.error('Error getting available staff:', error);
    return null;
  }
};

/**
 * Fallback assignment: assign to first available staff
 */
export const getFallbackStaff = async (categoryId) => {
  const category = await Category.findById(categoryId)
    .populate('assignedStaff', 'name email role');

  if (!category || category.assignedStaff.length === 0) {
    return null;
  }

  return category.assignedStaff[0];
};
