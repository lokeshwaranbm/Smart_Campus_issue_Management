import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserRound, ShieldCheck, ShieldX, Trash2, Eye, X, FileText, Clock, MapPin } from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import AlertMessage from '../../components/auth/AlertMessage';
import {
  getReporterAccounts,
  updateReporterStatus,
  deleteReporterAccount,
} from '../../utils/auth';
import { getIssues } from '../../utils/issues';

export default function AdminReporterManagementPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedReporter, setSelectedReporter] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [reporters, setReporters] = useState([]);

  useEffect(() => {
    const loadReporters = async () => {
      const reporterList = await getReporterAccounts();
      const allIssues = await getIssues();
      const enriched = reporterList.map((reporter) => {
        const reporterIssues = allIssues.filter((issue) => issue.studentEmail === reporter.email);
        return { ...reporter, issueCount: reporterIssues.length, issues: reporterIssues };
      });
      setReporters(enriched);
    };
    loadReporters();
  }, [refreshKey]);

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

  const handleToggleStatus = async (reporter) => {
    const currentStatus = reporter.status || 'active';
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const actionLabel = nextStatus === 'active' ? 'enable' : 'disable';

    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabel} login for ${reporter.fullName}?`
    );
    if (!confirmed) return;

    const result = await updateReporterStatus(reporter._id, nextStatus);
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

  const handleDeleteReporter = async (reporter) => {
    const confirmed = window.confirm(`Delete reporter account for ${reporter.fullName}?`);
    if (!confirmed) return;

    const result = await deleteReporterAccount(reporter._id);
    if (!result.ok) {
      setMessageType('error');
      setMessage(result.message);
      return;
    }

    setMessageType('success');
    setMessage(`Reporter account ${reporter.fullName} deleted.`);
    setRefreshKey((prev) => prev + 1);
  };

  const handleViewDetails = (reporter) => {
    setSelectedReporter(reporter);
    setShowDetailsModal(true);
  };

  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedReporter(null);
  };

  const getStatusBadge = (status) => {
    const configs = {
      assigned: { label: 'Assigned', color: 'bg-amber-100 text-amber-700' },
      in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
      resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-700' },
      submitted: { label: 'Submitted', color: 'bg-slate-100 text-slate-700' },
    };
    return configs[status] || configs.submitted;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

      <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="w-full xl:flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or register number"
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none sm:w-64"
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
              <th className="px-4 py-3 text-center font-semibold text-slate-800">Issues</th>
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
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                      <FileText size={12} />
                      {reporter.issueCount}
                    </span>
                  </td>
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
                        onClick={() => handleViewDetails(reporter)}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-800 transition hover:bg-blue-200"
                        title="View reporter details and issues"
                      >
                        <Eye size={14} />
                        View
                      </button>
                      
                      <button
                        onClick={() => handleToggleStatus(reporter)}
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          isActive
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                      >
                        {isActive ? <ShieldX size={14} /> : <ShieldCheck size={14} />}
                        {isActive ? 'Disable' : 'Enable'}
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

      {/* Reporter Details Modal */}
      {showDetailsModal && selectedReporter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedReporter.fullName}</h2>
                  <p className="text-sm text-slate-600">Reporter Details & Issues</p>
                </div>
                <button
                  onClick={closeModal}
                  className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Reporter Info Cards */}
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-600">Email</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selectedReporter.email}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-600">Register No</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selectedReporter.registerNumber || 'N/A'}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-600">Department</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selectedReporter.department || 'N/A'}</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="text-xs text-blue-600">Total Issues</p>
                  <p className="mt-1 text-2xl font-bold text-blue-700">{selectedReporter.issueCount}</p>
                </div>
              </div>
            </div>

            {/* Modal Body - Issues List */}
            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 240px)' }}>
              <h3 className="mb-4 text-lg font-semibold text-slate-900">Reported Issues</h3>
              
              {selectedReporter.issues.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText size={48} className="mx-auto mb-3 text-slate-400" />
                  <p className="text-sm text-slate-600">No issues reported yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedReporter.issues
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map((issue) => {
                      const statusConfig = getStatusBadge(issue.status);
                      return (
                        <div
                          key={issue.id}
                          className="rounded-lg border border-slate-200 bg-white p-4 transition hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              {/* Issue Title & ID */}
                              <div className="mb-2 flex items-start justify-between">
                                <div>
                                  <h4 className="font-semibold text-slate-900">{issue.title}</h4>
                                  <p className="text-xs text-slate-500">{issue.id}</p>
                                </div>
                                <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusConfig.color}`}>
                                  {statusConfig.label}
                                </span>
                              </div>

                              {/* Description */}
                              <p className="mb-3 text-sm text-slate-600 line-clamp-2">{issue.description}</p>

                              {/* Issue Details */}
                              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 md:grid-cols-3">
                                <div className="flex items-center gap-1">
                                  <MapPin size={12} />
                                  <span>{issue.location || 'No location'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock size={12} />
                                  <span>{formatDate(issue.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <FileText size={12} />
                                  <span className="capitalize">{issue.category || 'Unknown'}</span>
                                </div>
                              </div>

                              {/* Assigned To */}
                              {issue.assignedTo && (
                                <div className="mt-2 text-xs text-slate-600">
                                  <span className="font-semibold">Assigned to:</span> {issue.assignedTo}
                                </div>
                              )}
                            </div>

                            {/* Issue Image */}
                            {issue.imageUrl && (
                              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                                <img
                                  src={issue.imageUrl}
                                  alt={issue.title}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
