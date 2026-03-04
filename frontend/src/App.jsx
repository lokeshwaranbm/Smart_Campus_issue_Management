import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import StudentSignupPage from './pages/auth/StudentSignupPage';
import MaintenanceSignupPage from './pages/auth/MaintenanceSignupPage';
import NotFoundPage from './pages/common/NotFoundPage';
import RequireRole from './components/dashboard/RequireRole';
import StudentDashboardPage from './pages/student/StudentDashboardPage';
import ReportIssuePage from './pages/student/ReportIssuePage';
import StudentIssueDetailPage from './pages/student/StudentIssueDetailPage';
import MaintenanceDashboardPage from './pages/maintenance/MaintenanceDashboardPage';
import MaintenanceIssueDetailPage from './pages/maintenance/MaintenanceIssueDetailPage';
import MaintenanceAssignedIssuesPage from './pages/maintenance/MaintenanceAssignedIssuesPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminIssuesListPage from './pages/admin/AdminIssuesListPage';
import AdminIssueDetailPage from './pages/admin/AdminIssueDetailPage';
import AdminApprovalPage from './pages/admin/AdminApprovalPage';
import AdminCategoryManagementPage from './pages/admin/AdminCategoryManagementPage';
import AdminSLAMonitoringPage from './pages/admin/AdminSLAMonitoringPage';
import AdminStaffManagementPage from './pages/admin/AdminStaffManagementPage';
import AdminReporterManagementPage from './pages/admin/AdminReporterManagementPage';
import AdminStaffWorkloadPage from './pages/admin/AdminStaffWorkloadPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup/student" element={<StudentSignupPage />} />
      <Route path="/signup/maintenance" element={<MaintenanceSignupPage />} />
      <Route
        path="/dashboard/student"
        element={
          <RequireRole allowedRole="student">
            <StudentDashboardPage />
          </RequireRole>
        }
      />
      <Route
        path="/report-issue"
        element={
          <RequireRole allowedRole="student">
            <ReportIssuePage />
          </RequireRole>
        }
      />
      <Route
        path="/student/issue/:issueId"
        element={
          <RequireRole allowedRole="student">
            <StudentIssueDetailPage />
          </RequireRole>
        }
      />
      <Route path="/dashboard/maintenance" element={<RequireRole allowedRole="maintenance"><MaintenanceDashboardPage /></RequireRole>} />
      <Route path="/maintenance/issue/:issueId" element={<RequireRole allowedRole="maintenance"><MaintenanceIssueDetailPage /></RequireRole>} />
      <Route path="/maintenance/assigned-issues" element={<RequireRole allowedRole="maintenance"><MaintenanceAssignedIssuesPage /></RequireRole>} />
      <Route path="/dashboard/admin" element={<RequireRole allowedRole="admin"><AdminDashboardPage /></RequireRole>} />
      <Route path="/admin/approvals" element={<RequireRole allowedRole="admin"><AdminApprovalPage /></RequireRole>} />
      <Route path="/admin/issues" element={<RequireRole allowedRole="admin"><AdminIssuesListPage /></RequireRole>} />
      <Route path="/admin/issues/:issueId" element={<RequireRole allowedRole="admin"><AdminIssueDetailPage /></RequireRole>} />
      <Route path="/admin/categories" element={<RequireRole allowedRole="admin"><AdminCategoryManagementPage /></RequireRole>} />
      <Route path="/admin/sla-monitoring" element={<RequireRole allowedRole="admin"><AdminSLAMonitoringPage /></RequireRole>} />
      <Route path="/admin/staff" element={<RequireRole allowedRole="admin"><AdminStaffManagementPage /></RequireRole>} />
      <Route path="/admin/staff-workload" element={<RequireRole allowedRole="admin"><AdminStaffWorkloadPage /></RequireRole>} />
      <Route path="/admin/reporters" element={<RequireRole allowedRole="admin"><AdminReporterManagementPage /></RequireRole>} />
      <Route path="/admin/settings" element={<RequireRole allowedRole="admin"><AdminSettingsPage /></RequireRole>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
