import express from 'express';
import { Issue } from '../models/Issue.js';
import { User } from '../models/User.js';
import { IssueComment } from '../models/IssueComment.js';
import { IssueUpdate } from '../models/IssueUpdate.js';

export const issueRouter = express.Router();

const createIssueUpdateSafe = async (payload) => {
  try {
    await IssueUpdate.create(payload);
  } catch (error) {
    console.warn('IssueUpdate write skipped:', error.message);
  }
};

// Category → department mapping (mirrors frontend constants)
const CATEGORY_TO_DEPT = {
  electrical: 'electrical',
  wifi: 'ict',
  laboratory: 'infrastructure',
  hostel: 'general',
  plumbing: 'plumbing',
  classroom: 'infrastructure',
  cleanliness: 'cleanliness',
  other: 'general',
};

// Priority based on support count
function calculatePriority(supportCount) {
  if (supportCount >= 20) return 'critical';
  if (supportCount >= 10) return 'high';
  if (supportCount >= 5) return 'medium';
  return 'low';
}

// Find the least-loaded active staff in a department
async function findBestStaff(department) {
  const staffList = await User.find({
    role: 'staff',
    department,
    isActive: true,
    isSuspended: false,
  }).lean();

  if (!staffList.length) return null;

  // Count active issues (assigned or in_progress) per staff member
  const counts = await Promise.all(
    staffList.map((s) =>
      Issue.countDocuments({
        assignedTo: s.email,
        status: { $in: ['assigned', 'in_progress'] },
      }).then((count) => ({ staff: s, count }))
    )
  );

  counts.sort((a, b) => a.count - b.count);
  return counts[0].staff;
}

// POST /api/issues — create a new issue
issueRouter.post('/issues', async (req, res) => {
  try {
    const {
      id,
      title,
      description,
      category,
      location,
      latitude,
      longitude,
      imageUrl,
      studentEmail,
      studentName,
    } = req.body;

    if (!id || !title || !description || !category || !studentEmail) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const dept = CATEGORY_TO_DEPT[category] || 'general';
    const bestStaff = await findBestStaff(dept);

    const issueData = {
      id,
      title,
      description,
      category,
      location: location || '',
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      imageUrl: imageUrl ?? null,
      studentEmail,
      studentName: studentName || '',
      priority: 'low',
      status: bestStaff ? 'assigned' : 'submitted',
      assignedTo: bestStaff ? bestStaff.email : null,
      assignedToName: bestStaff ? bestStaff.name : null,
      assignedDepartment: bestStaff ? dept : null,
      assignedAt: bestStaff ? new Date() : null,
      autoAssigned: !!bestStaff,
    };

    const issue = await Issue.create(issueData);

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
    return res.json(issues);
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
    return res.json(issue);
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
    const newPriority = calculatePriority(newCount);

    await Issue.findOneAndUpdate(
      { id: req.params.id },
      { supports: newCount, priority: newPriority }
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
    const issue = await Issue.findOneAndDelete({ id: req.params.id });
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    return res.json({ message: 'Issue deleted' });
  } catch (err) {
    console.error('DELETE /issues/:id error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});
