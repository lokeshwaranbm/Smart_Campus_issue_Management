import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, UserRound, ShieldCheck, ShieldX, Trash2 } from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import AlertMessage from '../../components/auth/AlertMessage';
import {
  getReporterAccounts,
  updateReporterStatus,
  deleteReporterAccount,
} from '../../utils/auth';

export default function AdminReporterManagementPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [refreshKey, setRefreshKey] = useState(0);

  const reporters = useMemo(() => getReporterAccounts(), [refreshKey]);

  const filteredReporters = useMemo(() => {
    let list = [...reporters];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.fullName?.toLowerCase().includes(query) ||
          r.email?.toLowerCase().includes(query) ||
          r.registerNumber?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      list = list.filter((r) => (r.status || 'active') === statusFilter);
    }

    return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [reporters, searchQuery, statusFilter]);

  const activeCount = reporters.filter((r) => (r.status || 'active') === 'active').length;
  const disabledCount = reporters.filter((r) => (r.status || 'active') !== 'active').length;

  const handleToggleStatus = (reporter) => {
    const currentStatus = reporter.status || 'active';
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const actionLabel = nextStatus === 'active' ? 'enable' : 'disable';

    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabel} login for ${reporter.fullName}?`
    );
    if (!confirmed) return;

    const result = updateReporterStatus(reporter.email, nextStatus);
    if (!result.ok) {
      setMessageType('error');
      setMessage(result.message);
      return;
    }

    setMessageType(nextStatus === 'active' ? 'success' : 'warning');
    setMessage(
      nextStatus === 'active'
        ? `${reporter.fullName} login access enabled.`
        : `${reporter.fullName} login access disabled.`
    );
    setRefreshKey((prev) => prev + 1);
  };

  const handleDeleteReporter = (reporter) => {
    const confirmed = window.confirm(`Delete reporter account for ${reporter.fullName}?`);
    if (!confirmed) return;

    const result = deleteReporterAccount(reporter.email);
    if (!result.ok) {
      setMessageType('error');
      setMessage(result.message);
      return;
    }

    setMessageType('success');
    setMessage(`Reporter account ${reporter.fullName} deleted.`);
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <DashboardShell
      title="Reporter Management"
      subtitle="Manage reporter login accounts and access controls"
      roleLabel="Admin"
    >
      <button
        onClick={() => navigate('/dashboard/admin')}
        className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <ArrowLeft size={16} className="text-primary" />
        Back to Dashboard
      </button>

      <AlertMessage type={messageType} message={message} />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-slate-200 bg-white p-4 shadow-card">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Reporters</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{reporters.length}</p>
        </div>
        <div className="rounded-card border border-emerald-200 bg-emerald-50 p-4 shadow-card">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Active Logins</p>
          <p className="mt-2 text-2xl font-bold text-emerald-800">{activeCount}</p>
        </div>
        <div className="rounded-card border border-red-200 bg-red-50 p-4 shadow-card">
          <p className="text-xs font-medium uppercase tracking-wide text-red-700">Disabled Logins</p>
          <p className="mt-2 text-2xl font-bold text-red-800">{disabledCount}</p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or register number"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Disabled</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-card border border-slate-200 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-800">Reporter</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-800">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-800">Register No</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-800">Department</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-800">Status</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-800">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReporters.map((reporter) => {
              const isActive = (reporter.status || 'active') === 'active';
              return (
                <tr key={reporter.email} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <UserRound size={16} className="text-slate-500" />
                      <span className="font-semibold text-slate-900">{reporter.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{reporter.email}</td>
                  <td className="px-4 py-3 text-slate-700">{reporter.registerNumber || '-'}</td>
                  <td className="px-4 py-3 text-slate-700">{reporter.department || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(reporter)}
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          isActive
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                      >
                        {isActive ? <ShieldX size={14} /> : <ShieldCheck size={14} />}
                        {isActive ? 'Disable Login' : 'Enable Login'}
                      </button>

                      <button
                        onClick={() => handleDeleteReporter(reporter)}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-800 transition hover:bg-red-200"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredReporters.length === 0 && (
          <div className="p-10 text-center text-sm text-slate-600">No reporter accounts found.</div>
        )}
      </div>
    </DashboardShell>
  );
}
