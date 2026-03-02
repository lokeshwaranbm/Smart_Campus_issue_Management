import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import FormField from '../../components/auth/FormField';
import SelectField from '../../components/auth/SelectField';
import AlertMessage from '../../components/auth/AlertMessage';
import { getIssueById, updateIssueStatus, addIssueRemark } from '../../utils/issues';
import { getAuthSession } from '../../utils/auth';
import { ISSUE_STATUS, ISSUE_PRIORITIES } from '../../constants/issues';

export default function MaintenanceIssueDetailPage() {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const session = getAuthSession();

  const issue = useMemo(() => getIssueById(issueId), [issueId]);
  const [newStatus, setNewStatus] = useState(issue?.status || '');
  const [remark, setRemark] = useState('');
  const [message, setMessage] = useState('');

  if (!issue) {
    return (
      <DashboardShell title="Issue Not Found" subtitle="" roleLabel="Maintenance">
        <div className="text-center">
          <p className="text-slate-600">Issue not found.</p>
          <button
            onClick={() => navigate('/dashboard/maintenance')}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft size={16} className="text-primary" />
            Back to Dashboard
          </button>
        </div>
      </DashboardShell>
    );
  }

  const handleStatusUpdate = () => {
    if (!newStatus) {
      setMessage('Please select a status.');
      return;
    }

    const result = updateIssueStatus(issueId, newStatus, session?.email);
    if (result.ok) {
      setMessage('Status updated successfully.');
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setMessage(result.message);
    }
  };

  const handleAddRemark = () => {
    if (!remark.trim()) {
      setMessage('Remark cannot be empty.');
      return;
    }

    const result = addIssueRemark(issueId, remark, session?.email);
    if (result.ok) {
      setRemark('');
      window.location.reload();
    } else {
      setMessage(result.message);
    }
  };

  const priorityColor = ISSUE_PRIORITIES.find((p) => p.value === issue.priority)?.color || '';
  const statusLabel = ISSUE_STATUS.find((s) => s.value === issue.status)?.label || issue.status;

  const canResolve = issue.status !== 'resolved';

  return (
    <DashboardShell title={`Issue: ${issue.id}`} subtitle={issue.title} roleLabel="Maintenance">
      <button
        onClick={() => navigate('/dashboard/maintenance')}
        className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <ArrowLeft size={16} className="text-primary" />
        Back to Dashboard
      </button>

      <AlertMessage message={message} />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-card border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Issue Details</h2>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Category</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{issue.category}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Description</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{issue.description}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Location</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{issue.location}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Reported By</p>
                <p className="mt-1 text-sm text-slate-900">{issue.studentName}</p>
              </div>
            </div>
          </div>

          <div className="rounded-card border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Work Notes</h2>

            <div className="mb-4 space-y-3">
              {issue.remarks?.length > 0 ? (
                issue.remarks.map((r, idx) => (
                  <div key={idx} className="border-l-2 border-blue-300 bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-600">{r.authorEmail.split('@')[0]}</p>
                    <p className="mt-1 text-sm text-slate-700">{r.text}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(r.timestamp).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-600">No notes yet. Add progress updates below.</p>
              )}
            </div>

            <div className="space-y-2">
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Add work notes or updates..."
                rows={3}
                className="input-field"
              />
              <button
                onClick={handleAddRemark}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Send size={16} />
                Add Note
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-card border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="mb-4 font-semibold text-slate-900">Status & Details</h2>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Current Status</p>
                <p className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-semibold ${ISSUE_STATUS.find((s) => s.value === issue.status)?.color}`}>
                  {statusLabel}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Priority</p>
                <p className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-semibold ${priorityColor}`}>
                  {ISSUE_PRIORITIES.find((p) => p.value === issue.priority)?.label}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Assigned Since</p>
                <p className="mt-1 text-sm text-slate-600">{new Date(issue.assignedAt || issue.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="rounded-card border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="mb-4 font-semibold text-slate-900">Update Status</h2>

            <div className="space-y-3">
              <SelectField
                id="newStatus"
                label="Change Status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                options={[{ value: 'in_progress', label: 'In Progress' }, { value: 'resolved', label: 'Resolved' }]}
                placeholder="Select status"
              />

              <button onClick={handleStatusUpdate} className="primary-button">
                <CheckCircle2 size={16} className="inline mr-2" />
                Update Status
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
