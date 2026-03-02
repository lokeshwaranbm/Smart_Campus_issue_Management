import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter, Trash2 } from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { getIssues, deleteIssue } from '../../utils/issues';
import { ISSUE_STATUS, ISSUE_PRIORITIES } from '../../constants/issues';

export default function AdminIssuesListPage() {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const allIssues = useMemo(() => getIssues(), [refreshKey]);
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const handleDeleteIssue = (issueId, issueTitle) => {
    const confirmed = window.confirm(
      `⚠️ Delete Issue?\n\n"${issueTitle}"\n\nThis will permanently delete this issue from:\n• Campus Feed\n• Staff Dashboard\n• All Reports\n\nThis action CANNOT be undone!\n\nClick OK to delete.`
    );

    if (!confirmed) return;

    const result = deleteIssue(issueId);
    if (result.ok) {
      setRefreshKey((prev) => prev + 1);
      alert('✅ Issue deleted successfully!');
    }
  };

  const filteredIssues = useMemo(() => {
    let result = [...allIssues];

    if (filterStatus) {
      result = result.filter((i) => i.status === filterStatus);
    }

    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'priority') {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      result.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }

    return result;
  }, [allIssues, filterStatus, sortBy]);

  const getStatusColor = (status) => {
    const s = ISSUE_STATUS.find((x) => x.value === status);
    return s?.color || '';
  };

  const getPriorityColor = (priority) => {
    const p = ISSUE_PRIORITIES.find((x) => x.value === priority);
    return p?.color || '';
  };

  return (
    <DashboardShell title="All Issues" subtitle="Manage and track all campus infrastructure issues" roleLabel="Admin">
      <button
        onClick={() => navigate('/dashboard/admin')}
        className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <ArrowLeft size={16} className="text-primary" />
        Back to Dashboard
      </button>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            {ISSUE_STATUS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="priority">By Priority</option>
          </select>
        </div>

        <div className="text-sm font-semibold text-slate-600">Total: {filteredIssues.length} issues</div>
      </div>

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
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${getPriorityColor(issue.priority)}`}>
                      {ISSUE_PRIORITIES.find((p) => p.value === issue.priority)?.label}
                    </span>
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
                        onClick={() => handleDeleteIssue(issue.id, issue.title)}
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
            <p className="text-slate-600">No issues found with current filters.</p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
