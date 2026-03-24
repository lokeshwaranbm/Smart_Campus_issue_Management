import { useEffect, useMemo, useState } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import FormField from '../auth/FormField';
import AlertMessage from '../auth/AlertMessage';

const getCategoryLookupKey = (value) => String(value || '').trim().toLowerCase();

export default function EditStaffModal({ staff, onClose, onUpdate, categoryOptions = [] }) {
  // Create a map to match category names to their option IDs
  const categoryNameMap = useMemo(() => {
    const map = new Map();
    categoryOptions.forEach((opt) => {
      // Map by ID (the alias)
      map.set(getCategoryLookupKey(opt.id), opt.id);
      
      // Map by display name (case-insensitive)
      map.set(getCategoryLookupKey(opt.name), opt.id);
      
      // Map by database name if available
      if (opt.dbName) {
        map.set(getCategoryLookupKey(opt.dbName), opt.id);
      }
    });
    return map;
  }, [categoryOptions]);

  // Initialize assigned categories by matching names
  const initialAssignedCategories = useMemo(() => {
    return (staff.assignedCategories || [])
      .map((c) => {
        // Get category name and ID
        const categoryName = c.name || '';
        const categoryId = c._id || c.id;
        
        // Try matching by name first (case-insensitive)
        const nameMatch = categoryNameMap.get(getCategoryLookupKey(categoryName));
        if (nameMatch) {
          return nameMatch;
        }
        
        // Try matching by ID lookup key
        const directMatch = categoryNameMap.get(getCategoryLookupKey(categoryId));
        if (directMatch) {
          return directMatch;
        }
        
        return null;
      })
      .filter(Boolean);
  }, [staff.assignedCategories, categoryNameMap]);

  const [formData, setFormData] = useState({
    name: staff.name || '',
    email: staff.email || '',
    phone: staff.phone || '',
    employeeId: staff.employeeId || '',
    department: staff.department || '',
    assignedCategories: [],
  });

  useEffect(() => {
    setFormData({
      name: staff.name || '',
      email: staff.email || '',
      phone: staff.phone || '',
      employeeId: staff.employeeId || '',
      department: staff.department || '',
      assignedCategories: initialAssignedCategories,
    });
  }, [staff, initialAssignedCategories]);

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuspendForm, setShowSuspendForm] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const departments = ['Maintenance', 'Electrical', 'Plumbing', 'Network', 'Facilities'];

  const handleCategoryToggle = (categoryId) => {
    setFormData((prev) => ({
      ...prev,
      assignedCategories: prev.assignedCategories.includes(categoryId)
        ? prev.assignedCategories.filter((id) => id !== categoryId)
        : [...prev.assignedCategories, categoryId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.department) {
      setMessage('Please fill all required fields');
      return;
    }

    // If employee ID is provided, categories must be assigned
    if (formData.employeeId && formData.assignedCategories.length === 0) {
      setMessage('Please assign at least one category for this employee');
      return;
    }

    setLoading(true);

    try {
      const updatedStaff = {
        ...staff,
        ...formData,
        assignedCategories: formData.assignedCategories,
      };

      onUpdate(updatedStaff);
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = () => {
    const ok = window.confirm('Are you sure you want to disable this staff account?');
    if (!ok) return;

    const suspendedStaff = {
      ...staff,
      isSuspended: true,
      suspendedReason: suspendReason,
    };
    onUpdate(suspendedStaff);
    setShowSuspendForm(false);
  };

  const handleReactivate = () => {
    const ok = window.confirm('Are you sure you want to enable this staff account?');
    if (!ok) return;

    const reactivatedStaff = {
      ...staff,
      isSuspended: false,
      suspendedReason: null,
    };
    onUpdate(reactivatedStaff);
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setMessage('Please enter new password and confirmation');
      return;
    }

    if (newPassword.length < 8) {
      setMessage('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    setResetLoading(true);
    try {
      const updatedStaff = {
        ...staff,
        password: newPassword,
      };
      onUpdate(updatedStaff);
      setShowResetPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password reset successfully');
    } catch (error) {
      setMessage('Error resetting password: ' + error.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-white">
          <h2 className="text-xl font-bold text-slate-900">Edit Staff: {staff.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <AlertMessage message={message} />

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Basic Information</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  label="Full Name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />

                <FormField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />

                <FormField
                  label="Phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />

                <FormField
                  label="Employee ID"
                  type="text"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                />

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    required
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResetPasswordModal(true)}
                    className="flex-1 rounded-lg bg-slate-600 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                  >
                    Reset Password
                  </button>
                </div>

              </div>
            </div>

            {/* Assign Categories */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Assigned Categories</h3>
                {formData.employeeId && formData.assignedCategories.length === 0 && (
                  <span className="text-xs text-red-600 font-semibold">Required</span>
                )}
              </div>
              {formData.employeeId && formData.assignedCategories.length === 0 && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-700">
                    Please assign at least one category for this employee before saving.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {categoryOptions.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 cursor-pointer hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={formData.assignedCategories.includes(category.id)}
                      onChange={() => handleCategoryToggle(category.id)}
                      className="rounded"
                    />
                    <span className="text-sm text-slate-700">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Staff Stats */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="text-xs text-slate-600">Active Issues</p>
                <p className="text-lg font-bold text-slate-900">{staff.stats?.activeIssues || 0}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Completed</p>
                <p className="text-lg font-bold text-slate-900">{staff.stats?.completedIssues || 0}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">SLA %</p>
                <p className="text-lg font-bold text-green-600">{staff.stats?.slaCompliancePercent || 0}%</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Avg Resolution</p>
                <p className="text-lg font-bold text-slate-900">{staff.stats?.averageResolutionHours || 0}h</p>
              </div>
            </div>

            {/* Account Status */}
            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Account Status</h3>
              {staff.isSuspended ? (
                <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={20} className="text-red-600" />
                    <div>
                      <p className="font-semibold text-red-900">Suspended</p>
                      {staff.suspendedReason && (
                        <p className="text-xs text-red-700">Reason: {staff.suspendedReason}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleReactivate}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    Reactivate
                  </button>
                </div>
              ) : (
                <>
                  {!showSuspendForm ? (
                    <button
                      type="button"
                      onClick={() => setShowSuspendForm(true)}
                      className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm font-semibold text-yellow-900 hover:bg-yellow-100"
                    >
                      Suspend Account
                    </button>
                  ) : (
                    <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
                      <FormField
                        label="Suspension Reason"
                        type="text"
                        placeholder="e.g., Performance issues, Pending review"
                        value={suspendReason}
                        onChange={(e) => setSuspendReason(e.target.value)}
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => setShowSuspendForm(false)}
                          className="flex-1 rounded-lg border border-yellow-300 px-4 py-2 text-sm font-semibold text-yellow-900 hover:bg-yellow-100"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSuspend}
                          className="flex-1 rounded-lg bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-700"
                        >
                          Confirm Suspend
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Reset Password Modal */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">Reset Password</h3>
              <button
                onClick={() => {
                  setShowResetPasswordModal(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                Set a new password for <span className="font-semibold">{staff.name}</span>
              </p>

              <div className="space-y-4">
                <FormField
                  label="New Password"
                  type="password"
                  placeholder="Enter new password (min 8 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />

                <FormField
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetPasswordModal(false);
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={resetLoading}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {resetLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
