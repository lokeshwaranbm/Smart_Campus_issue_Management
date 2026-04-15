import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, MessageCircle, MapPin, Calendar, AlertCircle, Send, Heart, MessageSquare, Zap, ShieldCheck, BadgeCheck } from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import AlertMessage from '../../components/auth/AlertMessage';
import ImageViewerModal from '../../components/common/ImageViewerModal';
import { getAuthSession } from '../../utils/auth';
import { getIssueById, addComment, addSupport } from '../../utils/issues';
import { ISSUE_STATUS } from '../../constants/issues';

export default function StudentIssueDetailPage() {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const session = getAuthSession();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [message, setMessage] = useState('');
  const [imageModalOpen, setImageModalOpen] = useState(false);

  const loadIssue = () => {
    setLoading(true);
    getIssueById(issueId)
      .then(setIssue)
      .catch(() => setIssue(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadIssue(); }, [issueId]);

  const isSupported = issue?.supportedBy?.includes(session?.email) ?? false;
  const comments = issue?.comments ?? [];

  if (loading) {
    return (
      <DashboardShell title="Loading…" roleLabel="Student">
        <p className="text-slate-600">Loading issue…</p>
      </DashboardShell>
    );
  }

  if (!issue) {
    return (
      <DashboardShell title="Issue Not Found" roleLabel="Student">
        <div className="rounded-card border border-slate-200 bg-white p-8 text-center shadow-card">
          <AlertCircle size={48} className="mx-auto mb-3 text-slate-400" />
          <p className="mb-4 text-slate-600">This issue doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/dashboard/student')}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
      </DashboardShell>
    );
  }

  const getStatusColor = (status) => {
    const statusMap = {
      submitted: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      resolved: 'bg-emerald-100 text-emerald-800',
    };
    return statusMap[status] || 'bg-slate-100 text-slate-800';
  };

  const getStatusLabel = (status) => {
    const s = ISSUE_STATUS.find((x) => x.value === status);
    return s?.label || status;
  };

  const isResolvedWithProof = issue?.status === 'resolved' && Boolean(issue?.resolutionProof);

  const formatDate = (date) => new Date(date).toLocaleString();

  const handleSupport = async () => {
    const result = await addSupport(issueId, session?.email);
    if (result?.issue) setIssue(result.issue);
    else loadIssue();
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const updated = await addComment(issueId, commentText, session?.email, session?.fullName);
    if (updated) {
      setIssue(updated);
      setCommentText('');
      setMessage('Comment added successfully!');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <DashboardShell title="Issue Details" roleLabel="Student">
      <button
        onClick={() => navigate('/dashboard/student')}
        className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <ArrowLeft size={16} className="text-primary" />
        Back to Dashboard
      </button>

      <ImageViewerModal
        open={imageModalOpen}
        imageUrl={issue?.imageUrl}
        title={issue?.title || 'Issue image'}
        issueId={issue?.id}
        issueTitle={issue?.title}
        reporterName={issue?.studentName}
        reporterEmail={issue?.studentEmail}
        reportedAt={issue?.createdAt}
        attachment={null}
        onClose={() => setImageModalOpen(false)}
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Issue Header */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
            {issue?.imageUrl && (
              <button
                type="button"
                onClick={() => setImageModalOpen(true)}
                className="relative block h-64 w-full overflow-hidden bg-slate-200"
                title="Open uploaded photo"
              >
                <img
                  src={issue.imageUrl}
                  alt={issue.title}
                  className="h-full w-full object-cover transition hover:scale-[1.01]"
                />
                <span className="absolute inset-x-4 bottom-4 rounded-full bg-slate-950/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  Tap to view image details
                </span>
              </button>
            )}

            <div className="p-6">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{issue.title}</h1>
                  <p className="mt-1 text-sm text-slate-500">Issue ID: {issue.id}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(issue.status)}`}>
                    {getStatusLabel(issue.status)}
                  </span>
                  {isResolvedWithProof && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <ShieldCheck size={14} />
                      Resolved with proof
                    </span>
                  )}
                </div>
              </div>

              <p className="mb-4 text-slate-700">{issue.description}</p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-600">Reported By</p>
                  <p className="font-semibold text-slate-900">{issue.studentName}</p>
                  <p className="text-xs text-slate-500">{issue.studentEmail}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-600">Category</p>
                  <p className="font-semibold text-slate-900 capitalize">{issue.category}</p>
                </div>
              </div>

              {isResolvedWithProof && (
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <div className="flex items-start gap-2">
                    <BadgeCheck size={18} className="mt-0.5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">Resolution timeline</p>
                      <p className="text-xs text-emerald-800">
                        Resolved with proof on {issue.resolutionProof?.capturedAt ? formatDate(issue.resolutionProof.capturedAt) : formatDate(issue.resolvedAt || issue.updatedAt || issue.createdAt)}.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {issue.status === 'resolved' && issue.resolutionProof && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Resolution Proof</p>
                      <p className="text-sm font-semibold text-emerald-900">Verified proof submitted by maintenance</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Resolved
                    </span>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
                    <div className="overflow-hidden rounded-xl border border-emerald-200 bg-white">
                      {issue.resolutionProof.imageUrl ? (
                        <img
                          src={issue.resolutionProof.imageUrl}
                          alt={`Resolution proof for issue ${issue.id}`}
                          className="h-64 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-64 items-center justify-center bg-slate-50 text-sm text-slate-500">
                          No proof image attached.
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 rounded-xl border border-emerald-200 bg-white p-4 text-sm text-slate-700">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Captured by</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {issue.resolutionProof.capturedByName || 'Unknown'}
                        </p>
                        <p className="text-xs text-slate-500">{issue.resolutionProof.capturedByEmail || 'Unknown'}</p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Captured at</p>
                        <p className="mt-1 text-slate-900">
                          {issue.resolutionProof.capturedAt ? formatDate(issue.resolutionProof.capturedAt) : 'Unknown'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Proof location</p>
                        <p className="mt-1 text-slate-900">
                          {issue.resolutionProof.latitude !== null && issue.resolutionProof.longitude !== null
                            ? `${Number(issue.resolutionProof.latitude).toFixed(6)}, ${Number(issue.resolutionProof.longitude).toFixed(6)}`
                            : 'Unknown'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Accuracy</p>
                          <p className="mt-1 text-slate-900">
                            {issue.resolutionProof.accuracy !== null && issue.resolutionProof.accuracy !== undefined
                              ? `${Math.round(issue.resolutionProof.accuracy)}m`
                              : 'Unknown'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Distance</p>
                          <p className="mt-1 text-slate-900">
                            {issue.resolutionProof.distanceMeters !== null && issue.resolutionProof.distanceMeters !== undefined
                              ? `${Math.round(issue.resolutionProof.distanceMeters)}m`
                              : 'Unknown'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Block / Floor</p>
                        <p className="mt-1 text-slate-900">
                          {issue.resolutionProof.blockNumber || 'N/A'} / {issue.resolutionProof.floorNumber || 'N/A'}
                        </p>
                      </div>

                      {issue.resolutionProof.notes && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</p>
                          <p className="mt-1 text-slate-700">{issue.resolutionProof.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {issue.assignedDepartment && issue.status !== 'submitted' && (
                <div className="mt-3 rounded-lg border-l-4 border-blue-300 bg-blue-50 p-3">
                  <p className="text-xs text-blue-600">Assigned Department</p>
                  <p className="font-semibold text-blue-900">{issue.assignedDepartment}</p>
                </div>
              )}
            </div>
          </div>

          {/* Location & Timestamps */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h3 className="mb-4 font-semibold text-slate-900">Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 text-slate-500 flex-shrink-0" />
                <div>
                  <p className="text-slate-600">Location</p>
                  <p className="font-semibold text-slate-900">{issue.location}</p>
                  {issue.latitude && issue.longitude && (
                    <p className="mt-1 text-xs text-slate-500 font-mono">
                      {issue.latitude}, {issue.longitude}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar size={18} className="mt-0.5 text-slate-500 flex-shrink-0" />
                <div>
                  <p className="text-slate-600">Created</p>
                  <p className="font-semibold text-slate-900">{formatDate(issue.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h3 className="mb-4 font-semibold text-slate-900">Comments ({comments.length})</h3>

            {message && <AlertMessage type="success" message={message} />}

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="mb-6">
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="input-field"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="rounded-lg bg-primary px-4 py-2 text-white font-semibold transition hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>

            {/* Comments List */}
            {comments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
                <MessageCircle size={32} className="mx-auto mb-2 text-slate-400" />
                <p className="text-sm text-slate-600">No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment._id || comment.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-slate-900">{comment.userName}</p>
                      <p className="text-xs text-slate-500">{formatDate(comment.createdAt)}</p>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{comment.userEmail}</p>
                    <p className="text-slate-700">{comment.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 h-fit">
          {/* Support Button */}
          <button
            onClick={handleSupport}
            className={`w-full rounded-lg px-4 py-4 font-semibold transition flex items-center justify-center gap-2 ${
              isSupported
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'border-2 border-slate-300 text-slate-700 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            <ThumbsUp size={20} />
            <span>Support ({issue.supports || 0})</span>
          </button>

          {/* Stats Card */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h4 className="mb-3 font-semibold text-slate-900">Quick Stats</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 flex items-center gap-2">
                  <Heart size={16} />
                  Supports
                </span>
                <span className="font-semibold text-slate-900">{issue.supports || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 flex items-center gap-2">
                  <MessageSquare size={16} />
                  Comments
                </span>
                <span className="font-semibold text-slate-900">{comments.length}</span>
              </div>
              {issue.status !== 'resolved' && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-2">
                    <Zap size={16} />
                    Priority
                  </span>
                  <span className={`font-semibold capitalize ${
                    issue.priority === 'high'
                      ? 'text-red-600'
                      : issue.priority === 'medium'
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}>
                    {issue.priority}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status Timeline */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h4 className="mb-3 font-semibold text-slate-900">Status</h4>
            <div className="space-y-2">
              <div className={`rounded text-sm px-3 py-2 text-center font-semibold ${getStatusColor(issue.status)}`}>
                {getStatusLabel(issue.status)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
