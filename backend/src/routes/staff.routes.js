import { Router } from 'express';
import {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  suspendStaff,
  reactivateStaff,
  deleteStaff,
  assignCategoriesToStaff,
  getStaffIssues,
  getStaffPerformanceReport,
  calculateStaffPerformance,
} from '../services/staffService.js';
import { User } from '../models/User.js';

export const staffRouter = Router();

// ============ STAFF MANAGEMENT ============

/**
 * GET /api/admin/staff
 * Get all staff with filters
 */
staffRouter.get('/admin/staff', async (req, res) => {
  try {
    const { department, status } = req.query;

    const filters = {};
    if (department) filters.department = department;
    if (status === 'active') filters.isActive = true;
    if (status === 'suspended') filters.isSuspended = true;

    const staff = await getAllStaff(filters);

    res.status(200).json({
      ok: true,
      data: staff,
      count: staff.length,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch staff',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/staff/:id
 * Get specific staff details
 */
staffRouter.get('/admin/staff/:id', async (req, res) => {
  try {
    const staff = await getStaffById(req.params.id);

    res.status(200).json({
      ok: true,
      data: staff,
    });
  } catch (error) {
    res.status(404).json({
      ok: false,
      message: error.message,
    });
  }
});

/**
 * POST /api/admin/staff
 * Create new staff member
 */
staffRouter.post('/admin/staff', async (req, res) => {
  try {
    const { name, email, phone, employeeId, department, assignedCategories, slaOverride, password } =
      req.body;

    if (!name || !email || !department) {
      return res.status(400).json({
        ok: false,
        message: 'Name, email, and department are required',
      });
    }

    const adminId = req.user?.id || null; // Assumes auth middleware sets req.user

    const result = await createStaff(
      {
        name,
        email,
        phone: phone || null,
        employeeId: employeeId || null,
        department,
        assignedCategories: assignedCategories || [],
        slaOverride,
        password,
      },
      adminId
    );

    res.status(201).json({
      ok: true,
      message: `Staff member ${name} created successfully`,
      data: result.staff,
      credentials: result.credentials,
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
});

/**
 * PATCH /api/admin/staff/:id
 * Update staff information
 */
staffRouter.patch('/admin/staff/:id', async (req, res) => {
  try {
    const { name, email, phone, employeeId, department, assignedCategories, slaOverride } = req.body;

    const staff = await updateStaff(req.params.id, {
      name,
      email,
      phone,
      employeeId,
      department,
      assignedCategories,
      slaOverride,
    });

    res.status(200).json({
      ok: true,
      message: 'Staff updated successfully',
      data: staff,
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
});

/**
 * DELETE /api/admin/staff/:id
 * Delete staff (only if no active issues)
 */
staffRouter.delete('/admin/staff/:id', async (req, res) => {
  try {
    const result = await deleteStaff(req.params.id);

    res.status(200).json({
      ok: true,
      message: result.message,
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
});

/**
 * PATCH /api/admin/staff/:id/suspend
 * Suspend staff account
 */
staffRouter.patch('/admin/staff/:id/suspend', async (req, res) => {
  try {
    const { reason } = req.body;

    const staff = await suspendStaff(req.params.id, reason);

    res.status(200).json({
      ok: true,
      message: `Staff member ${staff.name} suspended`,
      data: staff,
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
});

/**
 * PATCH /api/admin/staff/:id/reactivate
 * Reactivate suspended staff
 */
staffRouter.patch('/admin/staff/:id/reactivate', async (req, res) => {
  try {
    const staff = await reactivateStaff(req.params.id);

    res.status(200).json({
      ok: true,
      message: `Staff member ${staff.name} reactivated`,
      data: staff,
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
});

/**
 * PATCH /api/admin/staff/:id/assign-categories
 * Assign categories to staff
 */
staffRouter.patch('/admin/staff/:id/assign-categories', async (req, res) => {
  try {
    const { categoryIds } = req.body;

    if (!Array.isArray(categoryIds)) {
      return res.status(400).json({
        ok: false,
        message: 'categoryIds must be an array',
      });
    }

    const staff = await assignCategoriesToStaff(req.params.id, categoryIds);

    res.status(200).json({
      ok: true,
      message: 'Categories assigned successfully',
      data: staff,
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
});

// ============ STAFF ISSUES ============

/**
 * GET /api/admin/staff/:id/issues
 * Get staff's issues with optional filter
 */
staffRouter.get('/admin/staff/:id/issues', async (req, res) => {
  try {
    const { filter } = req.query; // all, active, completed, overdue

    const issues = await getStaffIssues(req.params.id, filter || 'all');

    res.status(200).json({
      ok: true,
      data: issues,
      count: issues.length,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch staff issues',
      error: error.message,
    });
  }
});

// ============ PERFORMANCE ANALYTICS ============

/**
 * GET /api/admin/staff-performance
 * Get overall staff performance report
 */
staffRouter.get('/admin/staff-performance', async (req, res) => {
  try {
    const report = await getStaffPerformanceReport();

    res.status(200).json({
      ok: true,
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to generate performance report',
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/staff/:id/recalculate-performance
 * Manually recalculate staff performance metrics
 */
staffRouter.post('/admin/staff/:id/recalculate-performance', async (req, res) => {
  try {
    const stats = await calculateStaffPerformance(req.params.id);

    res.status(200).json({
      ok: true,
      message: 'Performance metrics recalculated',
      data: stats,
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/departments
 * Get available departments
 */
staffRouter.get('/admin/departments', (req, res) => {
  const departments = ['Maintenance', 'Electrical', 'Plumbing', 'Network', 'Facilities'];

  res.status(200).json({
    ok: true,
    data: departments,
  });
});

// ============ REPORTER (STUDENT) MANAGEMENT ============

/**
 * GET /api/admin/reporters
 * Get all student/reporter accounts
 */
staffRouter.get('/admin/reporters', async (req, res) => {
  try {
    const reporters = await User.find({ role: 'student' })
      .select('-password -__v')
      .sort({ createdAt: -1 });

    res.status(200).json({
      ok: true,
      data: reporters,
      count: reporters.length,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch reporters',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/admin/reporters/:id/status
 * Enable or disable a reporter's login access
 */
staffRouter.patch('/admin/reporters/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ ok: false, message: "status must be 'active' or 'inactive'" });
    }

    const reporter = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'student' },
      { isActive: status === 'active', updatedAt: new Date() },
      { new: true, select: '-password -__v' }
    );

    if (!reporter) {
      return res.status(404).json({ ok: false, message: 'Reporter account not found.' });
    }

    res.status(200).json({ ok: true, data: reporter });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

/**
 * DELETE /api/admin/reporters/:id
 * Delete a reporter account
 */
staffRouter.delete('/admin/reporters/:id', async (req, res) => {
  try {
    const reporter = await User.findOneAndDelete({ _id: req.params.id, role: 'student' });

    if (!reporter) {
      return res.status(404).json({ ok: false, message: 'Reporter account not found.' });
    }

    res.status(200).json({ ok: true, message: `Reporter account deleted.` });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});
