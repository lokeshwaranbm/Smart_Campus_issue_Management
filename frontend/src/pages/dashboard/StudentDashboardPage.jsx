import { ClipboardList, CircleCheckBig, Clock3 } from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import StatsCard from '../../components/dashboard/StatsCard';

export default function StudentDashboardPage() {
  return (
    <DashboardShell
      title="Student Dashboard"
      subtitle="Track issue reports and status updates"
      roleLabel="Student"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard label="Total Reports" value="12" icon={<ClipboardList size={16} />} tone="blue" />
        <StatsCard label="In Progress" value="4" icon={<Clock3 size={16} />} tone="amber" />
        <StatsCard label="Resolved" value="8" icon={<CircleCheckBig size={16} />} tone="emerald" />
      </div>

      <div className="mt-6 rounded-card border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="text-base font-semibold text-slate-900">Recent Updates</h2>
        <p className="mt-2 text-sm text-slate-600">
          Dashboard placeholder ready for student issue history and timeline integration.
        </p>
      </div>
    </DashboardShell>
  );
}
