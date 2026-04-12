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
    return allIssues.filter((issue) => {
      const isAssignedToCurrentStaff = issue.assignedTo && issue.assignedTo === session?.email;
      const isLegacyDepartmentAssignment = !issue.assignedTo && issue.assignedDepartment === session?.department;
      return isAssignedToCurrentStaff || isLegacyDepartmentAssignment;
    });
  }, [allIssues, session?.department, session?.email]);

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assignedIssues
              .sort((a, b) => {
                const statusOrder = { assigned: 0, in_progress: 1, resolved: 2 };
                return statusOrder[a.status] - statusOrder[b.status];
              })
              .map((issue) => (
                <div
                  key={issue.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-lg hover:border-slate-300"
                >
                  {issue.imageUrl ? (
                    <a
                      href={issue.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mb-3 block overflow-hidden rounded-lg border border-slate-200"
                      title="Open uploaded photo"
                    >
                      <img
                        src={issue.imageUrl}
                        alt={`Issue ${issue.id} preview`}
                        className="h-40 w-full object-cover"
                        loading="lazy"
                      />
                    </a>
                  ) : null}

                  {/* Card Header */}
                  <div className="mb-3">
                    <h3 className="line-clamp-2 font-semibold text-slate-900">{issue.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{issue.description}</p>
                  </div>

                  {/* Badges */}
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(issue.status)}`}>
                      {ISSUE_STATUS.find((s) => s.value === issue.status)?.label}
                    </span>
                    {issue.status !== 'resolved' && (
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${getPriorityColor(issue.priority)}`}>
                        {ISSUE_PRIORITIES.find((p) => p.value === issue.priority)?.label}
                      </span>
                    )}
                  </div>

                  {/* Meta Info */}
                  <div className="mb-4 space-y-1 border-t border-slate-100 pt-3">
                    <p className="text-xs text-slate-600">
                      <span className="font-medium text-slate-700">Issue ID:</span> {issue.id}
                    </p>
                    <p className="text-xs text-slate-600">
                      <span className="font-medium text-slate-700">Location:</span> {issue.location}
                    </p>
                    <p className="text-xs text-slate-600">
                      <span className="font-medium text-slate-700">Reporter:</span> {issue.studentName}
                    </p>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => navigate(`/maintenance/issue/${issue.id}`)}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
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
