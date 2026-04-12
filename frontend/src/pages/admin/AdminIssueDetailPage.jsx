import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MapPin, ExternalLink } from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import SelectField from '../../components/auth/SelectField';
import AlertMessage from '../../components/auth/AlertMessage';
import {
  getIssueById,
  updateIssueStatus,
  addIssueRemark,
} from '../../utils/issues';
import { getAuthSession } from '../../utils/auth';
import { ISSUE_STATUS, ISSUE_PRIORITIES } from '../../constants/issues';
import {
  parseLocationCoordinates,
  getLocationMapUrl,
  getLocationEmbedUrl,
  formatLocationCoordinates,
} from '../../utils/location';

export default function AdminIssueDetailPage() {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const session = getAuthSession();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [remark, setRemark] = useState('');
  const [message, setMessage] = useState('');

  const loadIssue = () => {
    setLoading(true);
    getIssueById(issueId)
      .then((data) => {
        setIssue(data);
        setNewStatus(data?.status || '');
      })
      .catch(() => setIssue(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadIssue(); }, [issueId]);

  if (loading) {
    return (
      <DashboardShell title="Loading…" subtitle="" roleLabel="Admin">
        <p className="text-slate-600">Loading issue…</p>
      </DashboardShell>
    );
  }

  if (!issue) {
    return (
      <DashboardShell title="Issue Not Found" subtitle="" roleLabel="Admin">
        <div className="text-center">
          <p className="text-slate-600">Issue not found.</p>
          <button
            onClick={() => navigate('/admin/issues')}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft size={16} className="text-primary" />
            Back to Issues
          </button>
        </div>
      </DashboardShell>
    );
  }

  const handleStatusUpdate = async () => {
    if (!newStatus) {
      setMessage('Please select a status.');
      return;
    }

    await updateIssueStatus(issueId, newStatus, session?.email);
    setMessage('Status updated successfully.');
    setTimeout(() => loadIssue(), 1500);
  };

  const handleAddRemark = async () => {
    if (!remark.trim()) {
      setMessage('Remark cannot be empty.');
      return;
    }

    await addIssueRemark(issueId, remark, session?.email);
    setRemark('');
    loadIssue();
  };

  const priorityColor = ISSUE_PRIORITIES.find((p) => p.value === issue.priority)?.color || '';
  const statusLabel = ISSUE_STATUS.find((s) => s.value === issue.status)?.label || issue.status;
  const showPriority = issue.status !== 'resolved';
  const coordinates = parseLocationCoordinates(issue.location);
  const mapUrl = coordinates ? getLocationMapUrl(coordinates.latitude, coordinates.longitude) : '';
  const mapEmbedUrl = coordinates ? getLocationEmbedUrl(coordinates.latitude, coordinates.longitude) : '';

  return (
    <DashboardShell title={`Issue: ${issue.id}`} subtitle={issue.title} roleLabel="Admin">
      <button
        onClick={() => navigate('/admin/issues')}
        className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <ArrowLeft size={16} className="text-primary" />
        Back to Issues
      </button>

      <AlertMessage message={message} />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6 lg:sticky lg:top-28 lg:self-start lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-1">
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

              {issue.imageUrl && (
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Uploaded Photo</p>
                  <a
                    href={issue.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block overflow-hidden rounded-lg border border-slate-200 bg-slate-50 transition hover:border-blue-300"
                    title="Open full image"
                  >
                    <img
                      src={issue.imageUrl}
                      alt={`Issue ${issue.id} uploaded evidence`}
                      className="h-56 w-full object-cover"
                      loading="lazy"
                    />
                  </a>
                  <p className="mt-2 text-xs text-slate-500">Click the image to open full size.</p>
                </div>
              )}

              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Location</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{issue.location}</p>
              </div>

              {(issue.blockNumber || issue.floorNumber) && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-medium uppercase text-slate-500">Campus Spot</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    Block: {issue.blockNumber || 'N/A'} | Floor: {issue.floorNumber || 'N/A'}
                  </p>
                </div>
              )}

              {coordinates && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-slate-800">
                      <MapPin size={16} className="text-primary" />
                      <p className="text-sm font-semibold">Location Tracker</p>
                    </div>
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      Open in Maps
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  <p className="mb-2 text-xs text-slate-500">
                    Coordinates: {formatLocationCoordinates(coordinates.latitude, coordinates.longitude)}
                  </p>
                  <iframe
                    title={`Issue ${issue.id} map view`}
                    src={mapEmbedUrl}
                    className="h-52 w-full rounded-md border border-slate-200"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}

              {!coordinates && issue.location && (
                <p className="text-xs text-slate-500">Map preview unavailable for this location format.</p>
              )}

              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Reported By</p>
                <p className="mt-1 text-sm text-slate-900">
                  {issue.studentName} ({issue.studentEmail})
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Reported On</p>
                <p className="mt-1 text-sm text-slate-600">{new Date(issue.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="rounded-card border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Remarks & Updates</h2>

            <div className="mb-4 space-y-3">
              {issue.remarks?.length > 0 ? (
                issue.remarks.map((r, idx) => (
                  <div key={idx} className="border-l-2 border-blue-300 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">{r.authorEmail}</p>
                    <p className="mt-1 text-sm text-slate-700">{r.text}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(r.timestamp).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-600">No remarks yet.</p>
              )}
            </div>

            <div className="space-y-2">
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Add a remark..."
                rows={3}
                className="input-field"
              />
              <button onClick={handleAddRemark} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                <Send size={16} />
                Add Remark
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-card border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="mb-4 font-semibold text-slate-900">{showPriority ? 'Status & Priority' : 'Status'}</h2>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Current Status</p>
                <p className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-semibold ${ISSUE_STATUS.find((s) => s.value === issue.status)?.color}`}>
                  {statusLabel}
                </p>
              </div>

              {showPriority && (
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Priority</p>
                  <p className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-semibold ${priorityColor}`}>
                    {ISSUE_PRIORITIES.find((p) => p.value === issue.priority)?.label}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-card border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="mb-4 font-semibold text-slate-900">Update Status</h2>

            <div className="space-y-3">
              <SelectField
                id="newStatus"
                label="New Status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                options={ISSUE_STATUS}
                placeholder="Select status"
              />

              <button onClick={handleStatusUpdate} className="primary-button">
                Update Status
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
