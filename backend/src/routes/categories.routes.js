import { Router } from 'express';
import { Category } from '../models/Category.js';
import { IssueSLA } from '../models/IssueSLA.js';
import { Notification } from '../models/Notification.js';
import { reassignIssue } from '../services/slaService.js';
import mongoose from 'mongoose';

export const categoryRouter = Router();

// ============ CATEGORY MANAGEMENT ============

/**
 * GET /api/categories
 * Get all active categories with their assigned staff
 */
categoryRouter.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate('assignedStaff', 'id name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      ok: true,
      data: categories,
      count: categories.length,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch categories',
      error: error.message,
    });
  }
});

/**
 * POST /api/categories
 * Create new issue category (Admin only)
 */
categoryRouter.post('/categories', async (req, res) => {
  try {
    const { name, description, assignedStaff, slaHours } = req.body;

    // Validate required fields
    if (!name || !slaHours) {
      return res.status(400).json({
        ok: false,
        message: 'Name and SLA hours are required',
      });
    }

    // Check if category already exists
    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(400).json({
        ok: false,
        message: `Category "${name}" already exists`,
      });
    }

    const category = await Category.create({
      name,
      description,
      assignedStaff: assignedStaff || [],
      slaHours,
      createdBy: req.user?.id || new mongoose.Types.ObjectId(), // Fallback for local/dev without auth
    });

    const populatedCategory = await category.populate('assignedStaff', 'id name email role');

    res.status(201).json({
      ok: true,
      message: `Category "${name}" created successfully`,
      data: populatedCategory,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to create category',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/categories/:id
 * Update category details and staff assignments
 */
categoryRouter.patch('/categories/:id', async (req, res) => {
  try {
    const { name, description, assignedStaff, slaHours, isActive } = req.body;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(assignedStaff && { assignedStaff }),
        ...(slaHours && { slaHours }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      },
      { new: true }
    ).populate('assignedStaff', 'id name email role');

    if (!category) {
      return res.status(404).json({
        ok: false,
        message: 'Category not found',
      });
    }

    res.status(200).json({
      ok: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to update category',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/categories/:id
 * Soft delete category (mark as inactive)
 */
categoryRouter.delete('/categories/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({
        ok: false,
        message: 'Category not found',
      });
    }

    res.status(200).json({
      ok: true,
      message: `Category "${category.name}" deactivated`,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to delete category',
      error: error.message,
    });
  }
});

// ============ SLA & OVERDUE MANAGEMENT ============

/**
 * GET /api/admin/overdue-issues
 * Get all overdue issues with SLA details (Admin view)
 */
categoryRouter.get('/admin/overdue-issues', async (req, res) => {
  try {
    const now = new Date();

    const overdueIssues = await IssueSLA.find({
      slaDeadline: { $lt: now },
      completedAt: null,
    })
      .populate('issueId', 'id title status studentName studentEmail imageUrl')
      .populate('assignedTo', 'id name email')
      .populate('categoryId', 'name slaHours')
      .sort({ slaDeadline: 1 });

    // Calculate additional metadata
    const enrichedIssues = overdueIssues.map((sla) => ({
      ...sla.toObject(),
      overdueHours: Math.round((now - sla.slaDeadline) / (1000 * 60 * 60)),
      statusBadge: sla.escalationLevel === 2 ? 'CRITICAL' : 'OVERDUE',
    }));

    res.status(200).json({
      ok: true,
      data: enrichedIssues,
      count: enrichedIssues.length,
      severity: {
        critical: enrichedIssues.filter((i) => i.escalationLevel === 2).length,
        overdue: enrichedIssues.filter((i) => i.escalationLevel === 1).length,
      },
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch overdue issues',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/sla-stats
 * Get SLA performance statistics
 */
categoryRouter.get('/admin/sla-stats', async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalIssues, completedOnTime, completedLate, pendingIssues, criticalIssues] =
      await Promise.all([
        IssueSLA.countDocuments({
          createdAt: { $gte: thirtyDaysAgo },
        }),
        IssueSLA.countDocuments({
          completedOnTime: true,
          completedAt: { $gte: thirtyDaysAgo },
        }),
        IssueSLA.countDocuments({
          completedOnTime: false,
          completedAt: { $gte: thirtyDaysAgo },
        }),
        IssueSLA.countDocuments({
          completedAt: null,
        }),
        IssueSLA.countDocuments({
          escalationLevel: 2,
          completedAt: null,
        }),
      ]);

    const onTimePercentage =
      totalIssues > 0 ? Math.round((completedOnTime / totalIssues) * 100) : 0;

    res.status(200).json({
      ok: true,
      data: {
        totalIssues,
        completedOnTime,
        completedLate,
        pendingIssues,
        criticalIssues,
        onTimePercentage,
        period: '30 days',
      },
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch SLA statistics',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/issues/:issueId/reassign
 * Reassign issue to different staff member
 */
categoryRouter.patch('/issues/:issueId/reassign', async (req, res) => {
  try {
    const { newStaffId, reason } = req.body;

    if (!newStaffId) {
      return res.status(400).json({
        ok: false,
        message: 'New staff ID is required',
      });
    }

    const sla = await reassignIssue(req.params.issueId, newStaffId, reason);

    res.status(200).json({
      ok: true,
      message: 'Issue reassigned successfully',
      data: sla,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to reassign issue',
      error: error.message,
    });
  }
});

// ============ NOTIFICATIONS ============

/**
 * GET /api/notifications
 * Get notifications for current user
 */
categoryRouter.get('/notifications', async (req, res) => {
  try {
    const userId = req.user?.id; // Assumes auth middleware

    if (!userId) {
      return res.status(401).json({
        ok: false,
        message: 'User not authenticated',
      });
    }

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    res.status(200).json({
      ok: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch notifications',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
categoryRouter.patch('/notifications/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        ok: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      ok: true,
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to mark notification as read',
      error: error.message,
    });
  }
});

/**
 * GET /api/notifications/unread-count
 * Get unread notification count for current user
 */
categoryRouter.get('/notifications/unread-count', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        message: 'User not authenticated',
      });
    }

    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    res.status(200).json({
      ok: true,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to get unread count',
      error: error.message,
    });
  }
});
