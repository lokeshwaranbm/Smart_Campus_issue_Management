import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, Zap, CheckCircle, ArrowLeft } from 'lucide-react';
import AlertMessage from '../../components/auth/AlertMessage';

export default function StaffMyAssignedIssuesPage() {
  const navigate = useNavigate();
  const [assignedIssues, setAssignedIssues] = useState([]);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all'); // all, overdue, critical, completed

  useEffect(() => {
    fetchAssignedIssues();

    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchAssignedIssues, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAssignedIssues = async () => {
    try {
      // TODO: Replace with actual API endpoint
      setAssignedIssues([
        {
          _id: '1',
          issueId: {
            _id: 'issue-1',
            title: 'Broken Door Lock - Room 201',
            status: 'in_progress',
            studentName: 'Alice Johnson',
          },
          categoryId: { name: 'Maintenance' },
          slaDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000),
          escalationLevel: 0,
          isOverdue: false,
        },
        {
          _id: '2',
          issueId: {
            _id: 'issue-2',
            title: 'Electrical Short Circuit - Lab A',
            status: 'submitted',
            studentName: 'Bob Smith',
          },
          categoryId: { name: 'Electrical' },
          slaDeadline: new Date(Date.now() - 3 * 60 * 60 * 1000),
          escalationLevel: 1,
          isOverdue: true,
        },
      ]);
    } catch (error) {
      setMessage('Failed to load assigned issues: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      submitted: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
    };
    return badges[status] || 'bg-slate-100 text-slate-800';
  };

  const getSLAIndicator = (deadline, isOverdue, escalationLevel) => {
    const now = new Date();
    const hoursRemaining = (deadline - now) / (1000 * 60 * 60);

    if (isOverdue && escalationLevel === 2) {
      return (
        <div className="flex items-center gap-2 rounded-full bg-red-100 px-3 py-1">
          <Zap size={14} className="text-red-600" />
          <span className="text-xs font-semibold text-red-800">CRITICAL</span>
          <span className="text-xs text-red-700">{Math.abs(Math.round(hoursRemaining))}h overdue</span>
        </div>
      );
    }

    if (isOverdue && escalationLevel === 1) {
      return (
        <div className="flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1">
          <AlertTriangle size={14} className="text-orange-600" />
          <span className="text-xs font-semibold text-orange-800">OVERDUE</span>
          <span className="text-xs text-orange-700">{Math.abs(Math.round(hoursRemaining))}h</span>
        </div>
      );
    }

    if (hoursRemaining < 4) {
      return (
        <div className="flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1">
          <Clock size={14} className="text-yellow-600" />
          <span className="text-xs font-semibold text-yellow-800">URGENT</span>
          <span className="text-xs text-yellow-700">{Math.round(hoursRemaining)}h left</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1">
        <Clock size={14} className="text-green-600" />
        <span className="text-xs font-semibold text-green-800">ON TRACK</span>
        <span className="text-xs text-green-700">{Math.round(hoursRemaining)}h left</span>
      </div>
    );
  };

  // Filter issues
  const filteredIssues = assignedIssues.filter((issue) => {
    if (filter === 'overdue') return issue.isOverdue && issue.escalationLevel === 1;
    if (filter === 'critical') return issue.escalationLevel === 2;
    if (filter === 'completed') return issue.issueId.status === 'resolved';
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate('/dashboard/maintenance')}
          className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} className="text-primary" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Assigned Issues</h1>
          <p className="mt-2 text-slate-600">Track your assignments with SLA deadlines</p>
        </div>

        <AlertMessage message={message} />

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {['all', 'overdue', 'critical', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                filter === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-300 hover:border-blue-500'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Issues Grid */}
        {filteredIssues.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
            <p className="text-lg font-semibold text-slate-900">All Caught Up!</p>
            <p className="mt-2 text-slate-600">No issues to display in this category.</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-1">
            {filteredIssues.map((issue) => (
              <div
                key={issue._id}
                className={`rounded-lg border shadow-md overflow-hidden transition ${
                  issue.escalationLevel === 2
                    ? 'border-red-300 bg-red-50'
                    : issue.isOverdue
                    ? 'border-orange-300 bg-orange-50'
                    : 'border-slate-200 bg-white hover:shadow-lg'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900">{issue.issueId.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">Issue: {issue.issueId._id}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(
                          issue.issueId.status
                        )}`}
                      >
                        {issue.issueId.status.replace('_', ' ')}
                      </span>

                      {getSLAIndicator(new Date(issue.slaDeadline), issue.isOverdue, issue.escalationLevel)}
                    </div>
                  </div>

                  <div className="mb-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Category:</span>
                      <span className="font-semibold text-slate-900">{issue.categoryId.name}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Reported by:</span>
                      <span className="font-semibold text-slate-900">{issue.issueId.studentName}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">SLA Deadline:</span>
                      <span className="font-semibold text-slate-900">
                        {new Date(issue.slaDeadline).toLocaleDateString()} {new Date(issue.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-slate-200">
                    <button className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                      View Details
                    </button>
                    <button className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      Update Status
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
