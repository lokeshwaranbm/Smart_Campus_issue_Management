import express from 'express';
import mongoose from 'mongoose';
import { Issue } from '../models/Issue.js';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { AppSettings, APP_SETTINGS_DEFAULTS } from '../models/AppSettings.js';
import { IssueAttachment } from '../models/IssueAttachment.js';
import { IssueComment } from '../models/IssueComment.js';
import { IssueUpdate } from '../models/IssueUpdate.js';
import { IssueSLA } from '../models/IssueSLA.js';
import { Notification } from '../models/Notification.js';

export const issueRouter = express.Router();

const createIssueUpdateSafe = async (payload) => {
  try {
    await IssueUpdate.create(payload);
  } catch (error) {
    console.warn('IssueUpdate write skipped:', error.message);
  }
};

const CATEGORY_ALIAS_TO_NAME = {
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  wifi: 'Network',
  network: 'Network',
  cleanliness: 'Cleanliness',
  hostel: 'Hostel',
  maintenance: 'Maintenance',
  laboratory: 'Other',
  classroom: 'Other',
  other: 'Other',
};

const ALLOWED_PRIORITIES = new Set(['low', 'medium', 'high', 'critical']);

function getNormalizedIssuePriority(issue) {
  const reportedPriority = String(issue?.reportedPriority || '').trim().toLowerCase();
  if (ALLOWED_PRIORITIES.has(reportedPriority)) return reportedPriority;

  const storedPriority = String(issue?.priority || '').trim().toLowerCase();
  if (!ALLOWED_PRIORITIES.has(storedPriority)) return 'medium';

  // Legacy repair for older data where support toggles downgraded priority to low.
  if (
    storedPriority === 'low' &&
    String(issue?.status || '').toLowerCase() === 'resolved' &&
    Number(issue?.supports || 0) > 0
  ) {
    return 'medium';
  }

  return storedPriority;
}

function withNormalizedPriority(issue) {
  if (!issue) return issue;
  return {
    ...issue,
    priority: getNormalizedIssuePriority(issue),
  };
}

// Priority based on support count
function calculatePriority(supportCount) {
  if (supportCount >= 20) return 'critical';
  if (supportCount >= 10) return 'high';
  if (supportCount >= 5) return 'medium';
  return 'low';
}

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const DEFAULT_MAX_ISSUES_PER_STAFF = APP_SETTINGS_DEFAULTS.staff.maxIssuesPerStaff;
const DEFAULT_AUTO_ASSIGNMENT_ENABLED = APP_SETTINGS_DEFAULTS.staff.autoAssignmentEnabled;

async function getAutoAssignmentConfig() {
  try {
    const settings = await AppSettings.findOne({ key: 'global' }).lean();
    const staffSettings = settings?.staff || {};

    return {
      autoAssignmentEnabled:
        typeof staffSettings.autoAssignmentEnabled === 'boolean'
          ? staffSettings.autoAssignmentEnabled
          : DEFAULT_AUTO_ASSIGNMENT_ENABLED,
      maxIssuesPerStaff:
        Number.isInteger(staffSettings.maxIssuesPerStaff) && staffSettings.maxIssuesPerStaff > 0
          ? staffSettings.maxIssuesPerStaff
          : DEFAULT_MAX_ISSUES_PER_STAFF,
    };
  } catch {
    return {
      autoAssignmentEnabled: DEFAULT_AUTO_ASSIGNMENT_ENABLED,
      maxIssuesPerStaff: DEFAULT_MAX_ISSUES_PER_STAFF,
    };
  }
}

async function findCategoryByIssueCategory(categoryKey) {
  const normalizedKey = String(categoryKey || '').trim().toLowerCase();
  if (!normalizedKey) return null;

  const categoryName = CATEGORY_ALIAS_TO_NAME[normalizedKey] || categoryKey;
  const exactPattern = new RegExp(`^${escapeRegex(categoryName)}$`, 'i');
  const direct = await Category.findOne({ name: exactPattern, isActive: true }).lean();
  if (direct) return direct;

  // Backward compatibility for old student keys like "electrical", "wifi", etc.
  if (CATEGORY_ALIAS_TO_NAME[normalizedKey]) {
    const legacyPattern = new RegExp(`^${escapeRegex(CATEGORY_ALIAS_TO_NAME[normalizedKey])}$`, 'i');
    return Category.findOne({ name: legacyPattern, isActive: true }).lean();
  }

  return null;
}

