import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  AlertCircle,
  Clock,
  Bell,
  Lock,
  Database,
  Zap,
  Users,
  FolderOpen,
  ArrowLeft,
} from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import AlertMessage from '../../components/auth/AlertMessage';
import {
  getSettings,
  updateSettings,
  getSettingSection,
  addCategory,
  updateCategory,
  deleteCategory,
  resetSettingsToDefaults,
} from '../../utils/settings';

export default function AdminSettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('categories');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [settings, setSettingsState] = useState(getSettings());

  // Fetch current settings for the active tab
  const currentSettings = useMemo(() => {
    return getSettingSection(activeTab) || settings[activeTab];
  }, [activeTab, settings]);

  const handleSaveSettings = (section, data) => {
    const result = updateSettings(section, data);
    if (result.ok) {
      setMessageType('success');
      setMessage(result.message);
      setSettingsState(getSettings());
    } else {
      setMessageType('error');
      setMessage(result.message);
    }
  };

  // ============ CATEGORIES TAB ============
  const handleAddCategory = () => {
    setEditingCategory(null);
    setFormData({ name: '', slaHours: 48, priority: 'medium', isCritical: false });
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setFormData(category);
    setShowCategoryModal(true);
  };

  const handleSaveCategory = () => {
    if (!formData.name || !formData.name.trim()) {
      setMessageType('error');
      setMessage('Category name is required');
      return;
    }

    let result;
    if (editingCategory) {
      result = updateCategory(editingCategory.id, formData);
    } else {
      result = addCategory(formData);
    }

    if (result.ok) {
      setMessageType('success');
      setMessage(result.message);
      setSettingsState(getSettings());
      setShowCategoryModal(false);
    } else {
      setMessageType('error');
      setMessage(result.message);
    }
  };

  const handleDeleteCategory = (categoryId) => {
    const result = deleteCategory(categoryId);
    if (result.ok) {
      setMessageType('success');
      setMessage(result.message);
      setSettingsState(getSettings());
      setShowDeleteModal(false);
    }
  };

  const categories = getSettingSection('categories') || [];

  // ============ TAB CONTENT FUNCTIONS ============

  const renderCategoriesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Issue Categories</h3>
        <button
          onClick={handleAddCategory}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      <div className="grid gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-slate-900">{category.name}</h4>
                {category.isCritical && (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                    Critical
                  </span>
                )}
                {!category.isActive && (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">
                    Inactive
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-600">
                SLA: {category.slaHours} hours | Priority: <span className="font-medium capitalize">{category.priority}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEditCategory(category)}
                className="rounded-lg border border-blue-300 p-2 hover:bg-blue-50"
                title="Edit"
              >
                <Edit2 size={16} className="text-blue-600" />
              </button>
              <button
                onClick={() => {
                  setDeleteTarget(category);
                  setShowDeleteModal(true);
                }}
                className="rounded-lg border border-red-300 p-2 hover:bg-red-50"
                title="Delete"
              >
                <Trash2 size={16} className="text-red-600" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSLATab = () => {
    const slaSettings = getSettingSection('sla') || settings.sla;
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-900">SLA Configuration</h3>

        <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Default SLA (Hours)</label>
            <input
              type="number"
              value={slaSettings.defaultSlaHours}
              onChange={(e) =>
                handleSaveSettings('sla', { ...slaSettings, defaultSlaHours: parseInt(e.target.value) })
              }
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
            />
            <p className="mt-2 text-xs text-slate-600">Default time to resolve issues</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Escalation Time (Hours)</label>
            <input
              type="number"
              value={slaSettings.escalationTimeHours}
              onChange={(e) =>
                handleSaveSettings('sla', { ...slaSettings, escalationTimeHours: parseInt(e.target.value) })
              }
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
            />
            <p className="mt-2 text-xs text-slate-600">Time after which issue is escalated</p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="font-medium text-slate-900">Enable Auto-Escalation</p>
              <p className="text-xs text-slate-600">Automatically escalate overdue issues</p>
            </div>
            <button
              onClick={() =>
                handleSaveSettings('sla', { ...slaSettings, enableAutoEscalation: !slaSettings.enableAutoEscalation })
              }
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                slaSettings.enableAutoEscalation ? 'bg-green-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                  slaSettings.enableAutoEscalation ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="font-medium text-slate-900">Notify on Escalation</p>
              <p className="text-xs text-slate-600">Send notifications when issues escalate</p>
            </div>
            <button
              onClick={() =>
                handleSaveSettings('sla', { ...slaSettings, notifyOnEscalation: !slaSettings.notifyOnEscalation })
              }
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                slaSettings.notifyOnEscalation ? 'bg-green-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                  slaSettings.notifyOnEscalation ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderStaffTab = () => {
    const staffSettings = getSettingSection('staff') || settings.staff;
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-900">Staff Configuration</h3>

        <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Max Issues Per Staff</label>
            <input
              type="number"
              value={staffSettings.maxIssuesPerStaff}
              onChange={(e) =>
                handleSaveSettings('staff', { ...staffSettings, maxIssuesPerStaff: parseInt(e.target.value) })
              }
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
            />
            <p className="mt-2 text-xs text-slate-600">Maximum concurrent issues per staff member</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Working Hours Start</label>
            <input
              type="time"
              value={staffSettings.workingHoursStart}
              onChange={(e) =>
                handleSaveSettings('staff', { ...staffSettings, workingHoursStart: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Working Hours End</label>
            <input
              type="time"
              value={staffSettings.workingHoursEnd}
              onChange={(e) =>
                handleSaveSettings('staff', { ...staffSettings, workingHoursEnd: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="font-medium text-slate-900">Enable Auto-Assignment</p>
              <p className="text-xs text-slate-600">Automatically assign issues to available staff</p>
            </div>
            <button
              onClick={() =>
                handleSaveSettings('staff', { ...staffSettings, autoAssignmentEnabled: !staffSettings.autoAssignmentEnabled })
              }
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                staffSettings.autoAssignmentEnabled ? 'bg-green-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                  staffSettings.autoAssignmentEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderNotificationsTab = () => {
    const notifSettings = getSettingSection('notifications') || settings.notifications;
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-900">Notification Settings</h3>

        <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
          {[
            { key: 'enableRealtimeNotifications', label: 'Real-time Notifications', desc: 'Instant notifications on new issues' },
            { key: 'enableEmailAlerts', label: 'Email Alerts', desc: 'Send email notifications' },
            { key: 'enableEscalationAlerts', label: 'Escalation Alerts', desc: 'Alert on issue escalation' },
            { key: 'enableDailySummary', label: 'Daily Summary Report', desc: 'Send daily issue summary' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="font-medium text-slate-900">{item.label}</p>
                <p className="text-xs text-slate-600">{item.desc}</p>
              </div>
              <button
                onClick={() =>
                  handleSaveSettings('notifications', {
                    ...notifSettings,
                    [item.key]: !notifSettings[item.key],
                  })
                }
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                  notifSettings[item.key] ? 'bg-green-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                    notifSettings[item.key] ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSystemTab = () => {
    const sysSettings = getSettingSection('system') || settings.system;
    return (
      <div className="space-y-6">
        <h3 className="text-2xl font-semibold text-slate-900">My Settings</h3>

        <div className="space-y-6 rounded-lg border border-slate-200 bg-white p-6">
          <div>
            <label className="mb-1 block text-base font-semibold text-slate-900">Pagination Limit</label>
            <p className="mb-3 text-sm text-slate-500">Set how many records are shown per page.</p>
            <select
              value={sysSettings.paginationLimit}
              onChange={(e) =>
                handleSaveSettings('system', { ...sysSettings, paginationLimit: parseInt(e.target.value) })
              }
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
            >
              <option value={10}>10 items</option>
              <option value={20}>20 items</option>
              <option value={50}>50 items</option>
              <option value={100}>100 items</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-base font-semibold text-slate-900">Data Retention</label>
            <p className="mb-3 text-sm text-slate-500">Keep historical records for this many days.</p>
            <input
              type="number"
              value={sysSettings.dataRetentionDays}
              onChange={(e) =>
                handleSaveSettings('system', { ...sysSettings, dataRetentionDays: parseInt(e.target.value) })
              }
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-base font-semibold text-slate-900">Auto-Archive Completed Issues</label>
            <p className="mb-3 text-sm text-slate-500">Automatically archive completed issues after this period.</p>
            <input
              type="number"
              value={sysSettings.autoArchiveDays}
              onChange={(e) =>
                handleSaveSettings('system', { ...sysSettings, autoArchiveDays: parseInt(e.target.value) })
              }
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderCampusTab = () => {
    const campusSettings = getSettingSection('campusInfo') || settings.campusInfo;
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-900">Campus Information</h3>

        <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">University/College Name</label>
            <input
              type="text"
              value={campusSettings.universityName}
              onChange={(e) =>
                handleSaveSettings('campusInfo', { ...campusSettings, universityName: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Contact Email</label>
            <input
              type="email"
              value={campusSettings.contactEmail}
              onChange={(e) =>
                handleSaveSettings('campusInfo', { ...campusSettings, contactEmail: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Contact Phone</label>
            <input
              type="tel"
              value={campusSettings.contactPhone}
              onChange={(e) =>
                handleSaveSettings('campusInfo', { ...campusSettings, contactPhone: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Campus Address</label>
            <textarea
              value={campusSettings.address}
              onChange={(e) =>
                handleSaveSettings('campusInfo', { ...campusSettings, address: e.target.value })
              }
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderSecurityTab = () => {
    const secSettings = getSettingSection('security') || settings.security;
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-900">Security Settings</h3>

        <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Password Min Length</label>
            <input
              type="number"
              value={secSettings.passwordMinLength}
              onChange={(e) =>
                handleSaveSettings('security', { ...secSettings, passwordMinLength: parseInt(e.target.value) })
              }
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Session Timeout (Minutes)</label>
            <input
              type="number"
              value={secSettings.sessionTimeoutMinutes}
              onChange={(e) =>
                handleSaveSettings('security', { ...secSettings, sessionTimeoutMinutes: parseInt(e.target.value) })
              }
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Login Attempt Limit</label>
            <input
              type="number"
              value={secSettings.loginAttemptLimit}
              onChange={(e) =>
                handleSaveSettings('security', { ...secSettings, loginAttemptLimit: parseInt(e.target.value) })
              }
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Account Lock Duration (Minutes)</label>
            <input
              type="number"
              value={secSettings.accountLockDurationMinutes}
              onChange={(e) =>
                handleSaveSettings('security', { ...secSettings, accountLockDurationMinutes: parseInt(e.target.value) })
              }
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
            />
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'categories', label: 'Categories', icon: FolderOpen },
    { id: 'sla', label: 'SLA Config', icon: Clock },
    { id: 'staff', label: 'Staff Rules', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'campusInfo', label: 'Campus Info', icon: Zap },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'system', label: 'System', icon: Database },
  ];

  const tabRenderers = {
    categories: renderCategoriesTab,
    sla: renderSLATab,
    staff: renderStaffTab,
    notifications: renderNotificationsTab,
    campusInfo: renderCampusTab,
    security: renderSecurityTab,
    system: renderSystemTab,
  };

  return (
    <DashboardShell title="Settings" subtitle="Configure system, categories, staff, and notifications" roleLabel="Admin">
      <>
        <button
          onClick={() => navigate('/dashboard/admin')}
          className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} className="text-primary" />
          Back to Dashboard
        </button>

        <AlertMessage type={messageType} message={message} />

        <div className="mb-6 border-b border-slate-200 pb-4">
          <h2 className="text-3xl font-semibold text-slate-900">Settings</h2>
        </div>

        <div className="settings-page flex gap-6">
          {/* Sidebar */}
          <div className="hidden w-56 flex-shrink-0 lg:block">
            <nav className="space-y-1 rounded-lg border border-slate-200 bg-white p-3">
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Account</p>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      activeTab === tab.id
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Mobile Tab Selector */}
          <div className="w-full lg:hidden mb-4">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>{tab.label}</option>
              ))}
            </select>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              {tabRenderers[activeTab]?.()}
            </div>
          </div>
        </div>

        {/* Category Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h3>
                <button onClick={() => setShowCategoryModal(false)} className="text-slate-500 hover:text-slate-700">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Category Name</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Electrical"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">SLA Hours</label>
                  <input
                    type="number"
                    value={formData.slaHours || 48}
                    onChange={(e) => setFormData({ ...formData, slaHours: parseInt(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Priority</label>
                  <select
                    value={formData.priority || 'medium'}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="critical"
                    checked={formData.isCritical || false}
                    onChange={(e) => setFormData({ ...formData, isCritical: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="critical" className="text-sm font-medium text-slate-900">
                    Mark as Critical Category
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleSaveCategory}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowCategoryModal(false)}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center gap-3">
                <AlertCircle size={24} className="text-red-600" />
                <h3 className="text-lg font-semibold text-slate-900">Delete Category?</h3>
              </div>
              <p className="mb-6 text-slate-600">
                Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDeleteCategory(deleteTarget.id)}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    </DashboardShell>
  );
}
