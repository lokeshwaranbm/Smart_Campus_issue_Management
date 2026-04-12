import { ThumbsUp, MessageCircle, Calendar, MapPin, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAuthSession } from '../../utils/auth';
import { ISSUE_STATUS, ISSUE_PRIORITIES } from '../../constants/issues';

export default function IssueCard({ issue, onSupport, isSupported }) {
  const navigate = useNavigate();
  const session = getAuthSession();
  const totalComments = Number.isFinite(issue?.commentCount)
    ? issue.commentCount
    : Array.isArray(issue?.comments)
      ? issue.comments.length
      : 0;

  const getStatusColor = (status) => {
    const s = ISSUE_STATUS.find((x) => x.value === status);
    return s?.color || 'bg-slate-100 text-slate-700';
  };

  const getPriorityColor = (priority) => {
    const p = ISSUE_PRIORITIES.find((x) => x.value === priority);
    return p?.color || 'bg-slate-100 text-slate-700';
  };

  const getStatusLabel = (status) => {
    const s = ISSUE_STATUS.find((x) => x.value === status);
    return s?.label || status;
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md transition hover:shadow-lg">
      {/* Image Preview */}
      {issue.imageUrl && (
        <div className="relative h-48 w-full overflow-hidden bg-slate-200 sm:h-56">
          <img
            src={issue.imageUrl}
            alt={issue.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="p-4 sm:p-5">
        {/* Header with Status & Priority */}
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(issue.status)}`}>
              {getStatusLabel(issue.status)}
            </span>
            {issue.status !== 'resolved' && (
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getPriorityColor(issue.priority)}`}>
                {issue.priority?.charAt(0).toUpperCase() + issue.priority?.slice(1)} Priority
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500">{formatDate(issue.createdAt)}</span>
        </div>

        {/* Title & Description */}
        <div className="mb-3" onClick={() => navigate(`/student/issue/${issue.id}`)}>
          <h3 className="mb-1.5 line-clamp-2 text-base font-bold text-slate-900 hover:text-primary cursor-pointer">
            {issue.title}
          </h3>
          <p className="line-clamp-3 text-sm text-slate-600">
            {issue.description}
          </p>
        </div>

        {/* Location & Category */}
        <div className="mb-3 flex flex-wrap gap-3 text-xs text-slate-500">
          {issue.location && (
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span>{issue.location}</span>
            </div>
          )}
          {issue.category && (
            <div className="flex items-center gap-1">
              <AlertCircle size={14} />
              <span className="capitalize">{issue.category}</span>
            </div>
          )}
        </div>

        {/* Student & Department Info */}
        <div className="mb-4 border-t border-slate-100 pt-3 text-xs text-slate-600">
          <p>
            <span className="font-semibold">{issue.studentName}</span> {' '}
            • {issue.studentEmail}
          </p>
          {issue.assignedDepartment && issue.status !== 'submitted' && (
            <p className="mt-1 text-slate-500">
              Assigned to: <span className="font-semibold">{issue.assignedDepartment}</span>
            </p>
          )}
        </div>

        {/* Footer - Interactions */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex gap-4 text-sm">
            <button
              onClick={() => onSupport?.(issue.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                isSupported
                  ? 'bg-blue-100 text-primary font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ThumbsUp size={16} />
              <span>{issue.supports || 0}</span>
            </button>
            <button
              onClick={() => navigate(`/student/issue/${issue.id}`)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-slate-600 transition hover:bg-slate-100"
            >
              <MessageCircle size={16} />
              <span>{totalComments}</span>
            </button>
          </div>
          <button
            onClick={() => navigate(`/student/issue/${issue.id}`)}
            className="rounded-lg bg-blue-50 px-4 py-1.5 text-xs font-semibold text-primary transition hover:bg-blue-100"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
