import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, AlertTriangle, Filter, X, Loader2 } from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { getIssues, deleteIssue } from '../../utils/issues';
import { ISSUE_STATUS, ISSUE_PRIORITIES } from '../../constants/issues';
import { apiFetch } from '../../utils/apiConfig';

export default function AdminIssuesListPage() {
  const navigate = useNavigate();
  const [allIssues, setAllIssues] = useState([]);
  const [overdueIssues, setOverdueIssues] = useState([]);
  const [activeStatusFilter, setActiveStatusFilter] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notice, setNotice] = useState(null);

  const loadIssues = () => {
    getIssues().then(setAllIssues).catch(() => setAllIssues([]));
  };

  const loadOverdueIssues = async () => {
    try {
      const response = await apiFetch('/api/admin/overdue-issues');
      const result = await response.json();
      console.log('Overdue Issues Response:', result); // Debug log
      if (result.ok) {
        setOverdueIssues(result.data || []);
      } else {
        console.error('API returned error:', result.message);
      }
    } catch (error) {
      console.error('Failed to load overdue issues:', error);
    }
  };

  useEffect(() => {
    loadIssues();
    loadOverdueIssues();
  }, []);

  useEffect(() => {
    if (!notice) return undefined;

    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const openDeleteModal = (issue) => {
    setDeleteTarget(issue);
    setNotice(null);
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
  };

  const handleDeleteIssue = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const result = await deleteIssue(deleteTarget.id);
      loadIssues();
      loadOverdueIssues();
      setNotice({
        type: 'success',
        message: result?.message || 'Issue and related data deleted successfully.',
      });
      setDeleteTarget(null);
    } catch (error) {
      setNotice({
        type: 'error',
        message: error.message || 'Failed to delete issue. Please try again.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Group issues by status
  const issuesByStatus = useMemo(() => {
    const grouped = {
      submitted: [],
      assigned: [],
      in_progress: [],
      resolved: [],
    };

    allIssues.forEach((issue) => {
      if (grouped[issue.status]) {
        grouped[issue.status].push(issue);
      }
    });

    // Sort within each group
    Object.keys(grouped).forEach((status) => {
      if (sortBy === 'newest') {
        grouped[status].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sortBy === 'priority') {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        grouped[status].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      }
    });

    return grouped;
  }, [allIssues, sortBy]);

  // Filtered issues based on active status filter
  const filteredIssues = useMemo(() => {
    if (!activeStatusFilter) {
      return allIssues;
    }
    return allIssues.filter((i) => i.status === activeStatusFilter);
  }, [allIssues, activeStatusFilter]);

  const getStatusColor = (status) => {
    const s = ISSUE_STATUS.find((x) => x.value === status);
    return s?.color || '';
  };

  const getPriorityColor = (priority) => {
    const p = ISSUE_PRIORITIES.find((x) => x.value === priority);
    return p?.color || '';
  };

  const statusFilters = [
    { value: null, label: 'All Issues' },
    { value: 'submitted', label: 'Pending' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
  ];

  return (
    <DashboardShell title="All Issues" subtitle="Manage and track all campus infrastructure issues" roleLabel="Admin">
      <button
        onClick={() => navigate('/dashboard/admin')}
        className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <ArrowLeft size={16} className="text-primary" />
        Back to Dashboard
      </button>

      {notice && (
        <div
          className={`mb-6 flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 shadow-sm ${
            notice.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-900'
          }`}
        >
          <div>
            <p className="text-sm font-semibold">
              {notice.type === 'success' ? 'Deletion completed' : 'Deletion failed'}
            </p>
            <p className="text-sm opacity-90">{notice.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="rounded-full p-1 transition hover:bg-black/5"
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Overdue Issues Section - Always Show if Any */}
      {overdueIssues && overdueIssues.length > 0 && (
        <div className="mb-8 rounded-lg border-2 border-red-300 bg-gradient-to-r from-red-50 to-red-100 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 border-b border-red-400 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle size={28} className="text-white animate-pulse" />
              <div>
                <h2 className="text-xl font-bold text-white">Overdue Issues - Immediate Action Required</h2>
                <p className="text-sm text-red-100">Issues past their SLA deadline</p>
              </div>
            </div>
            <span className="bg-white text-red-700 text-lg font-bold px-4 py-2 rounded-full">
              {overdueIssues.length} Overdue
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-red-300 bg-red-200">
                  <th className="px-6 py-3 text-left font-semibold text-red-900">Issue ID</th>
                  <th className="px-6 py-3 text-left font-semibold text-red-900">Title</th>
                  <th className="px-6 py-3 text-left font-semibold text-red-900">Category</th>
                  <th className="px-6 py-3 text-left font-semibold text-red-900">Overdue Time</th>
                  <th className="px-6 py-3 text-left font-semibold text-red-900">Priority</th>
                  <th className="px-6 py-3 text-left font-semibold text-red-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {overdueIssues.map((item) => {
                  const issue = item.issueId || item;
                  const issueId = issue?._id || issue?.id || 'Unknown';
                  const title = issue?.title || 'Unknown Title';
                  const category = issue?.category || item?.categoryId?.name || 'Unknown';
                  const studentName = issue?.studentName || 'Unknown';
                  const priority = issue?.priority || 'medium';
                  
                  return (
                    <tr key={issueId} className="border-b border-red-200 hover:bg-red-100 transition">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-red-700">{issueId}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-900">{title}</p>
                          <p className="text-xs text-slate-600">{studentName}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">{category}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block rounded-lg bg-red-600 text-white px-3 py-1 text-xs font-bold">
                          {item.overdueHours > 0 ? `${item.overdueHours}h overdue` : 'About to expire'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {issue?.status !== 'resolved' && (
                          <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${getPriorityColor(priority)}`}>
                            {ISSUE_PRIORITIES.find((p) => p.value === priority)?.label || 'Medium'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`/admin/issues/${issueId}`)}
                          className="bg-primary text-white hover:bg-primary/90 font-bold text-xs px-3 py-1 rounded transition"
                        >
                          View & Escalate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filter Pills - Horizontal Layout */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {statusFilters.map((filter) => (
              <button
                key={filter.value || 'all'}
                onClick={() => setActiveStatusFilter(filter.value)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  activeStatusFilter === filter.value
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-600" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="priority">By Priority</option>
              </select>
            </div>
            <div className="text-sm font-semibold text-slate-600 whitespace-nowrap">
              Total: {filteredIssues.length}
            </div>
          </div>
        </div>
      </div>

      {/* Issues Table */}
      <div className="rounded-card border border-slate-200 bg-white shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Issue ID</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Title</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Student</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Priority</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredIssues.map((issue) => (
                <tr key={issue.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">{issue.id}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{issue.title}</p>
                      <p className="text-xs text-slate-500">{issue.category}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{issue.studentName}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(issue.status)}`}>
                      {ISSUE_STATUS.find((s) => s.value === issue.status)?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {issue.status !== 'resolved' && (
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${getPriorityColor(issue.priority)}`}>
                        {ISSUE_PRIORITIES.find((p) => p.value === issue.priority)?.label}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/admin/issues/${issue.id}`)}
                        className="text-primary hover:underline font-semibold text-xs"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openDeleteModal(issue)}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-200"
                        title="Delete this issue permanently"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredIssues.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-slate-600">No issues found with current filter.</p>
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-issue-title"
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="border-b border-slate-100 bg-gradient-to-r from-rose-50 via-white to-amber-50 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">Permanent Action</p>
                  <h3 id="delete-issue-title" className="text-xl font-bold text-slate-900">
                    Delete issue permanently?
                  </h3>
                </div>
              </div>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Issue</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{deleteTarget.title}</p>
                <p className="mt-1 font-mono text-xs text-slate-500">ID: {deleteTarget.id}</p>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                This will remove the issue and its related records, including updates, comments, attachments,
                SLA data, and notifications.
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={isDeleting}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteIssue}
                  disabled={isDeleting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  {isDeleting ? 'Deleting...' : 'Delete permanently'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
