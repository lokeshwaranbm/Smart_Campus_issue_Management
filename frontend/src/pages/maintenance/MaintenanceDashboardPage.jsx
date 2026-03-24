import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import StatsCard from '../../components/dashboard/StatsCard';
import { getAuthSession } from '../../utils/auth';
import { getIssues } from '../../utils/issues';
import { ISSUE_STATUS, ISSUE_PRIORITIES } from '../../constants/issues';

export default function MaintenanceDashboardPage() {
  const navigate = useNavigate();
  const session = getAuthSession();
  const [allIssues, setAllIssues] = useState([]);

  useEffect(() => {
    getIssues().then(setAllIssues).catch(() => setAllIssues([]));
  }, []);

  const assignedIssues = useMemo(() => {
    return allIssues.filter((i) => i.assignedDepartment === session?.department || (i.status !== 'submitted' && i.assignedDepartment));
  }, [allIssues, session?.department]);

  const stats = useMemo(
    () => ({
      assigned: assignedIssues.filter((i) => i.status === 'assigned').length,
      inProgress: assignedIssues.filter((i) => i.status === 'in_progress').length,
      resolved: assignedIssues.filter((i) => i.status === 'resolved').length,
    }),
    [assignedIssues]
  );

  const getStatusColor = (status) => {
    const s = ISSUE_STATUS.find((x) => x.value === status);
    return s?.color || '';
  };

  const getPriorityColor = (priority) => {
    const p = ISSUE_PRIORITIES.find((x) => x.value === priority);
    return p?.color || '';
  };

  return (
    <DashboardShell title="Maintenance Issues" subtitle="Track and resolve assigned issues" roleLabel="Maintenance">
      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">Account status: Active</div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatsCard label="Assigned" value={stats.assigned} icon={<AlertCircle size={16} />} tone="blue" />
        <StatsCard label="In Progress" value={stats.inProgress} icon={<Clock size={16} />} tone="amber" />
        <StatsCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 size={16} />} tone="emerald" />
      </div>

      <div className="rounded-card border border-slate-200 bg-white p-6 shadow-card">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Work Queue</h2>

        {assignedIssues.length === 0 ? (
          <p className="text-center text-sm text-slate-600">No issues assigned yet.</p>
        ) : (
          <div className="space-y-3">
            {assignedIssues
              .sort((a, b) => {
                const statusOrder = { assigned: 0, in_progress: 1, resolved: 2 };
                return statusOrder[a.status] - statusOrder[b.status];
              })
              .map((issue) => (
                <div key={issue.id} className="flex flex-col gap-2 border-l-4 border-amber-300 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{issue.title}</h3>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(issue.status)}`}>
                        {ISSUE_STATUS.find((s) => s.value === issue.status)?.label}
                      </span>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${getPriorityColor(issue.priority)}`}>
                        {ISSUE_PRIORITIES.find((p) => p.value === issue.priority)?.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{issue.description.substring(0, 150)}...</p>
                    <p className="mt-2 text-xs text-slate-500">
                      ID: {issue.id} | Location: {issue.location} | From: {issue.studentName}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/maintenance/issue/${issue.id}`)}
                    className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 sm:mt-0"
                  >
                    View & Update
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
