import { useMemo, useState } from 'react';
import { TrendingUp, Clock, CheckCircle, AlertCircle, Users, BarChart3 } from 'lucide-react';

export default function StaffPerformanceDashboard({ onClose, staffList = [] }) {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const staffStats = useMemo(
    () =>
      staffList.map((item) => ({
        name: item.name,
        completedIssues: item.stats?.completedIssues || 0,
        activeIssues: item.stats?.activeIssues || 0,
        overdueIssues: item.stats?.overdueIssues || 0,
        slaCompliancePercent: item.stats?.slaCompliancePercent || 0,
        averageResolutionHours: Number(item.stats?.averageResolutionHours || 0),
        workload: (item.stats?.completedIssues || 0) + (item.stats?.activeIssues || 0),
      })),
    [staffList]
  );

  const totalCompleted = staffStats.reduce((sum, s) => sum + s.completedIssues, 0);
  const totalActive = staffStats.reduce((sum, s) => sum + s.activeIssues, 0);
  const totalOverdue = staffStats.reduce((sum, s) => sum + s.overdueIssues, 0);
  const avgSLA = staffStats.length > 0 ? Math.round(staffStats.reduce((sum, s) => sum + s.slaCompliancePercent, 0) / staffStats.length) : 0;
  const avgResolutionTime = staffStats.length > 0 ? (staffStats.reduce((sum, s) => sum + s.averageResolutionHours, 0) / staffStats.length).toFixed(1) : 0;

  const getSLAColor = (sla) => {
    if (sla >= 90) return 'bg-green-100 text-green-700';
    if (sla >= 70) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getWorkloadBar = (workload, max = 60) => {
    return (workload / max) * 100;
  };

  const sortedStaffStats = useMemo(() => {
    const list = [...staffStats];

    switch (selectedFilter) {
      case 'sla-high':
        return list.sort((a, b) => b.slaCompliancePercent - a.slaCompliancePercent);
      case 'sla-low':
        return list.sort((a, b) => a.slaCompliancePercent - b.slaCompliancePercent);
      case 'workload-high':
        return list.sort((a, b) => b.workload - a.workload);
      case 'overdue':
        return list.sort((a, b) => b.overdueIssues - a.overdueIssues);
      default:
        return list;
    }
  }, [staffStats, selectedFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
      <div className="mx-auto w-full max-w-7xl rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-white">
          <div className="flex items-center gap-3">
            <BarChart3 size={28} className="text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">Staff Performance Dashboard</h2>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              ✕
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600">Total Staff</p>
                  <p className="text-2xl font-bold text-slate-900">{staffStats.length}</p>
                </div>
                <Users size={32} className="text-blue-200" />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-green-50 to-green-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-600">Issues Completed</p>
                  <p className="text-2xl font-bold text-slate-900">{totalCompleted}</p>
                </div>
                <CheckCircle size={32} className="text-green-200" />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-orange-50 to-orange-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-orange-600">Active Now</p>
                  <p className="text-2xl font-bold text-slate-900">{totalActive}</p>
                </div>
                <Clock size={32} className="text-orange-200" />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-red-50 to-red-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-red-600">Overdue</p>
                  <p className="text-2xl font-bold text-slate-900">{totalOverdue}</p>
                </div>
                <AlertCircle size={32} className="text-red-200" />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-purple-50 to-purple-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-purple-600">Avg SLA %</p>
                  <p className="text-2xl font-bold text-slate-900">{avgSLA}%</p>
                </div>
                <TrendingUp size={32} className="text-purple-200" />
              </div>
            </div>
          </div>

          {/* Filter */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Sort By:
            </label>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Staff</option>
              <option value="sla-high">Highest SLA %</option>
              <option value="sla-low">Lowest SLA %</option>
              <option value="workload-high">Highest Workload</option>
              <option value="overdue">Most Overdue</option>
            </select>
          </div>

          {/* Staff Performance Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Staff Member</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">Completed</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">Active</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">Overdue</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">SLA %</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">Avg Resolution</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Workload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedStaffStats.map((staff, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{staff.name}</td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-green-600">
                      {staff.completedIssues}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-orange-600">
                      {staff.activeIssues}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-red-600">
                      {staff.overdueIssues}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${getSLAColor(
                          staff.slaCompliancePercent
                        )}`}
                      >
                        {staff.slaCompliancePercent}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-slate-900">
                      {staff.averageResolutionHours}h
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${getWorkloadBar(staff.workload)}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{staff.workload} issues</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Performance Insights */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h4 className="font-semibold text-slate-900 mb-3">Top Performer</h4>
              {staffStats.length > 0 ? (
                <div>
                  <p className="text-lg font-bold text-slate-900">
                    {staffStats.reduce((max, s) => (s.slaCompliancePercent > max.slaCompliancePercent ? s : max)).name}
                  </p>
                  <p className="text-sm text-slate-600">
                    {staffStats.reduce((max, s) => (s.slaCompliancePercent > max.slaCompliancePercent ? s : max)).slaCompliancePercent}% SLA Compliance
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-600">No staff data available.</p>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h4 className="font-semibold text-slate-900 mb-3">Avg Response Time</h4>
              <p className="text-lg font-bold text-slate-900">{avgResolutionTime}h</p>
              <p className="text-sm text-slate-600">Average across all staff</p>
            </div>
          </div>

          {onClose && (
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                onClick={onClose}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Close Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
