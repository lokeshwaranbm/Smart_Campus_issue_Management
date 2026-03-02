import { getStaffAccounts } from './auth';
import { addUnassignedIssueNotification } from './notifications';
import { ISSUE_CATEGORIES } from '../constants/issues';

const ISSUES_KEY = 'smart-campus-issues';

const emptyIssuesDb = [];

const seedIssues = () => {
  const existing = localStorage.getItem(ISSUES_KEY);
  if (!existing) {
    localStorage.setItem(ISSUES_KEY, JSON.stringify(emptyIssuesDb));
  }
};

export const getIssues = () => {
  seedIssues();
  return JSON.parse(localStorage.getItem(ISSUES_KEY) || '[]');
};

export const saveIssues = (issues) => {
  localStorage.setItem(ISSUES_KEY, JSON.stringify(issues));
};

/**
 * Permanently deletes an issue from the system
 * @param {string} issueId - The ID of the issue to delete
 * @returns {object} Result object with ok status
 */
export const deleteIssue = (issueId) => {
  const issues = getIssues();
  const filteredIssues = issues.filter((issue) => issue.id !== issueId);
  saveIssues(filteredIssues);
  return { ok: true, message: 'Issue deleted successfully' };
};

/**
 * Automatically assigns an issue to the best available staff member
 * Uses load balancing based on active issues count
 */
export const autoAssignIssue = (category) => {
  const staffList = getStaffAccounts();
  const issues = getIssues();
  
  // Filter staff who are active and have this category assigned
  const eligibleStaff = staffList.filter(
    (staff) => 
      staff.status === 'active' && 
      staff.assignedCategories && 
      staff.assignedCategories.includes(category)
  );
  
  if (eligibleStaff.length === 0) {
    return null; // No staff available for this category
  }
  
  // Count active issues for each staff member
  const staffWorkload = eligibleStaff.map((staff) => {
    const activeIssues = issues.filter(
      (issue) => 
        issue.assignedTo === staff.email &&
        issue.status !== 'resolved' &&
        issue.status !== 'closed'
    ).length;
    
    return {
      email: staff.email,
      fullName: staff.fullName,
      department: staff.department,
      activeIssues,
    };
  });
  
  // Sort by active issues (ascending) and return the one with least workload
  staffWorkload.sort((a, b) => a.activeIssues - b.activeIssues);
  
  return staffWorkload[0];
};

