import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, CheckCircle2, Building2, BarChart3, TrendingUp, User, ArrowRight, X } from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import StatsCard from '../../components/dashboard/StatsCard';
import { getIssues, getIssueStats, getCategoryStats, getDepartmentStats } from '../../utils/issues';
import { getPendingMaintenanceStaff } from '../../utils/auth';
import { getActiveNotifications, dismissNotification } from '../../utils/notifications';
import { ISSUE_STATUS, ISSUE_CATEGORIES, DEPARTMENTS } from '../../constants/issues';

function OverallReportChart({ issues }) {
  const isOverdue = (issue) => {
    if (!issue?.createdAt || issue.status === 'resolved') return false;
    const createdAt = new Date(issue.createdAt).getTime();
    const now = Date.now();
    const hoursElapsed = (now - createdAt) / (1000 * 60 * 60);
    return hoursElapsed > 48;
  };

  const completed = issues.filter((issue) => issue.status === 'resolved').length;
  const overdue = issues.filter((issue) => isOverdue(issue)).length;
  const pending = issues.filter(
    (issue) =>
      (issue.status === 'submitted' || issue.status === 'assigned') &&
      !isOverdue(issue)
  ).length;
  const inProgress = issues.filter(
    (issue) => issue.status === 'in_progress' && !isOverdue(issue)
  ).length;

  const segments = [
    { label: 'Pending', value: pending, stroke: '#f59e0b', bg: 'bg-amber-500' },
    { label: 'In Progress', value: inProgress, stroke: '#3b82f6', bg: 'bg-blue-500' },
    { label: 'Completed', value: completed, stroke: '#10b981', bg: 'bg-emerald-500' },
    { label: 'Overdue', value: overdue, stroke: '#ef4444', bg: 'bg-red-500' },
  ];

  const total = segments.reduce((sum, item) => sum + item.value, 0);
  const radius = 84;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * radius;
  const gap = 8;
  const effectiveCircumference = circumference - gap * segments.length;

  let consumed = 0;

  return (
    <div className="flex h-full flex-col rounded-card border border-slate-200 bg-white p-6 shadow-card">
      <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
        <BarChart3 size={18} className="text-primary" />
        Overall Report
      </h3>

      <div className="flex flex-1 items-center justify-center">
        <div className="relative h-56 w-56">
          <svg viewBox="0 0 220 220" className="h-full w-full -rotate-90">
            <circle cx="110" cy="110" r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
            {total > 0 &&
              segments.map((segment) => {
                const fraction = segment.value / total;
                const dash = fraction * effectiveCircumference;
                const offset = consumed;
                consumed += dash + gap;

                return (
                  <circle
                    key={segment.label}
                    cx="110"
                    cy="110"
                    r={radius}
                    fill="none"
                    stroke={segment.stroke}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${circumference}`}
                    strokeDashoffset={-offset}
                  />
                );
              })}
          </svg>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total</p>
            <p className="text-3xl font-bold text-slate-900">{total}</p>
            <p className="text-xs text-slate-500">issues</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${segment.bg}`} />
              <span className="text-xs font-medium text-slate-700">{segment.label}</span>
            </div>
            <span className="text-xs font-semibold text-slate-900">{segment.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsGrid() {
  const issues = useMemo(() => getIssues(), []);
  const categoryStats = useMemo(() => getCategoryStats(), []);
  const deptStats = useMemo(() => getDepartmentStats(), []);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <OverallReportChart issues={issues} />

      <div className="flex h-full flex-col rounded-card border border-slate-200 bg-white p-6 shadow-card">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
          <BarChart3 size={18} className="text-primary" />
          Issues by Category
        </h3>
        <div className="flex-1 space-y-2">
          {ISSUE_CATEGORIES.map((cat) => {
            const count = categoryStats[cat.value] || 0;
            const percent = issues.length > 0 ? Math.round((count / issues.length) * 100) : 0;
            return (
              <div key={cat.value} className="flex items-center justify-between py-1.5 text-sm leading-relaxed">
                <span className="pr-3 text-slate-600 leading-7">{cat.label}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="w-8 text-right font-semibold text-slate-900">{count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex h-full flex-col rounded-card border border-slate-200 bg-white p-6 shadow-card">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
          <TrendingUp size={18} className="text-primary" />
          Department Workload
        </h3>
        <div className="flex flex-1 flex-col justify-between">
          {DEPARTMENTS.map((dept) => {
            const count = deptStats[dept.value] || 0;
            const percent = issues.length > 0 ? Math.round((count / issues.length) * 100) : 0;
            return (
              <div key={dept.value} className="flex items-center justify-between py-1 text-sm leading-relaxed">
                <span className="pr-3 text-slate-600 leading-snug">{dept.label}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-amber-500" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="w-8 text-right font-semibold text-slate-900">{count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const issues = useMemo(() => getIssues(), []);
  const stats = useMemo(() => getIssueStats(), []);
  const pendingStaff = useMemo(() => getPendingMaintenanceStaff(), []);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    setNotifications(getActiveNotifications());
  }, []);

  const handleDismissNotification = (notificationId) => {
    dismissNotification(notificationId);
    setNotifications(getActiveNotifications());
  };

  const getStatusBadgeClass = (status) => {
    const s = ISSUE_STATUS.find((x) => x.value === status);
    return s?.color || '';
  };

  return (
    <DashboardShell
      title="Admin Control Panel"
      subtitle="Manage users, issues, and campus operations"
      roleLabel="Admin"
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatsCard label="Total Issues" value={stats.total} icon={<Building2 size={16} />} tone="blue" />
        <StatsCard label="Pending" value={stats.submitted} icon={<AlertTriangle size={16} />} tone="amber" />
        <StatsCard label="Assigned" value={stats.assigned} icon={<Clock size={16} />} tone="blue" />
        <StatsCard label="In Progress" value={stats.inProgress} icon={<Clock size={16} />} tone="amber" />
        <StatsCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 size={16} />} tone="emerald" />
      </div>

      {pendingStaff.length > 0 && (
        <div className="mb-6 rounded-card border-l-4 border-amber-400 bg-amber-50 px-6 py-4 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User size={20} className="text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-900">Staff Approval Queue</h3>
                <p className="text-sm text-amber-800">{pendingStaff.length} maintenance staff waiting for approval</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/approvals')}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
            >
              Review <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {notifications.length > 0 && (
        <div className="mb-6 space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="rounded-card border-l-4 border-red-400 bg-red-50 px-6 py-4 shadow-card"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900">No Staff Assigned to Category</h3>
                    <p className="text-sm text-red-800 mt-1">{notification.message}</p>
                    <p className="text-xs text-red-700 mt-2">
                      <span className="font-semibold">{notification.count}</span> issue{notification.count > 1 ? 's' : ''} waiting for assignment
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/admin/staff')}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 whitespace-nowrap"
                  >
                    Assign Staff <ArrowRight size={16} />
                  </button>
                  <button
                    onClick={() => handleDismissNotification(notification.id)}
                    className="rounded-lg p-2 text-red-600 transition hover:bg-red-100"
                    title="Dismiss"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-6">
        <AnalyticsGrid />

        <div className="rounded-card border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Recent Issues</h2>

          {issues.length === 0 ? (
            <p className="text-center text-sm text-slate-600">No issues reported yet.</p>
          ) : (
            <div className="space-y-2">
              {issues
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 8)
                .map((issue) => (
                  <div
                    key={issue.id}
                    className="flex flex-col gap-2 border-l-4 border-blue-300 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900">{issue.title}</h4>
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${getStatusBadgeClass(issue.status)}`}>
                          {ISSUE_STATUS.find((s) => s.value === issue.status)?.label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {issue.studentName} | {issue.location} | {issue.category}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/admin/issues/${issue.id}`)}
                      className="mt-2 rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:mt-0"
                    >
                      Manage
                    </button>
                  </div>
                ))}
            </div>
          )}

          <button
            onClick={() => navigate('/admin/issues')}
            className="mt-4 w-full rounded-lg border border-primary bg-blue-50 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-blue-100"
          >
            View All Issues
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
