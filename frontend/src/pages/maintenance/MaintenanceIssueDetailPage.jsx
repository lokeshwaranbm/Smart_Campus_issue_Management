import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle2, MapPin, ExternalLink, X, Download } from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import SelectField from '../../components/auth/SelectField';
import AlertMessage from '../../components/auth/AlertMessage';
import { getIssueById, updateIssueStatus, addIssueRemark } from '../../utils/issues';
import { getAuthSession } from '../../utils/auth';
import { ISSUE_STATUS, ISSUE_PRIORITIES } from '../../constants/issues';
import {
  parseLocationCoordinates,
  getLocationMapUrl,
  getLocationEmbedUrl,
  formatLocationCoordinates,
} from '../../utils/location';

export default function MaintenanceIssueDetailPage() {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const session = getAuthSession();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [remark, setRemark] = useState('');
  const [message, setMessage] = useState('');
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

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

  useEffect(() => {
    loadIssue();
  }, [issueId]);

  if (loading) {
    return (
      <DashboardShell title="Loading…" subtitle="" roleLabel="Maintenance">
        <p className="text-slate-600">Loading issue…</p>
      </DashboardShell>
    );
  }

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
    <DashboardShell title={`Issue: ${issue.id}`} subtitle={issue.title} roleLabel="Maintenance">
      <button
        onClick={() => navigate('/dashboard/maintenance')}
        className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <ArrowLeft size={16} className="text-primary" />
        Back to Dashboard
      </button>

      <AlertMessage message={message} />

      {/* Image Modal Viewer */}
      {imageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setImageModalOpen(false)}>
          <div className="relative max-h-[90vh] max-w-2xl w-full rounded-lg bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Image Viewer</h3>
              <button onClick={() => setImageModalOpen(false)} className="rounded-lg p-1 text-slate-600 hover:bg-slate-200">
                <X size={20} />
              </button>
            </div>
            {/* Image Container */}
            <div className="flex items-center justify-center bg-slate-900 px-4 py-6">
              {imageLoadError ? (
                <div className="text-center">
                  <p className="text-sm text-slate-300 mb-2">Image failed to load</p>
                  <a
                    href={issue.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <Download size={16} />
                    Download instead
                  </a>
                </div>
              ) : (
                <img
                  src={issue.imageUrl}
                  alt={`Issue ${issue.id} full view`}
                  className="max-h-[75vh] max-w-full object-contain"
                  onError={() => setImageLoadError(true)}
                />
              )}
            </div>
            {/* Footer */}
            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-center">
              <p className="text-xs text-slate-600">Issue: {issue.id}</p>
            </div>
          </div>
        </div>
      )}

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

              {issue.imageUrl && (
                <dibutton
                    onClick={() => { setImageModalOpen(true); setImageLoadError(false); }}
                    className="mt-2 block w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 transition hover:border-blue-300 hover:shadow-md"
                    type="button"
                  >
                    <img
                      src={issue.imageUrl}
                      alt={`Issue ${issue.id} uploaded evidence`}
                      className="h-56 w-full object-cover"
                      loading="lazy"
                      onError={() => setImageLoadError(true)}
                    />
                  </button>
                  <p className="mt-2 text-xs text-slate-500">Click image to view
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

              {showPriority && (
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Priority</p>
                  <p className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-semibold ${priorityColor}`}>
                    {ISSUE_PRIORITIES.find((p) => p.value === issue.priority)?.label}
                  </p>
                </div>
              )}

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
