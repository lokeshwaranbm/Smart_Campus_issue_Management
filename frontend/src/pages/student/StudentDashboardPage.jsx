import { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList, Plus, AlertCircle, Clock, CheckCircle2, Eye, Newspaper, Info } from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import StatsCard from '../../components/dashboard/StatsCard';
import IssueCard from '../../components/student/IssueCard';
import FloatingActionButton from '../../components/student/FloatingActionButton';
import { getAuthSession } from '../../utils/auth';
import { getIssuesByStudent, getPublicIssueFeed, addSupport } from '../../utils/issues';

export default function StudentDashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const flashMessage = useMemo(() => location.state?.message || '', [location.state]);

  const session = getAuthSession();
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' or 'myReports'

  const [studentIssues, setStudentIssues] = useState([]);
  const [publicFeed, setPublicFeed] = useState([]);

  const loadData = () => {
    if (session?.email) {
      getIssuesByStudent(session.email).then(setStudentIssues).catch(() => setStudentIssues([]));
    }
    getPublicIssueFeed().then(setPublicFeed).catch(() => setPublicFeed([]));
  };

  useEffect(() => { loadData(); }, [session?.email]);

  const stats = useMemo(() => ({
    total: studentIssues.length,
    submitted: studentIssues.filter((i) => i.status === 'submitted').length,
    assigned: studentIssues.filter((i) => i.status === 'assigned').length,
    inProgress: studentIssues.filter((i) => i.status === 'in_progress').length,
    resolved: studentIssues.filter((i) => i.status === 'resolved').length,
  }), [studentIssues]);

  const handleSupport = async (issueId) => {
    await addSupport(issueId, session?.email);
    loadData();
  };

  const issueSupportedByUser = (issue) => issue.supportedBy?.includes(session?.email) ?? false;

  return (
    <DashboardShell title="Student Portal" subtitle="Track issues, collaborate with community" roleLabel="Student">
      {flashMessage && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {flashMessage}
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatsCard label="Total Reports" value={stats.total} icon={<ClipboardList size={16} />} tone="blue" />
        <StatsCard label="Submitted" value={stats.submitted} icon={<AlertCircle size={16} />} tone="blue" />
        <StatsCard label="Assigned" value={stats.assigned} icon={<Eye size={16} />} tone="amber" />
        <StatsCard label="In Progress" value={stats.inProgress} icon={<Clock size={16} />} tone="amber" />
        <StatsCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 size={16} />} tone="emerald" />
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex items-center gap-2 px-4 py-3 font-semibold transition border-b-2 ${
            activeTab === 'feed'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Newspaper size={18} />
          Campus Feed
        </button>
        <button
          onClick={() => setActiveTab('myReports')}
          className={`flex items-center gap-2 px-4 py-3 font-semibold transition border-b-2 ${
            activeTab === 'myReports'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ClipboardList size={18} />
          My Reports
        </button>
      </div>

      {/* Campus Feed Tab */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 flex items-start gap-2">
            <Info size={16} className="mt-0.5 flex-shrink-0" />
            <span>Browse all campus issues, support important ones, and add comments</span>
          </div>

          {publicFeed.length === 0 ? (
            <div className="rounded-card border border-slate-200 bg-white p-8 text-center shadow-card">
              <AlertCircle size={48} className="mx-auto mb-3 text-slate-400" />
              <p className="text-slate-600">No issues reported yet. Be the first!</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {publicFeed.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onSupport={handleSupport}
                  isSupported={issueSupportedByUser(issue)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Reports Tab */}
      {activeTab === 'myReports' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800 flex items-start gap-2">
            <Info size={16} className="mt-0.5 flex-shrink-0" />
            <span>Your reported issues displayed in the same card view as Campus Feed</span>
          </div>

          {studentIssues.length === 0 ? (
            <div className="rounded-card border border-slate-200 bg-white p-8 text-center shadow-card">
              <ClipboardList size={48} className="mx-auto mb-3 text-slate-400" />
              <p className="mb-4 text-slate-600">No issues reported yet. Start by reporting a new issue.</p>
              <button
                onClick={() => navigate('/report-issue')}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Plus size={18} />
                Report New Issue
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {studentIssues
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    onSupport={handleSupport}
                    isSupported={issueSupportedByUser(issue)}
                  />
                ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <FloatingActionButton />
    </DashboardShell>
  );
}