// Find the least-loaded active staff assigned to a category
async function findBestStaffForCategory(categoryKey) {
  const assignmentConfig = await getAutoAssignmentConfig();
  if (!assignmentConfig.autoAssignmentEnabled) {
    return { bestStaff: null, matchedCategory: null, nextPointer: null };
  }

  const normalizedKey = String(categoryKey || '').trim().toLowerCase();
  if (!normalizedKey) {
    return { bestStaff: null, matchedCategory: null, nextPointer: null };
  }

  const baseCategory = await findCategoryByIssueCategory(categoryKey);
  const matchedCategory = baseCategory
    ? await Category.findById(baseCategory._id).populate('assignedStaff', 'name email role department isActive isSuspended')
    : null;

  if (!matchedCategory || !Array.isArray(matchedCategory.assignedStaff)) {
    return { bestStaff: null, matchedCategory: matchedCategory || null, nextPointer: null };
  }

  // Step 1: filter staff (active + category)
  let staffCandidates = Array.isArray(matchedCategory.assignedStaff) ? matchedCategory.assignedStaff : [];

  // Fallback: if category.assignedStaff is empty, resolve from User.assignedCategories.
  if (!staffCandidates.length && matchedCategory?._id) {
    staffCandidates = await User.find({
      role: 'staff',
      isActive: true,
      isSuspended: false,
      assignedCategories: matchedCategory._id,
    })
      .select('name email role department isActive isSuspended')
      .lean();
  }

  const staffList = staffCandidates.filter(
    (staff) =>
      staff &&
      staff.role === 'staff' &&
      staff.isActive &&
      !staff.isSuspended &&
      typeof staff.email === 'string' &&
      staff.email.trim()
  );

  if (!staffList.length) {
    return { bestStaff: null, matchedCategory, nextPointer: null };
  }

  // Count active issues (assigned or in_progress) per staff member
  const counts = await Promise.all(
    staffList.map((s) =>
      Issue.countDocuments({
        assignedTo: s.email,
        status: { $in: ['assigned', 'in_progress'] },
      }).then((count) => ({ staff: s, count }))
    )
  );

  // Step 2: remove staff with max limit reached
  const eligibleByCapacity = counts.filter((entry) => entry.count < assignmentConfig.maxIssuesPerStaff);
  if (!eligibleByCapacity.length) {
    return { bestStaff: null, matchedCategory, nextPointer: null };
  }

  // Step 3: find minimum load
  const minLoad = Math.min(...eligibleByCapacity.map((entry) => entry.count));
  const minLoadStaff = eligibleByCapacity
    .filter((entry) => entry.count === minLoad)
    .sort((a, b) => String(a.staff.email).localeCompare(String(b.staff.email)));

  if (!minLoadStaff.length) {
    return { bestStaff: null, matchedCategory, nextPointer: null };
  }

  // Step 4: tie-break by round-robin pointer when loads are equal
  const currentPointer = Number.isInteger(matchedCategory.autoAssignPointer)
    ? matchedCategory.autoAssignPointer
    : 0;

  const tieIndex = currentPointer % minLoadStaff.length;
  const selectedEntry = minLoadStaff[tieIndex];
  const nextPointer = (currentPointer + 1) % staffList.length;

  return {
    bestStaff: selectedEntry?.staff || null,
    matchedCategory,
    nextPointer,
  };
}

