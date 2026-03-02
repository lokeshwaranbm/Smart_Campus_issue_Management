import { Category } from '../models/Category.js';
import { IssueSLA } from '../models/IssueSLA.js';
import { Notification } from '../models/Notification.js';

/**
 * Get default assigned staff for a category
 * Implements round-robin assignment for load balancing
 */
export const getAssignedStaffForCategory = async (categoryId) => {
  try {
    const category = await Category.findById(categoryId)
      .populate('assignedStaff', 'name email role');

    if (!category || category.assignedStaff.length === 0) {
      return null;
    }

    // Option 1: Simple rotation - get least burdened staff
    // For now, return first staff member
    // TODO: Implement load-based assignment
    return category.assignedStaff[0];
  } catch (error) {
    console.error('Error getting assigned staff:', error);
    return null;
  }
};

/**
 * Create SLA record when issue is assigned
 */
export const createIssueSLA = async (issueId, categoryId, assignedStaffId) => {
  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    const slaDeadline = new Date();
    slaDeadline.setHours(slaDeadline.getHours() + category.slaHours);

    const sla = await IssueSLA.create({
      issueId,
      categoryId,
      assignedTo: assignedStaffId,
      slaDeadline,
      escalationLevel: 0,
      isOverdue: false,
    });

    return sla;
  } catch (error) {
    console.error('Error creating SLA:', error);
    throw error;
  }
};

/**
 * Create notification for user
 */
export const createNotification = async (userId, message, type, metadata = {}) => {
  try {
    const notification = await Notification.create({
      userId,
      message,
      type,
      metadata,
      isRead: false,
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Check and update overdue issues with escalation
 */
export const checkAndEscalateOverdueIssues = async () => {
  try {
    const now = new Date();

    // Find issues that are overdue (deadline passed but not completed)
    const overdueIssues = await IssueSLA.find({
      slaDeadline: { $lt: now },
      isOverdue: false,
      completedAt: null,
    })
      .populate('assignedTo', 'email name')
      .populate('issueId', 'title studentEmail studentName');

    console.log(`Found ${overdueIssues.length} overdue issues to escalate`);

    for (const sla of overdueIssues) {
      const overdueHours = Math.round((now - sla.slaDeadline) / (1000 * 60 * 60));

      // Level 1: Mark as overdue and send warning (first time)
      if (sla.escalationLevel === 0) {
        sla.escalationLevel = 1;
        sla.isOverdue = true;
        sla.warningSent = true;
        sla.overdueHours = overdueHours;
        sla.lastEscalationAt = now;

        await sla.save();

        // Notify assigned staff
        if (sla.assignedTo) {
          await createNotification(
            sla.assignedTo._id,
            `⚠️ Issue "${sla.issueId.title}" is now OVERDUE by ${overdueHours} hours!`,
            'warning',
            {
              issueTitle: sla.issueId.title,
              escalationLevel: 1,
              overdueHours,
            }
          );
        }

        console.log(`[Level 1] Issue ${sla.issueId._id} marked overdue. Notified staff.`);
      }

      // Level 2: Extended escalation (overdue by 24+ hours)
      if (sla.escalationLevel === 1 && overdueHours >= 24 && !sla.warningSent) {
        sla.escalationLevel = 2;
        sla.escalationWarningsSent += 1;
        sla.lastEscalationAt = now;

        await sla.save();

        // Notify admin
        const adminUsers = await mongoose.model('User').find({ role: 'admin' });
        for (const admin of adminUsers) {
          await createNotification(
            admin._id,
            `🚨 CRITICAL: Issue "${sla.issueId.title}" is now ${overdueHours}+ hours overdue!`,
            'escalation',
            {
              issueTitle: sla.issueId.title,
              escalationLevel: 2,
              overdueHours,
              staffName: sla.assignedTo?.name,
            }
          );
        }

        console.log(`[Level 2] Issue ${sla.issueId._id} elevated to critical. Notified admins.`);
      }
    }

    return overdueIssues.length;
  } catch (error) {
    console.error('Error checking overdue issues:', error);
    throw error;
  }
};

/**
 * Mark issue as completed and check if on-time
 */
export const completeIssueSLA = async (issueId) => {
  try {
    const sla = await IssueSLA.findOne({ issueId })
      .populate('assignedTo', 'email name');

    if (!sla) {
      throw new Error('SLA record not found');
    }

    const completedAt = new Date();
    const completedOnTime = completedAt <= sla.slaDeadline;

    sla.completedAt = completedAt;
    sla.completedOnTime = completedOnTime;

    if (!completedOnTime) {
      sla.overdueHours = Math.round((completedAt - sla.slaDeadline) / (1000 * 60 * 60));
    }

    await sla.save();

    // Notify assigned staff of completion
    if (sla.assignedTo) {
      const statusEmoji = completedOnTime ? '✅' : '⏱️';
      const statusMsg = completedOnTime ? 'completed ON TIME' : 'completed LATE';

      await createNotification(
        sla.assignedTo._id,
        `${statusEmoji} Issue "${sla.issueId?.title || 'Unknown'}" ${statusMsg}`,
        'completion',
        {
          completedOnTime,
          overdueHours: sla.overdueHours,
        }
      );
    }

    return sla;
  } catch (error) {
    console.error('Error completing SLA:', error);
    throw error;
  }
};

/**
 * Reassign issue to different staff member
 */
export const reassignIssue = async (issueId, newStaffId, reason = '') => {
  try {
    const sla = await IssueSLA.findOne({ issueId })
      .populate('issueId', 'title');

    if (!sla) {
      throw new Error('SLA record not found');
    }

    const oldStaffId = sla.assignedTo;
    sla.assignedTo = newStaffId;
    sla.escalationLevel = 0; // Reset escalation
    sla.isOverdue = false;
    sla.warningSent = false;

    await sla.save();

    // Notify new staff
    await createNotification(
      newStaffId,
      `📋 Issue "${sla.issueId.title}" has been reassigned to you. Reason: ${reason}`,
      'assignment',
      {
        issueTitle: sla.issueId.title,
        reassignmentReason: reason,
      }
    );

    console.log(`Issue ${issueId} reassigned from ${oldStaffId} to ${newStaffId}`);
    return sla;
  } catch (error) {
    console.error('Error reassigning issue:', error);
    throw error;
  }
};
