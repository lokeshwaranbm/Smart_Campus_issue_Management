import { apiFetch } from './apiConfig';

// Parse a fetch Response — throws on non-ok HTTP status.
const parseResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || 'Request failed');
  return data;
};

// ── List / Query ─────────────────────────────────────────────────────────────

// Returns: array of issue objects
export const getIssues = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
  const qs = params.toString() ? `?${params.toString()}` : '';
  const response = await apiFetch(`/api/issues${qs}`, { method: 'GET' });
  return parseResponse(response);
};

// Returns: single issue object
export const getIssueById = async (issueId) => {
  const response = await apiFetch(`/api/issues/${issueId}`, { method: 'GET' });
  return parseResponse(response);
};

export const getIssuesByStudent = async (studentEmail) => {
  return getIssues({ studentEmail });
};

export const getIssuesByDepartment = async (department) => {
  return getIssues({ assignedDepartment: department });
};

export const getPublicIssueFeed = async () => {
  return getIssues();
};

// ── Stats ─────────────────────────────────────────────────────────────────────

// Returns: { total, submitted, assigned, inProgress, resolved, closed }
export const getIssueStats = async () => {
  const response = await apiFetch('/api/issues/stats', { method: 'GET' });
  return parseResponse(response);
};

// These are pure computed helpers — callers pass the already-loaded issues array.
export const getCategoryStats = (issues) => {
  const stats = {};
  issues.forEach((issue) => {
    stats[issue.category] = (stats[issue.category] || 0) + 1;
  });
  return stats;
};

export const getDepartmentStats = (issues) => {
  const stats = {};
  issues.forEach((issue) => {
    if (issue.assignedDepartment) {
      stats[issue.assignedDepartment] = (stats[issue.assignedDepartment] || 0) + 1;
    }
  });
  return stats;
};

// ── Mutations ─────────────────────────────────────────────────────────────────

// Returns: created issue object
export const createIssue = async (payload) => {
  const response = await apiFetch('/api/issues', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
};

// Returns: { message } on success, throws on failure
export const deleteIssue = async (issueId) => {
  const response = await apiFetch(`/api/issues/${issueId}`, { method: 'DELETE' });
  return parseResponse(response);
};

// Returns: updated issue object
export const updateIssueStatus = async (issueId, newStatus, updatedBy = 'system', resolutionProof = null) => {
  const response = await apiFetch(`/api/issues/${issueId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: newStatus, updatedBy, resolutionProof }),
  });
  return parseResponse(response);
};

// Returns: updated issue object
export const addIssueRemark = async (issueId, remark, authorEmail) => {
  const response = await apiFetch(`/api/issues/${issueId}/remarks`, {
    method: 'POST',
    body: JSON.stringify({ text: remark, authorEmail }),
  });
  return parseResponse(response);
};

// Returns: updated issue object
export const assignIssue = async (issueId, department, assignedTo) => {
  const response = await apiFetch(`/api/issues/${issueId}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ department, assignedTo }),
  });
  return parseResponse(response);
};

// Returns: updated issue object (for setIssue(updated) pattern)
export const addComment = async (issueId, commentText, userEmail, userName) => {
  const response = await apiFetch(`/api/issues/${issueId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ text: commentText, userEmail, userName }),
  });
  return parseResponse(response);
};

// Toggle support — both addSupport and removeSupport hit the same toggle endpoint.
// Returns: { issue, added } — callers can use result.issue to update state.
export const addSupport = async (issueId, userEmail) => {
  const response = await apiFetch(`/api/issues/${issueId}/support`, {
    method: 'POST',
    body: JSON.stringify({ userEmail }),
  });
  return parseResponse(response);
};

export const removeSupport = async (issueId, userEmail) => {
  const response = await apiFetch(`/api/issues/${issueId}/support`, {
    method: 'POST',
    body: JSON.stringify({ userEmail }),
  });
  return parseResponse(response);
};

// ── Pure sync helpers ─────────────────────────────────────────────────────────

// Caller passes the full issue object (already loaded), not just the id.
export const hasUserSupported = (issue, userEmail) => {
  if (!issue || !issue.supportedBy) return false;
  return issue.supportedBy.includes(userEmail);
};

export const calculatePriority = (supportsCount) => {
  if (supportsCount >= 20) return 'critical';
  if (supportsCount >= 10) return 'high';
  if (supportsCount >= 5) return 'medium';
  return 'low';
};

// getComments is now derived from the issue object returned by getIssueById.
export const getComments = (issue) => {
  return issue?.comments ?? [];
};

