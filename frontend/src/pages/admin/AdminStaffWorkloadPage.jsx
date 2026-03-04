import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Clock, CheckCircle2, AlertTriangle, FileText, Calendar, X, ExternalLink, MapPin, RefreshCw } from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { getStaffAccounts } from '../../utils/auth';
import { getIssues } from '../../utils/issues';
import { ISSUE_CATEGORIES } from '../../constants/issues';

export default function AdminStaffWorkloadPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const staffWorkload = useMemo(() => {
    const staff = getStaffAccounts();
    const issues = getIssues();

    return staff.map((staffMember) => {
      const assignedIssues = issues.filter((issue) => issue.assignedTo === staffMember.email);
      
      const pending = assignedIssues.filter((i) => i.status === 'assigned').length;
      const inProgress = assignedIssues.filter((i) => i.status === 'in_progress').length;
      const completed = assignedIssues.filter((i) => i.status === 'resolved').length;
      const total = assignedIssues.length;

      // Calculate overdue issues (more than 48 hours old and not resolved)
      const overdue = assignedIssues.filter((issue) => {
        if (issue.status === 'resolved') return false;
        const createdAt = new Date(issue.createdAt).getTime();
        const now = Date.now();
        const hoursElapsed = (now - createdAt) / (1000 * 60 * 60);
        return hoursElapsed > 48;
      }).length;

      // Calculate completion rate
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Get categories
      const categories = (staffMember.assignedCategories || []).map((cat) => {
        if (typeof cat === 'string') {
          return ISSUE_CATEGORIES.find((c) => c.value === cat)?.label || cat;
        }
        return cat.label || cat.name || cat;
      });

      // Latest activity
      const sortedIssues = assignedIssues.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      const latestActivity = sortedIssues[0]?.updatedAt || staffMember.createdAt;

      return {
        email: staffMember.email,
        name: staffMember.fullName,
        status: staffMember.status,
        department: staffMember.department,
        categories,
        total,
        pending,
        inProgress,
        completed,
        overdue,
        completionRate,
        latestActivity,
        phoneNumber: staffMember.phoneNumber,
        assignedIssues: assignedIssues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      };
    });
  }, [refreshKey]);

  const filteredStaff = useMemo(() => {
    return staffWorkload.filter((staff) => {
      const matchesSearch =
        staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.department.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && staff.status === 'active') ||
        (statusFilter === 'inactive' && staff.status !== 'active');

      return matchesSearch && matchesStatus;
    });
  }, [staffWorkload, searchQuery, statusFilter]);

  const getProgressBarColor = (completionRate) => {
    if (completionRate >= 80) return 'bg-emerald-500';
    if (completionRate >= 50) return 'bg-blue-500';
    if (completionRate >= 30) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusConfig = (status) => {
    const configs = {
      assigned: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
      in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
      resolved: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
      submitted: { label: 'Submitted', color: 'bg-slate-100 text-slate-700' },
    };
    return configs[status] || { label: status, color: 'bg-slate-100 text-slate-700' };
  };

  const handleCardClick = (staff) => {
    setSelectedStaff(staff);
  };

  const closeModal = () => {
    setSelectedStaff(null);
  };

  return (
    <DashboardShell
      title="Staff Workload Tracking"
      subtitle="Monitor staff assignments and progress"
      roleLabel="Admin"
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/dashboard/admin')}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} className="text-primary" />
          Back to Dashboard
        </button>
        
        <button
          onClick={() => setRefreshKey(prev => prev + 1)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          title="Refresh workload data"
        >
          <RefreshCw size={16} className="text-primary" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-card border border-slate-200 bg-white p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Staff</p>
              <p className="text-2xl font-bold text-slate-900">{staffWorkload.length}</p>
            </div>
            <div className="rounded-lg bg-blue-100 p-3">
              <User size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-card border border-slate-200 bg-white p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Active Staff</p>
              <p className="text-2xl font-bold text-slate-900">
                {staffWorkload.filter((s) => s.status === 'active').length}
              </p>
            </div>
            <div className="rounded-lg bg-emerald-100 p-3">
              <CheckCircle2 size={24} className="text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="rounded-card border border-slate-200 bg-white p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Assignments</p>
              <p className="text-2xl font-bold text-slate-900">
                {staffWorkload.reduce((sum, s) => sum + s.total, 0)}
              </p>
            </div>
            <div className="rounded-lg bg-amber-100 p-3">
              <FileText size={24} className="text-amber-600" />
            </div>
          </div>
        </div>

        <div className="rounded-card border border-slate-200 bg-white p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Overdue Issues</p>
              <p className="text-2xl font-bold text-slate-900">
                {staffWorkload.reduce((sum, s) => sum + s.overdue, 0)}
              </p>
            </div>
            <div className="rounded-lg bg-red-100 p-3">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-card border border-slate-200 bg-white p-4 shadow-card">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <input
              type="text"
              placeholder="Search by name, email, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Cards */}
      {filteredStaff.length === 0 ? (
        <div className="rounded-card border border-slate-200 bg-white p-12 text-center shadow-card">
          <User size={48} className="mx-auto mb-3 text-slate-400" />
          <p className="text-sm text-slate-600">No staff members found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStaff.map((staff) => (
            <div
              key={staff.email}
              onClick={() => handleCardClick(staff)}
              className="cursor-pointer rounded-card border border-slate-200 bg-white p-6 shadow-card transition hover:shadow-lg hover:border-primary"
            >
              {/* Staff Header */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <User size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{staff.name}</h3>
                    <p className="text-xs text-slate-500">{staff.email}</p>
                  </div>
                </div>
                {staff.status === 'active' ? (
                  <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Active
                  </span>
                ) : (
                  <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    Inactive
                  </span>
                )}
              </div>

              {/* Department & Categories */}
              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-slate-700">Department:</span>
                  <span className="text-slate-600">{staff.department}</span>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-700">Categories:</p>
                  <div className="flex flex-wrap gap-1">
                    {staff.categories.length > 0 ? (
                      staff.categories.map((cat, idx) => (
                        <span
                          key={idx}
                          className="inline-block rounded bg-slate-100 px-2 py-1 text-xs text-slate-700"
                        >
                          {cat}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">No categories assigned</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="mb-4 grid grid-cols-4 gap-2">
                <div className="rounded-lg bg-slate-50 p-2 text-center">
                  <p className="text-xs text-slate-600">Total</p>
                  <p className="text-lg font-bold text-slate-900">{staff.total}</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-2 text-center">
                  <p className="text-xs text-amber-600">Pending</p>
                  <p className="text-lg font-bold text-amber-700">{staff.pending}</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-2 text-center">
                  <p className="text-xs text-blue-600">Active</p>
                  <p className="text-lg font-bold text-blue-700">{staff.inProgress}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-2 text-center">
                  <p className="text-xs text-emerald-600">Done</p>
                  <p className="text-lg font-bold text-emerald-700">{staff.completed}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Completion Rate</span>
                  <span className="text-xs font-bold text-slate-900">{staff.completionRate}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-200">
                  <div
                    className={`h-2.5 rounded-full transition-all ${getProgressBarColor(staff.completionRate)}`}
                    style={{ width: `${staff.completionRate}%` }}
                  />
                </div>
              </div>

              {/* Overdue & Last Activity */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
                {staff.overdue > 0 ? (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertTriangle size={14} />
                    <span className="font-semibold">{staff.overdue} Overdue</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 size={14} />
                    <span className="font-semibold">On Track</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-slate-500">
                  <Clock size={12} />
                  <span>{formatDate(staff.latestActivity)}</span>
                </div>
              </div>

              {/* Click indicator */}
              <div className="mt-4 flex items-center justify-center gap-1 text-xs text-primary font-semibold">
                <span>Click to view assigned work</span>
                <ExternalLink size={12} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Issue Detail Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedStaff.name}</h2>
                  <p className="text-sm text-slate-600">Assigned Work & Progress</p>
                </div>
                <button
                  onClick={closeModal}
                  className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Summary Stats */}
              <div className="mt-4 grid grid-cols-4 gap-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-600">Total Issues</p>
                  <p className="text-2xl font-bold text-slate-900">{selectedStaff.total}</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-3">
                  <p className="text-xs text-amber-600">Pending</p>
                  <p className="text-2xl font-bold text-amber-700">{selectedStaff.pending}</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="text-xs text-blue-600">In Progress</p>
                  <p className="text-2xl font-bold text-blue-700">{selectedStaff.inProgress}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-3">
                  <p className="text-xs text-emerald-600">Completed</p>
                  <p className="text-2xl font-bold text-emerald-700">{selectedStaff.completed}</p>
                </div>
              </div>
            </div>

            {/* Modal Body - Issue List */}
            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 240px)' }}>
              {selectedStaff.assignedIssues.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText size={48} className="mx-auto mb-3 text-slate-400" />
                  <p className="text-sm text-slate-600">No issues assigned yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedStaff.assignedIssues.map((issue) => {
                    const statusConfig = getStatusConfig(issue.status);
                    const isOverdue =
                      issue.status !== 'resolved' &&
                      (Date.now() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60) > 48;

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
                              <div className="flex items-center gap-2">
                                <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusConfig.color}`}>
                                  {statusConfig.label}
                                </span>
                                {isOverdue && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                                    <AlertTriangle size={12} />
                                    Overdue
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Description */}
                            <p className="mb-3 text-sm text-slate-600 line-clamp-2">{issue.description}</p>

                            {/* Issue Details */}
                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                              <div className="flex items-center gap-1">
                                <MapPin size={12} />
                                <span>{issue.location || 'No location'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar size={12} />
                                <span>Created {formatDate(issue.createdAt)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User size={12} />
                                <span>{issue.studentName || 'Unknown'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock size={12} />
                                <span>Updated {formatDate(issue.updatedAt)}</span>
                              </div>
                            </div>
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
