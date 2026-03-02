import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, AlertCircle, Clock, User, Zap, ArrowRight, ArrowLeft } from 'lucide-react';
import AlertMessage from '../../components/auth/AlertMessage';

export default function AdminSLAMonitoringPage() {
  const navigate = useNavigate();
  const [overdueIssues, setOverdueIssues] = useState([]);
  const [slaStats, setSLAStats] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [reassigningId, setReassigningId] = useState(null);
  const [reassignReason, setReassignReason] = useState('');
  const [staffList, setStaffList] = useState([]);

  useEffect(() => {
    fetchOverdueIssues();
    fetchSLAStats();
    fetchStaffList();

    // Refresh every 5 minutes
    const interval = setInterval(() => {
      fetchOverdueIssues();
      fetchSLAStats();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchOverdueIssues = async () => {
    try {
      const response = await fetch('/api/admin/overdue-issues');
      const result = await response.json();

      if (result.ok) {
        setOverdueIssues(result.data);
      }
    } catch (error) {
      setMessage('Failed to load overdue issues: ' + error.message);
    }
  };

  const fetchSLAStats = async () => {
    try {
      const response = await fetch('/api/admin/sla-stats');
      const result = await response.json();

      if (result.ok) {
        setSLAStats(result.data);
      }
    } catch (error) {
      setMessage('Failed to load SLA statistics: ' + error.message);
    }
  };

  const fetchStaffList = async () => {
    try {
      // TODO: Replace with actual API call from staff endpoints
      setStaffList([
        { id: 1, name: 'John Maintenance', email: 'john@uni.edu' },
        { id: 2, name: 'Jane Electrician', email: 'jane@uni.edu' },
        { id: 3, name: 'Bob Plumber', email: 'bob@uni.edu' },
      ]);
    } catch (error) {
      setMessage('Failed to load staff: ' + error.message);
    }
  };

  const handleReassign = async (issueId, newStaffId) => {
    if (!newStaffId) {
      setMessage('Please select a staff member');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/issues/${issueId}/reassign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStaffId,
          reason: reassignReason,
        }),
      });

      const result = await response.json();

      if (result.ok) {
        setMessage('Issue reassigned successfully');
        setReassigningId(null);
        setReassignReason('');
        fetchOverdueIssues();
      } else {
        setMessage('Error: ' + result.message);
      }
    } catch (error) {
      setMessage('Failed to reassign issue: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getEscalationBadge = (level, hours) => {
    if (level === 2) {
      return (
        <div className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
          <Zap size={12} />
          CRITICAL ({hours}h overdue)
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800">
        <AlertTriangle size={12} />
        OVERDUE ({hours}h)
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate('/dashboard/admin')}
          className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} className="text-primary" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">SLA Monitoring & Escalation</h1>
          <p className="mt-2 text-slate-600">Track overdue issues and manage escalations</p>
        </div>

        <AlertMessage message={message} />

        {/* SLA Statistics */}
        {slaStats && (
          <div className="mb-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-600">Total Issues (30d)</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{slaStats.totalIssues}</p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-600">On-Time Rate</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{slaStats.onTimePercentage}%</p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-600">Completed On Time</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{slaStats.completedOnTime}</p>
            </div>

            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 shadow-sm">
              <p className="text-sm text-orange-700">Pending Issues</p>
              <p className="mt-1 text-2xl font-bold text-orange-900">{slaStats.pendingIssues}</p>
            </div>

            <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
              <p className="text-sm text-red-700">Critical Issues</p>
              <p className="mt-1 text-2xl font-bold text-red-900">{slaStats.criticalIssues}</p>
            </div>
          </div>
        )}

        {/* Overdue Issues List */}
        <div className="rounded-lg border border-slate-200 bg-white shadow-md overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Overdue & Escalated Issues</h2>
            <span className="bg-red-100 text-red-800 text-xs font-semibold px-3 py-1 rounded-full">
              {overdueIssues.length} issues
            </span>
          </div>

          {overdueIssues.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle size={32} className="mx-auto mb-3 text-slate-400" />
              <p className="text-slate-600">No overdue issues. Everything is on track!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {overdueIssues.map((issue) => (
                <div key={issue._id} className="p-6 hover:bg-slate-50 transition">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{issue.issueId?.title}</h3>
                        {getEscalationBadge(issue.escalationLevel, issue.overdueHours)}
                      </div>

                      <p className="text-sm text-slate-600">Issue ID: {issue.issueId?._id}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-4 text-sm">
                    <div>
                      <p className="text-slate-600">Category</p>
                      <p className="font-semibold text-slate-900">{issue.categoryId?.name}</p>
                    </div>

                    <div>
                      <p className="text-slate-600">Assigned to</p>
                      <p className="font-semibold text-slate-900">{issue.assignedTo?.name}</p>
                      <p className="text-xs text-slate-500">{issue.assignedTo?.email}</p>
                    </div>

                    <div>
                      <p className="text-slate-600">SLA Deadline</p>
                      <p className="font-semibold text-slate-900">
                        {new Date(issue.slaDeadline).toLocaleDateString()} {new Date(issue.slaDeadline).toLocaleTimeString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-600">Overdue By</p>
                      <p className="font-semibold text-red-600">{issue.overdueHours} hours</p>
                    </div>
                  </div>

                  <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold">Student:</span> {issue.issueId?.studentName}
                    </p>
                    <p className="text-xs text-slate-600">{issue.issueId?.studentEmail}</p>
                  </div>

                  {/* Reassign Form */}
                  {reassigningId === issue._id ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Reassign to Staff
                        </label>
                        <select
                          onChange={(e) => {
                            const newStaffId = e.target.value;
                            handleReassign(issue._id, newStaffId);
                          }}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                          defaultValue=""
                        >
                          <option value="">-- Select Staff Member --</option>
                          {staffList.map((staff) => (
                            <option key={staff.id} value={staff.id}>
                              {staff.name} ({staff.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Reason for Reassignment
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Previous staff overloaded"
                          value={reassignReason}
                          onChange={(e) => setReassignReason(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setReassigningId(null)}
                          className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReassigningId(issue._id)}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      <ArrowRight size={16} />
                      Reassign Issue
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
