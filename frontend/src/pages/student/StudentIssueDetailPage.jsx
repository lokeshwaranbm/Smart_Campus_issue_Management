import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, MessageCircle, MapPin, Calendar, AlertCircle, Send, Heart, MessageSquare, Zap } from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import AlertMessage from '../../components/auth/AlertMessage';
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

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Issue Header */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
            {issue?.imageUrl && (
              <div className="relative h-64 w-full overflow-hidden bg-slate-200">
                <img
                  src={issue.imageUrl}
                  alt={issue.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="p-6">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{issue.title}</h1>
                  <p className="mt-1 text-sm text-slate-500">Issue ID: {issue.id}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(issue.status)}`}>
                  {getStatusLabel(issue.status)}
                </span>
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
