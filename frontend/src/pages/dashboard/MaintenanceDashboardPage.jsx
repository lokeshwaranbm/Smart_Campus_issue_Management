import { Hammer, CircleCheckBig, Clock3 } from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import StatsCard from '../../components/dashboard/StatsCard';

export default function MaintenanceDashboardPage() {
  return (
    <DashboardShell
      title="Assigned Issues Dashboard"
      subtitle="View and manage assigned campus maintenance tasks"
      roleLabel="Maintenance"
    >
      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
        Account status: Active
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard label="Assigned Issues" value="9" icon={<Hammer size={16} />} tone="blue" />
        <StatsCard label="In Progress" value="3" icon={<Clock3 size={16} />} tone="amber" />
        <StatsCard label="Resolved" value="6" icon={<CircleCheckBig size={16} />} tone="emerald" />
      </div>

      <div className="mt-6 rounded-card border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="text-base font-semibold text-slate-900">Work Queue</h2>
        <p className="mt-2 text-sm text-slate-600">
          Dashboard placeholder ready for issue assignment list and status updates.
        </p>
      </div>
    </DashboardShell>
  );
}
