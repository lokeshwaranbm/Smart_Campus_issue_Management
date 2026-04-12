import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Gauge,
  Timer,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import AlertMessage from '../../components/auth/AlertMessage';
import { getIssues } from '../../utils/issues';
import { getStaffAccounts } from '../../utils/auth';
import { getSettings } from '../../utils/settings';
import { apiFetch } from '../../utils/apiConfig';

const toHours = (ms) => ms / (1000 * 60 * 60);

const formatHours = (hours) => {
  if (!Number.isFinite(hours) || hours <= 0) return '0h';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
};

const getPerfColor = (slaPercent) => {
  if (slaPercent >= 90) return 'text-emerald-700 bg-emerald-100 border-emerald-200';
  if (slaPercent >= 75) return 'text-blue-700 bg-blue-100 border-blue-200';
  if (slaPercent >= 60) return 'text-amber-700 bg-amber-100 border-amber-200';
  return 'text-red-700 bg-red-100 border-red-200';
};

const getPerfLabel = (slaPercent) => {
  if (slaPercent >= 90) return 'Excellent';
  if (slaPercent >= 75) return 'Good';
  if (slaPercent >= 60) return 'Average';
  return 'Critical';
};

const getCategoryKey = (category) => String(category || '').trim().toLowerCase();

export default function AdminSLAMonitoringPage() {
  const [issues, setIssues] = useState([]);
  const [staff, setStaff] = useState([]);
  const [slaStats, setSlaStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [issuesData, staffData, settingsData] = await Promise.all([
          getIssues(),
          getStaffAccounts(),
          getSettings(),
        ]);

        setIssues(Array.isArray(issuesData) ? issuesData : []);
        setStaff(Array.isArray(staffData) ? staffData : []);
        setSettings(settingsData || null);
      } catch (error) {
        setMessage(`Failed to load SLA monitor data: ${error.message}`);
      }

      try {
        const response = await apiFetch('/api/admin/sla-stats');
        const result = await response.json();
        if (result?.ok) setSlaStats(result.data);
      } catch {
        // Non-blocking fallback: dashboard still works from issues data.
      }
    };

    load();
  }, []);

  const categorySlaMap = useMemo(() => {
    const map = {};
    const categories = settings?.categories || [];
    categories.forEach((cat) => {
      map[getCategoryKey(cat.name)] = Number(cat.slaHours) || 48;
    });
    return map;
  }, [settings]);

  const resolvedIssues = useMemo(
    () => issues.filter((issue) => issue.status === 'resolved' && issue.createdAt),
    [issues]
  );

  const overallAvgResolutionHours = useMemo(() => {
    if (!resolvedIssues.length) return 0;
    const totalHours = resolvedIssues.reduce((sum, issue) => {
      const start = new Date(issue.createdAt).getTime();
      const end = new Date(issue.resolvedAt || issue.updatedAt || issue.createdAt).getTime();
      return sum + Math.max(0, toHours(end - start));
    }, 0);
    return totalHours / resolvedIssues.length;
  }, [resolvedIssues]);

  const totalResolvedWithinSla = useMemo(() => {
    return resolvedIssues.filter((issue) => {
      const start = new Date(issue.createdAt).getTime();
      const end = new Date(issue.resolvedAt || issue.updatedAt || issue.createdAt).getTime();
      const resolutionHours = Math.max(0, toHours(end - start));
      const allowedHours = categorySlaMap[getCategoryKey(issue.category)] || 48;
      return resolutionHours <= allowedHours;
    }).length;
  }, [resolvedIssues, categorySlaMap]);

  const overallSlaPercent = resolvedIssues.length
    ? Math.round((totalResolvedWithinSla / resolvedIssues.length) * 100)
    : 0;

  const overdueOpenCount = useMemo(() => {
    return issues.filter((issue) => {
      if (issue.status === 'resolved') return false;
      const start = new Date(issue.createdAt).getTime();
      const elapsedHours = toHours(Date.now() - start);
      const allowedHours = categorySlaMap[getCategoryKey(issue.category)] || 48;
      return elapsedHours > allowedHours;
    }).length;
  }, [issues, categorySlaMap]);

  const staffRows = useMemo(() => {
    return staff
      .filter((staffMember) => staffMember.status === 'active')
      .map((staffMember) => {
        const staffIssues = issues.filter((issue) => issue.assignedTo === staffMember.email);
        const resolved = staffIssues.filter((issue) => issue.status === 'resolved');
        const active = staffIssues.filter((issue) => issue.status === 'assigned' || issue.status === 'in_progress').length;

        const resolvedWithinSla = resolved.filter((issue) => {
          const start = new Date(issue.createdAt).getTime();
          const end = new Date(issue.resolvedAt || issue.updatedAt || issue.createdAt).getTime();
          const resolutionHours = Math.max(0, toHours(end - start));
          const allowedHours = categorySlaMap[getCategoryKey(issue.category)] || 48;
          return resolutionHours <= allowedHours;
        }).length;

        const slaPercent = resolved.length ? Math.round((resolvedWithinSla / resolved.length) * 100) : 0;

        const avgResolution = resolved.length
          ? resolved.reduce((sum, issue) => {
              const start = new Date(issue.createdAt).getTime();
              const end = new Date(issue.resolvedAt || issue.updatedAt || issue.createdAt).getTime();
              return sum + Math.max(0, toHours(end - start));
            }, 0) / resolved.length
          : 0;

        return {
          id: staffMember.staffId || staffMember.email,
          name: staffMember.fullName,
          email: staffMember.email,
          department: staffMember.department,
          total: staffIssues.length,
          active,
          resolved: resolved.length,
          slaPercent,
          avgResolution,
        };
      })
      .sort((a, b) => b.slaPercent - a.slaPercent);
  }, [staff, issues, categorySlaMap]);

  const departmentBars = useMemo(() => {
    const deptMap = {};
    staffRows.forEach((row) => {
      const key = row.department || 'Unassigned';
      if (!deptMap[key]) {
        deptMap[key] = { name: key, slaPercentTotal: 0, count: 0 };
      }
      deptMap[key].slaPercentTotal += row.slaPercent;
      deptMap[key].count += 1;
    });

    return Object.values(deptMap)
      .map((dept) => ({
        name: dept.name,
        avgSlaPercent: dept.count ? Math.round(dept.slaPercentTotal / dept.count) : 0,
      }))
      .sort((a, b) => b.avgSlaPercent - a.avgSlaPercent)
      .slice(0, 6);
  }, [staffRows]);

  const trendPoints = useMemo(() => {
    const days = 7;
    const now = new Date();
    const points = [];

    for (let i = days - 1; i >= 0; i -= 1) {
      const day = new Date(now);
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - i);

      const dayStart = day.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const resolvedForDay = issues.filter((issue) => {
        if (issue.status !== 'resolved') return false;
        const resolvedTime = new Date(issue.resolvedAt || issue.updatedAt || issue.createdAt).getTime();
        return resolvedTime >= dayStart && resolvedTime < dayEnd;
      });

      const resolvedWithinSlaForDay = resolvedForDay.filter((issue) => {
        const start = new Date(issue.createdAt).getTime();
        const end = new Date(issue.resolvedAt || issue.updatedAt || issue.createdAt).getTime();
        const resolutionHours = Math.max(0, toHours(end - start));
        const allowedHours = categorySlaMap[getCategoryKey(issue.category)] || 48;
        return resolutionHours <= allowedHours;
      }).length;

      const delayedCount = Math.max(0, resolvedForDay.length - resolvedWithinSlaForDay);

      points.push({
        label: day.toLocaleDateString(undefined, { weekday: 'short' }),
        onTimeCount: resolvedWithinSlaForDay,
        delayedCount,
        resolvedCount: resolvedForDay.length,
      });
    }

    return points;
  }, [issues, categorySlaMap]);

  const trendCardData = useMemo(() => {
    const totalOnTime = trendPoints.reduce((sum, point) => sum + point.onTimeCount, 0);
    const totalDelayed = trendPoints.reduce((sum, point) => sum + point.delayedCount, 0);
    const totalResolved = trendPoints.reduce((sum, point) => sum + point.resolvedCount, 0);

    const firstDay = trendPoints[0] || { onTimeCount: 0, resolvedCount: 0 };
    const lastDay = trendPoints[trendPoints.length - 1] || { onTimeCount: 0, resolvedCount: 0 };
    const firstRate = firstDay.resolvedCount ? (firstDay.onTimeCount / firstDay.resolvedCount) * 100 : 0;
    const lastRate = lastDay.resolvedCount ? (lastDay.onTimeCount / lastDay.resolvedCount) * 100 : 0;
    const delta = Math.round(lastRate - firstRate);

    const sparkValues = trendPoints.map((point) => {
      if (!point.resolvedCount) return 0;
      return Math.round((point.onTimeCount / point.resolvedCount) * 100);
    });

    return {
      totalOnTime,
      totalDelayed,
      totalResolved,
      delta,
      sparkValues,
    };
  }, [trendPoints]);

  return (
    <DashboardShell title="SLA Monitor" subtitle="SLA %, Avg Resolution, Team Performance" roleLabel="Admin">
      <AlertMessage type="error" message={message} />

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">SLA %</p>
            <Gauge size={18} className="text-blue-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{overallSlaPercent}%</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-blue-600" style={{ width: `${overallSlaPercent}%` }} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Avg Resolution</p>
            <Timer size={18} className="text-indigo-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{formatHours(overallAvgResolutionHours)}</p>
          <p className="mt-2 text-xs font-medium text-slate-500">Resolved issues only</p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Overdue Open</p>
            <AlertTriangle size={18} className="text-red-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-red-900">{overdueOpenCount}</p>
          <p className="mt-2 text-xs font-semibold text-red-700">Needs immediate action</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active Staff</p>
            <Users size={18} className="text-emerald-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{staffRows.length}</p>
          <p className="mt-2 text-xs font-medium text-slate-500">Tracked in this dashboard</p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">SLA Trend</h3>
            <TrendingUp size={18} className="text-blue-600" />
          </div>
          <div className="overflow-hidden rounded-2xl border border-cyan-100 bg-gradient-to-b from-white to-cyan-50/60 p-4">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resolved (7 Days)</p>
                <p className="mt-1 text-4xl font-black leading-none text-slate-900">{trendCardData.totalResolved}</p>
              </div>
              <div
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${
                  trendCardData.delta >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {trendCardData.delta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {Math.abs(trendCardData.delta)}%
              </div>
            </div>

            <svg viewBox="0 0 100 34" className="h-40 w-full">
              <line x1="6" y1="28" x2="96" y2="28" stroke="#dbeafe" strokeWidth="0.8" />
              <line x1="6" y1="20" x2="96" y2="20" stroke="#e2e8f0" strokeWidth="0.6" />
              <line x1="6" y1="12" x2="96" y2="12" stroke="#e2e8f0" strokeWidth="0.6" />
              <line x1="6" y1="4" x2="96" y2="4" stroke="#e2e8f0" strokeWidth="0.6" />

              <polyline
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={trendCardData.sparkValues
                  .map((value, index) => {
                    const x = 6 + index * ((96 - 6) / Math.max(trendCardData.sparkValues.length - 1, 1));
                    const y = 28 - (value / 100) * (28 - 4);
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              {trendCardData.sparkValues.map((value, index) => {
                const x = 6 + index * ((96 - 6) / Math.max(trendCardData.sparkValues.length - 1, 1));
                const y = 28 - (value / 100) * (28 - 4);
                return <circle key={`${trendPoints[index]?.label || index}-spark`} cx={x} cy={y} r="1.4" fill="#22d3ee" />;
              })}

              {trendPoints.map((point, index) => {
                const x = 6 + index * ((96 - 6) / Math.max(trendPoints.length - 1, 1));
                return (
                  <text key={`${point.label}-axis`} x={x} y="33" textAnchor="middle" fontSize="2.8" fill="#64748b">
                    {point.label}
                  </text>
                );
              })}
            </svg>

            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-cyan-100 pt-3">
              <div className="text-center">
                <p className="text-xl font-bold text-emerald-700">{trendCardData.totalOnTime}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">On-Time</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-amber-700">{trendCardData.totalDelayed}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Delayed</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-cyan-700">
                  {trendCardData.totalResolved ? Math.round((trendCardData.totalOnTime / trendCardData.totalResolved) * 100) : 0}%
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">SLA Hit</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Department SLA</h3>
            <Clock3 size={18} className="text-indigo-600" />
          </div>
          <div className="space-y-3">
            {departmentBars.map((dept) => (
              <div key={dept.name}>
                <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span className="truncate pr-3">{dept.name}</span>
                  <span>{dept.avgSlaPercent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${dept.avgSlaPercent}%` }} />
                </div>
              </div>
            ))}
            {departmentBars.length === 0 && (
              <p className="text-xs text-slate-500">No department data</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-bold text-slate-900">Staff SLA Table</h3>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {staffRows.length} staff
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-semibold">Staff</th>
                <th className="px-5 py-3 font-semibold">Department</th>
                <th className="px-5 py-3 font-semibold">Active</th>
                <th className="px-5 py-3 font-semibold">Resolved</th>
                <th className="px-5 py-3 font-semibold">SLA %</th>
                <th className="px-5 py-3 font-semibold">Avg Resolution</th>
                <th className="px-5 py-3 font-semibold">Performance</th>
              </tr>
            </thead>
            <tbody>
              {staffRows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100 text-sm">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{row.name}</p>
                    <p className="text-xs text-slate-500">{row.email}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-700">{row.department || 'N/A'}</td>
                  <td className="px-5 py-4 font-semibold text-slate-900">{row.active}</td>
                  <td className="px-5 py-4 font-semibold text-slate-900">{row.resolved}</td>
                  <td className="px-5 py-4">
                    <div className="w-28">
                      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
                        <span>{row.slaPercent}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-2 rounded-full ${
                            row.slaPercent >= 90
                              ? 'bg-emerald-500'
                              : row.slaPercent >= 75
                                ? 'bg-blue-500'
                                : row.slaPercent >= 60
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                          }`}
                          style={{ width: `${row.slaPercent}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-900">{formatHours(row.avgResolution)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getPerfColor(row.slaPercent)}`}>
                      {getPerfLabel(row.slaPercent)}
                    </span>
                  </td>
                </tr>
              ))}
              {staffRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500">
                    No staff SLA data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