// POST /api/issues — create a new issue
issueRouter.post('/issues', async (req, res) => {
  try {
    const {
      id,
      title,
      description,
      category,
      priority,
      location,
      blockNumber,
      floorNumber,
      latitude,
      longitude,
      imageUrl,
      studentEmail,
      studentName,
    } = req.body;

    if (!id || !title || !description || !category || !studentEmail) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const reporter = await User.findOne({ email: String(studentEmail).toLowerCase() }).lean();
    if (!reporter || reporter.role !== 'student' || reporter.isSuspended || !reporter.isActive) {
      return res.status(403).json({
        message: 'Only active student accounts can submit issues.',
      });
    }

    const inputPriority = String(priority || '').trim().toLowerCase();
    const normalizedPriority = ALLOWED_PRIORITIES.has(inputPriority) ? inputPriority : 'medium';

    const { bestStaff, matchedCategory, nextPointer } = await findBestStaffForCategory(category);

    const issueData = {
      id,
      title,
      description,
      category,
      categoryId: matchedCategory?._id || null,
      location: location || '',
      blockNumber: blockNumber || '',
      floorNumber: floorNumber || '',
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      imageUrl: imageUrl ?? null,
      studentEmail: reporter.email,
      studentName: reporter.name || studentName || '',
      priority: normalizedPriority,
      reportedPriority: normalizedPriority,
      status: bestStaff ? 'assigned' : 'submitted',
      assignedTo: bestStaff ? bestStaff.email : null,
      assignedToName: bestStaff ? bestStaff.name : null,
      assignedToId: bestStaff ? bestStaff._id : null,
      assignedDepartment: bestStaff ? bestStaff.department || null : null,
      assignedToType: bestStaff ? 'staff' : 'staff',
      assignedBy: null,
      assignedAt: bestStaff ? new Date() : null,
      autoAssigned: !!bestStaff,
    };

    const issue = await Issue.create(issueData);

    // Step 6: update round-robin pointer for every successful assignment
    if (bestStaff && matchedCategory?._id && Number.isInteger(nextPointer)) {
      await Category.updateOne(
        { _id: matchedCategory._id },
        { $set: { autoAssignPointer: nextPointer } }
      );
    }

    await createIssueUpdateSafe({
      issueId: issue._id,
      eventType: 'created',
      previousValue: null,
      newValue: { status: issue.status, assignedTo: issue.assignedTo },
      note: 'Issue created',
      changedByEmail: issue.studentEmail,
    });

    return res.status(201).json(issue);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Issue with this ID already exists' });
    }
    console.error('POST /issues error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/issues/stats — summary counts (must be before /:id)
issueRouter.get('/issues/stats', async (req, res) => {
  try {
    const [total, submitted, assigned, inProgress, resolved, closed] = await Promise.all([
      Issue.countDocuments(),
      Issue.countDocuments({ status: 'submitted' }),
      Issue.countDocuments({ status: 'assigned' }),
      Issue.countDocuments({ status: 'in_progress' }),
      Issue.countDocuments({ status: 'resolved' }),
      Issue.countDocuments({ status: 'closed' }),
    ]);
    return res.json({ total, submitted, assigned, inProgress, resolved, closed });
  } catch (err) {
    console.error('GET /issues/stats error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/issues — list issues with optional filters
issueRouter.get('/issues', async (req, res) => {
  try {
    const { status, category, studentEmail, assignedTo, assignedDepartment } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (studentEmail) filter.studentEmail = studentEmail;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (assignedDepartment) filter.assignedDepartment = assignedDepartment;

    const issues = await Issue.find(filter).sort({ createdAt: -1 }).lean();
    return res.json(issues.map(withNormalizedPriority));
  } catch (err) {
    console.error('GET /issues error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/issues/:id — single issue by display id
issueRouter.get('/issues/:id', async (req, res) => {
  try {
    const issue = await Issue.findOne({ id: req.params.id }).lean();
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    return res.json(withNormalizedPriority(issue));
  } catch (err) {
    console.error('GET /issues/:id error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/issues/:id/status
issueRouter.patch('/issues/:id/status', async (req, res) => {
  try {
    const { status, updatedBy } = req.body;
    if (!status) return res.status(400).json({ message: 'status is required' });

    const currentIssue = await Issue.findOne({ id: req.params.id });
    if (!currentIssue) return res.status(404).json({ message: 'Issue not found' });

    const issue = await Issue.findOneAndUpdate(
      { id: req.params.id },
      { status, lastUpdatedBy: updatedBy || null },
      { new: true }
    );

    await createIssueUpdateSafe({
      issueId: issue._id,
      eventType: 'status_changed',
      previousValue: { status: currentIssue.status },
      newValue: { status: issue.status },
      note: `Status updated to ${issue.status}`,
      changedByEmail: updatedBy || null,
    });

    return res.json(issue);
  } catch (err) {
    console.error('PATCH /issues/:id/status error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/issues/:id/assign
issueRouter.patch('/issues/:id/assign', async (req, res) => {
  try {
    const { department, assignedTo } = req.body;

    const currentIssue = await Issue.findOne({ id: req.params.id });
    if (!currentIssue) return res.status(404).json({ message: 'Issue not found' });

    let assignedToName = null;
    if (assignedTo) {
      const staff = await User.findOne({ email: assignedTo }).lean();
      assignedToName = staff ? staff.name : null;
    }

    const update = {
      assignedDepartment: department || null,
      assignedTo: assignedTo || null,
      assignedToName,
      assignedAt: assignedTo ? new Date() : null,
      assignedToType: assignedTo ? 'staff' : 'staff',
      assignedBy: null,
      status: assignedTo ? 'assigned' : 'submitted',
      autoAssigned: false,
    };

    const issue = await Issue.findOneAndUpdate({ id: req.params.id }, update, { new: true });

    await createIssueUpdateSafe({
      issueId: issue._id,
      eventType: currentIssue.assignedTo ? 'reassigned' : 'assigned',
      previousValue: {
        assignedTo: currentIssue.assignedTo,
        assignedDepartment: currentIssue.assignedDepartment,
      },
      newValue: {
        assignedTo: issue.assignedTo,
        assignedDepartment: issue.assignedDepartment,
      },
      note: issue.assignedTo ? `Assigned to ${issue.assignedTo}` : 'Assignment removed',
      changedByEmail: null,
    });

    return res.json(issue);
  } catch (err) {
    console.error('PATCH /issues/:id/assign error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/issues/:id/remarks
issueRouter.post('/issues/:id/remarks', async (req, res) => {
  try {
    const { text, authorEmail } = req.body;
    if (!text || !authorEmail) {
      return res.status(400).json({ message: 'text and authorEmail are required' });
    }

    const issue = await Issue.findOneAndUpdate(
      { id: req.params.id },
      { $push: { remarks: { text, authorEmail, timestamp: new Date() } } },
      { new: true }
    );
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    return res.json(issue);
  } catch (err) {
    console.error('POST /issues/:id/remarks error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/issues/:id/comments
issueRouter.post('/issues/:id/comments', async (req, res) => {
  try {
    const { text, userEmail, userName } = req.body;
    if (!text || !userEmail) {
      return res.status(400).json({ message: 'text and userEmail are required' });
    }

    const issue = await Issue.findOneAndUpdate(
      { id: req.params.id },
      {
        $push: { comments: { text, userEmail, userName: userName || '', createdAt: new Date() } },
        $inc: { commentCount: 1 },
      },
      { new: true }
    );
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    const author = await User.findOne({ email: userEmail.toLowerCase() }).lean();

    try {
      await IssueComment.create({
        issueId: issue._id,
        authorId: author?._id || null,
        authorEmail: userEmail,
        authorName: userName || author?.name || '',
        body: text,
        visibility: 'public',
      });
    } catch (error) {
      console.warn('IssueComment write skipped:', error.message);
    }

    await createIssueUpdateSafe({
      issueId: issue._id,
      eventType: 'comment_added',
      previousValue: null,
      newValue: { commentBy: userEmail },
      note: 'Comment added',
      changedBy: author?._id || null,
      changedByEmail: userEmail,
    });

    return res.json(issue);
  } catch (err) {
    console.error('POST /issues/:id/comments error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/issues/:id/support — toggle support for a user
issueRouter.post('/issues/:id/support', async (req, res) => {
  try {
    const { userEmail } = req.body;
    if (!userEmail) return res.status(400).json({ message: 'userEmail is required' });

    const existing = await Issue.findOne({ id: req.params.id });
    if (!existing) return res.status(404).json({ message: 'Issue not found' });

    const alreadySupported = existing.supportedBy.includes(userEmail);
    const update = alreadySupported
      ? { $pull: { supportedBy: userEmail } }
      : { $addToSet: { supportedBy: userEmail } };

    const updated = await Issue.findOneAndUpdate({ id: req.params.id }, update, { new: true });
    const newCount = updated.supportedBy.length;

    await Issue.findOneAndUpdate(
      { id: req.params.id },
      { supports: newCount }
    );

    const final = await Issue.findOne({ id: req.params.id }).lean();
    return res.json({ issue: final, added: !alreadySupported });
  } catch (err) {
    console.error('POST /issues/:id/support error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/issues/:id
issueRouter.delete('/issues/:id', async (req, res) => {
  try {
    const session = await mongoose.startSession();
    let deletedIssue = null;
    let deletedCounts = {
      issueUpdates: 0,
      issueComments: 0,
      issueAttachments: 0,
      issueSla: 0,
      notifications: 0,
    };

    try {
      await session.withTransaction(async () => {
        deletedIssue = await Issue.findOneAndDelete({ id: req.params.id }, { session });

        if (!deletedIssue) {
          return;
        }

        const issueObjectId = deletedIssue._id;

        const [issueUpdateResult, issueCommentResult, issueAttachmentResult, issueSlaResult, notificationResult] = await Promise.all([
          IssueUpdate.deleteMany({ issueId: issueObjectId }, { session }),
          IssueComment.deleteMany({ issueId: issueObjectId }, { session }),
          IssueAttachment.deleteMany({ issueId: issueObjectId }, { session }),
          IssueSLA.deleteMany({ issueId: issueObjectId }, { session }),
          Notification.deleteMany({ issueId: issueObjectId }, { session }),
        ]);

        deletedCounts = {
          issueUpdates: issueUpdateResult.deletedCount || 0,
          issueComments: issueCommentResult.deletedCount || 0,
          issueAttachments: issueAttachmentResult.deletedCount || 0,
          issueSla: issueSlaResult.deletedCount || 0,
          notifications: notificationResult.deletedCount || 0,
        };
      });
    } finally {
      await session.endSession();
    }

    if (!deletedIssue) return res.status(404).json({ message: 'Issue not found' });

    return res.json({
      message: 'Issue and related data deleted successfully',
      deletedCounts,
    });
  } catch (err) {
    console.error('DELETE /issues/:id error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});
