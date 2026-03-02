import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import AlertMessage from '../../components/auth/AlertMessage';
import { getPendingMaintenanceStaff, approveMaintenanceStaff, rejectMaintenanceStaff } from '../../utils/auth';

export default function AdminApprovalPage() {
  const navigate = useNavigate();
  const pendingStaff = useMemo(() => getPendingMaintenanceStaff(), []);
  const [message, setMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleApprove = (email, name) => {
    const result = approveMaintenanceStaff(email);
    if (result.ok) {
      setSuccessMessage(`${name} account approved and activated.`);
      setRefreshKey((prev) => prev + 1);
      setTimeout(() => {
        setSuccessMessage('');
        window.location.reload();
      }, 2000);
    } else {
      setMessage(result.message);
    }
  };

  const handleReject = (email, name) => {
    if (window.confirm(`Reject registration for ${name}?`)) {
      const result = rejectMaintenanceStaff(email);
      if (result.ok) {
        setSuccessMessage(`${name} registration rejected and removed.`);
        setRefreshKey((prev) => prev + 1);
        setTimeout(() => {
          setSuccessMessage('');
          window.location.reload();
        }, 2000);
      } else {
        setMessage(result.message);
      }
    }
  };

  return (
    <DashboardShell title="Staff Approval Queue" subtitle="Review and approve pending maintenance staff registrations" roleLabel="Admin">
      <button
        onClick={() => navigate('/dashboard/admin')}
        className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <ArrowLeft size={16} className="text-primary" />
        Back to Dashboard
      </button>

      <AlertMessage message={message} />
      {successMessage && <AlertMessage type="success" message={successMessage} />}

      <div className="rounded-card border border-slate-200 bg-white p-6 shadow-card">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Pending Approvals</h2>

        {pendingStaff.length === 0 ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            No pending approvals. All maintenance staff accounts are approved.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingStaff.map((staff) => (
              <div key={staff.email} className="flex flex-col gap-3 border-l-4 border-amber-300 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{staff.fullName}</h3>
                  <p className="mt-1 text-sm text-slate-600">{staff.email}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Employee ID: {staff.employeeId} | Department: {staff.department} | Phone: {staff.phoneNumber}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">Registered: {new Date(staff.createdAt).toLocaleString()}</p>
                </div>

                <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                  <button
                    onClick={() => handleApprove(staff.email, staff.fullName)}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                  >
                    <CheckCircle2 size={16} />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(staff.email, staff.fullName)}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <p className="font-semibold">How It Works:</p>
          <ul className="mt-2 space-y-1 text-xs">
            <li>• New maintenance staff must register and wait for admin approval</li>
            <li>• Approved staff can immediately log in with their credentials</li>
            <li>• Rejected registrations are permanently removed</li>
          </ul>
        </div>
      </div>
    </DashboardShell>
  );
}