export const createIssue = (payload) => {
  const issues = getIssues();
  
  // Auto-assign to staff if available
  const assignedStaff = autoAssignIssue(payload.category);
  
  const newIssue = {
    ...payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  // If staff found, assign immediately
  if (assignedStaff) {
    newIssue.status = 'assigned';
    newIssue.assignedTo = assignedStaff.email;
    newIssue.assignedToName = assignedStaff.fullName;
    newIssue.assignedDepartment = assignedStaff.department;
    newIssue.assignedAt = new Date().toISOString();
  } else {
    // No staff available - notify admin
    const categoryLabel = ISSUE_CATEGORIES.find(c => c.value === payload.category)?.label || payload.category;
    addUnassignedIssueNotification(payload.id, payload.category, categoryLabel);
  }
  
  issues.push(newIssue);
  saveIssues(issues);
  return newIssue;
};

export const getIssueById = (issueId) => {
  const issues = getIssues();
  return issues.find((issue) => issue.id === issueId);
};

export const getIssuesByStudent = (studentEmail) => {
  const issues = getIssues();
  return issues.filter((issue) => issue.studentEmail === studentEmail);
};

export const getIssuesByDepartment = (department) => {
  const issues = getIssues();
  return issues.filter((issue) => issue.assignedDepartment === department);
};

export const updateIssueStatus = (issueId, newStatus, updatedBy = 'system') => {
  const issues = getIssues();
  const issue = issues.find((i) => i.id === issueId);

  if (!issue) return { ok: false, message: 'Issue not found.' };

  issue.status = newStatus;
  issue.updatedAt = new Date().toISOString();
  issue.lastUpdatedBy = updatedBy;

  saveIssues(issues);
  return { ok: true, issue };
};

export const addIssueRemark = (issueId, remark, authorEmail) => {
  const issues = getIssues();
  const issue = issues.find((i) => i.id === issueId);

  if (!issue) return { ok: false, message: 'Issue not found.' };

  if (!issue.remarks) issue.remarks = [];
  issue.remarks.push({
    text: remark,
    authorEmail,
    timestamp: new Date().toISOString(),
  });

  issue.updatedAt = new Date().toISOString();
  saveIssues(issues);
  return { ok: true, issue };
};

export const assignIssue = (issueId, department, assignedTo) => {
  const issues = getIssues();
  const issue = issues.find((i) => i.id === issueId);

  if (!issue) return { ok: false, message: 'Issue not found.' };

  issue.status = 'assigned';
  issue.assignedDepartment = department;
  issue.assignedTo = assignedTo;
  issue.assignedAt = new Date().toISOString();
  issue.updatedAt = new Date().toISOString();

  saveIssues(issues);
  return { ok: true, issue };
};

export const getIssueStats = () => {
  const issues = getIssues();

  return {
    total: issues.length,
    submitted: issues.filter((i) => i.status === 'submitted').length,
    assigned: issues.filter((i) => i.status === 'assigned').length,
    inProgress: issues.filter((i) => i.status === 'in_progress').length,
    resolved: issues.filter((i) => i.status === 'resolved').length,
  };
};

export const getCategoryStats = () => {
  const issues = getIssues();
  const stats = {};

  issues.forEach((issue) => {
    if (!stats[issue.category]) {
      stats[issue.category] = 0;
    }
    stats[issue.category]++;
  });

  return stats;
};

export const getDepartmentStats = () => {
  const issues = getIssues();
  const stats = {};

  issues.forEach((issue) => {
    if (issue.assignedDepartment) {
      if (!stats[issue.assignedDepartment]) {
        stats[issue.assignedDepartment] = 0;
      }
      stats[issue.assignedDepartment]++;
    }
  });

  return stats;
};

export const calculatePriority = (supportsCount) => {
  if (supportsCount >= 31) return 'high';
  if (supportsCount >= 11) return 'medium';
  return 'low';
};

export const addSupport = (issueId, userEmail) => {
  const issues = getIssues();
  const issue = issues.find((i) => i.id === issueId);

  if (!issue) return { ok: false, message: 'Issue not found.' };

  if (!issue.supports) issue.supports = [];
  if (!issue.supportedBy) issue.supportedBy = [];

  const alreadySupported = issue.supportedBy.includes(userEmail);
  if (alreadySupported) {
    return { ok: false, message: 'You already support this issue.' };
  }

  issue.supportedBy.push(userEmail);
  issue.supports = issue.supportedBy.length;
  issue.priority = calculatePriority(issue.supports);
  issue.updatedAt = new Date().toISOString();

  saveIssues(issues);
  return { ok: true, issue };
};

export const removeSupport = (issueId, userEmail) => {
  const issues = getIssues();
  const issue = issues.find((i) => i.id === issueId);

  if (!issue) return { ok: false, message: 'Issue not found.' };

  if (!issue.supportedBy) issue.supportedBy = [];

  const index = issue.supportedBy.indexOf(userEmail);
  if (index > -1) {
    issue.supportedBy.splice(index, 1);
  }

  issue.supports = issue.supportedBy.length;
  issue.priority = calculatePriority(issue.supports);
  issue.updatedAt = new Date().toISOString();

  saveIssues(issues);
  return { ok: true, issue };
};

export const hasUserSupported = (issueId, userEmail) => {
  const issues = getIssues();
  const issue = issues.find((i) => i.id === issueId);

  if (!issue) return false;
  if (!issue.supportedBy) return false;

  return issue.supportedBy.includes(userEmail);
};

export const addComment = (issueId, commentText, userEmail, userName) => {
  const issues = getIssues();
  const issue = issues.find((i) => i.id === issueId);

  if (!issue) return { ok: false, message: 'Issue not found.' };

  if (!issue.comments) issue.comments = [];

  const newComment = {
    id: `comment-${Date.now()}`,
    text: commentText,
    userEmail,
    userName,
    createdAt: new Date().toISOString(),
  };

  issue.comments.push(newComment);
  issue.updatedAt = new Date().toISOString();

  saveIssues(issues);
  return { ok: true, comment: newComment };
};

export const getComments = (issueId) => {
  const issues = getIssues();
  const issue = issues.find((i) => i.id === issueId);

  if (!issue) return [];
  return issue.comments || [];
};

export const getPublicIssueFeed = () => {
  const issues = getIssues();
  return issues
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((issue) => ({
      ...issue,
      supports: issue.supports || 0,
      priority: issue.priority || calculatePriority(issue.supports || 0),
      commentsCount: (issue.comments || []).length,
    }));
};
