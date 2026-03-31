import { CircleCheckBig, Clock3, AlertTriangle, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardShell from '../../components/dashboard/DashboardShell';
import StatsCard from '../../components/dashboard/StatsCard';
import useCampusInfo from '../../hooks/useCampusInfo';

function CampusIllustration() {
  return (
    <div className="relative h-44 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="absolute inset-0 bg-blue-50/60" />
      <div className="relative flex h-full items-end justify-center">
        <div className="relative h-32 w-72">
          <div className="absolute bottom-0 left-0 h-14 w-full rounded-xl bg-blue-100 shadow-sm" />
          <div className="absolute bottom-5 left-8 h-20 w-20 rounded-lg bg-white shadow-md" />
          <div className="absolute bottom-7 left-32 h-24 w-24 rounded-lg bg-slate-100 shadow-md" />
          <div className="absolute bottom-11 left-[14.5rem] h-16 w-10 rounded-md bg-white shadow-sm" />
          <div className="absolute bottom-[6.5rem] left-12 h-2 w-10 rounded bg-primary/70" />
          <div className="absolute bottom-[7.5rem] left-36 h-2 w-12 rounded bg-primary/60" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { universityName } = useCampusInfo();

  return (
    <DashboardShell
      title="Admin Control Panel"
      subtitle="Manage users, issue workflows, and approval operations"
      roleLabel="Admin"
    >
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-card border border-slate-200 bg-white p-5 shadow-card">
          <div className="mb-4 flex items-center gap-2 text-slate-800">
            <Building2 size={18} className="text-primary" />
            <h2 className="text-base font-semibold">{universityName} Administration Dashboard</h2>
          </div>
          <CampusIllustration />
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <StatsCard label="Pending" value="18" icon={<AlertTriangle size={16} />} tone="amber" />
          <StatsCard label="In Progress" value="27" icon={<Clock3 size={16} />} tone="blue" />
          <StatsCard label="Resolved" value="142" icon={<CircleCheckBig size={16} />} tone="emerald" />
        </div>
      </div>

      <div className="mt-6 rounded-card border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="text-base font-semibold text-slate-900">Approval Queue</h2>
        <p className="mt-2 text-sm text-slate-600">
          Placeholder ready for maintenance account approvals and issue escalations.
        </p>
      </div>

      <div className="mt-6 rounded-card border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="text-base font-semibold text-slate-900">Admin Navigation</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/admin/issues" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Issues
          </Link>
          <Link to="/admin/approvals" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Approvals
          </Link>
          <Link to="/admin/categories" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Categories
          </Link>
          <Link to="/admin/sla-monitoring" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            SLA Monitoring
          </Link>
          <Link to="/admin/staff" className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-primary hover:bg-blue-100">
            Staff Management
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
