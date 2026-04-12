import { useEffect, useState } from 'react';
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
  Search,
  Menu,
} from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import AlertMessage from '../../components/auth/AlertMessage';
import {
  getSettings,
  updateSettings,
  getDefaultSettings,
  addCategory,
  updateCategory,
  deleteCategory,
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
  const [savedSettings, setSavedSettings] = useState(getDefaultSettings());
  const [settings, setSettingsState] = useState(getDefaultSettings());
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [tabSearch, setTabSearch] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      setLoadingSettings(true);
      const data = await getSettings();
      setSavedSettings(data);
      setSettingsState(data);
      setLoadingSettings(false);
    };

    loadSettings();
  }, []);

  const handleSaveSettings = async (section, data) => {
    const result = await updateSettings(section, data);
    if (result.ok) {
      setMessageType('success');
      setMessage(result.message);
      setSavedSettings((prev) => ({ ...prev, [section]: { ...prev[section], ...data } }));
      setSettingsState((prev) => ({ ...prev, [section]: { ...prev[section], ...data } }));
    } else {
      setMessageType('error');
      setMessage(result.message);
    }
  };

  const handleFieldChange = (section, data) => {
    setSettingsState((prev) => ({ ...prev, [section]: data }));
  };

  const handleResetSettings = (section) => {
    const defaults = getDefaultSettings();
    const nextSection = savedSettings[section] || defaults[section] || {};
    setSettingsState((prev) => ({ ...prev, [section]: nextSection }));
    setMessageType('info');
    setMessage('Changes reset.');
  };

  // ============ CATEGORIES TAB ============
  const CATEGORY_NAME_OPTIONS = [
    'Electrical',
    'Plumbing',
    'Network',
    'Cleanliness',
    'Hostel',
    'Transport',
    'Maintenance',
    'Other',
  ];

  const handleAddCategory = () => {
    setEditingCategory(null);
    setFormData({ name: CATEGORY_NAME_OPTIONS[0], slaHours: 48, priority: 'medium', isCritical: false });
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setFormData(category);
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async () => {
    if (!formData.name || !formData.name.trim()) {
      setMessageType('error');
      setMessage('Category name is required');
      return;
    }

    let result;
    if (editingCategory) {
      result = await updateCategory(editingCategory.id, formData);
    } else {
      result = await addCategory(formData);
    }

    if (result.ok) {
      setMessageType('success');
      setMessage(result.message);
      const refreshed = await getSettings();
      setSettingsState(refreshed);
      setShowCategoryModal(false);
    } else {
      setMessageType('error');
      setMessage(result.message);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    const result = await deleteCategory(categoryId);
    if (result.ok) {
      setMessageType('success');
      setMessage(result.message);
      const refreshed = await getSettings();
      setSettingsState(refreshed);
      setShowDeleteModal(false);
    } else {
      setMessageType('error');
      setMessage(result.message);
    }
  };

  const categories = settings.categories || [];

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
    const slaSettings = settings.sla || getDefaultSettings().sla;
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
                handleFieldChange('sla', { ...slaSettings, defaultSlaHours: parseInt(e.target.value) })
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
                handleFieldChange('sla', { ...slaSettings, escalationTimeHours: parseInt(e.target.value) })
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
                handleFieldChange('sla', { ...slaSettings, enableAutoEscalation: !slaSettings.enableAutoEscalation })
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
                handleFieldChange('sla', { ...slaSettings, notifyOnEscalation: !slaSettings.notifyOnEscalation })
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
    const staffSettings = settings.staff || getDefaultSettings().staff;
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
                handleFieldChange('staff', { ...staffSettings, maxIssuesPerStaff: parseInt(e.target.value) })
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
                handleFieldChange('staff', { ...staffSettings, workingHoursStart: e.target.value })
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
                handleFieldChange('staff', { ...staffSettings, workingHoursEnd: e.target.value })
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
                handleFieldChange('staff', { ...staffSettings, autoAssignmentEnabled: !staffSettings.autoAssignmentEnabled })
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
    const notifSettings = settings.notifications || getDefaultSettings().notifications;
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
                  handleFieldChange('notifications', {
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
    const sysSettings = settings.system || getDefaultSettings().system;
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
                handleFieldChange('system', { ...sysSettings, paginationLimit: parseInt(e.target.value) })
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
                handleFieldChange('system', { ...sysSettings, dataRetentionDays: parseInt(e.target.value) })
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
                handleFieldChange('system', { ...sysSettings, autoArchiveDays: parseInt(e.target.value) })
              }
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderCampusTab = () => {
    const campusSettings = settings.campusInfo || getDefaultSettings().campusInfo;
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
                handleFieldChange('campusInfo', { ...campusSettings, universityName: e.target.value })
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
                handleFieldChange('campusInfo', { ...campusSettings, contactEmail: e.target.value })
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
                handleFieldChange('campusInfo', { ...campusSettings, contactPhone: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Campus Address</label>
            <textarea
              value={campusSettings.address}
              onChange={(e) =>
                handleFieldChange('campusInfo', { ...campusSettings, address: e.target.value })
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
    const secSettings = settings.security || getDefaultSettings().security;
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
                handleFieldChange('security', { ...secSettings, passwordMinLength: parseInt(e.target.value) })
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
                handleFieldChange('security', { ...secSettings, sessionTimeoutMinutes: parseInt(e.target.value) })
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
                handleFieldChange('security', { ...secSettings, loginAttemptLimit: parseInt(e.target.value) })
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
                handleFieldChange('security', { ...secSettings, accountLockDurationMinutes: parseInt(e.target.value) })
              }
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
            />
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'categories', label: 'Categories', icon: FolderOpen, description: 'Manage issue types and defaults' },
    { id: 'sla', label: 'SLA Config', icon: Clock, description: 'Response and escalation timings' },
    { id: 'staff', label: 'Staff Rules', icon: Users, description: 'Workload and assignment policies' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Alert and summary preferences' },
    { id: 'campusInfo', label: 'Campus Info', icon: Zap, description: 'Institution branding and contacts' },
    { id: 'security', label: 'Security', icon: Lock, description: 'Login and account protection' },
    { id: 'system', label: 'System', icon: Database, description: 'Retention and pagination controls' },
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

  const isCurrentSectionDirty =
    activeTab !== 'categories' &&
    JSON.stringify(settings[activeTab] || {}) !== JSON.stringify(savedSettings[activeTab] || {});

  const activeTabConfig = tabs.find((tab) => tab.id === activeTab);
  const filteredTabs = tabs.filter((tab) => {
    const q = tabSearch.trim().toLowerCase();
    if (!q) return true;
    return tab.label.toLowerCase().includes(q) || tab.description.toLowerCase().includes(q);
  });

  if (loadingSettings) {
    return (
      <DashboardShell title="Settings" subtitle="Configure system, categories, staff, and notifications" roleLabel="Admin">
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading settings...</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Settings" subtitle="Configure system, categories, staff, and notifications" roleLabel="Admin">
      <>
        <button
          onClick={() => navigate('/dashboard/admin')}
          className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:mb-6 sm:w-auto"
        >
          <ArrowLeft size={16} className="text-primary" />
          Back to Dashboard
        </button>

        <AlertMessage type={messageType} message={message} />

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">System Settings</h2>
              <p className="mt-1 text-sm text-slate-600">Configure platform behavior, notifications, security, and category policies.</p>
            </div>
            <div className="hidden sm:inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
              Admin Configuration Panel
            </div>
          </div>
        </div>

        <div className="settings-page grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24 space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2 text-slate-500">
                  <Search size={14} />
                  <input
                    value={tabSearch}
                    onChange={(e) => setTabSearch(e.target.value)}
                    placeholder="Find a setting"
                    className="w-full border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Settings Sections</p>
              {filteredTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const isDirty =
                  tab.id !== 'categories' &&
                  JSON.stringify(settings[tab.id] || {}) !== JSON.stringify(savedSettings[tab.id] || {});

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full rounded-xl px-3 py-3 text-left transition ${
                      isActive
                        ? 'border border-blue-200 bg-blue-50 text-slate-900'
                        : 'border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Icon size={16} className={isActive ? 'text-blue-700' : ''} />
                        <span className="text-sm font-semibold">{tab.label}</span>
                      </div>
                      {isDirty ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                          Unsaved
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{tab.description}</p>
                  </button>
                );
              })}
              {filteredTabs.length === 0 && (
                <p className="px-3 py-2 text-xs text-slate-500">No matching settings found.</p>
              )}
            </nav>
          </aside>

          {/* Mobile Toolbar */}
          <div className="w-full lg:hidden">
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMobileNavOpen(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700"
                  title="Open settings menu"
                >
                  <Menu size={18} />
                </button>
                <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Search size={14} />
                    <input
                      value={tabSearch}
                      onChange={(e) => setTabSearch(e.target.value)}
                      placeholder="Find a setting"
                      className="w-full border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">Current section: <span className="font-semibold text-slate-700">{activeTabConfig?.label}</span></p>
            </div>
          </div>

          {/* Mobile Sidebar Drawer */}
          {mobileNavOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-slate-900/40"
                onClick={() => setMobileNavOpen(false)}
              />
              <aside className="absolute left-0 top-0 h-full w-[82%] max-w-xs border-r border-slate-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                  <p className="text-sm font-bold text-slate-900">Settings Menu</p>
                  <button
                    onClick={() => setMobileNavOpen(false)}
                    className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-2 p-3">
                  {filteredTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setMobileNavOpen(false);
                        }}
                        className={`w-full rounded-xl px-3 py-3 text-left transition ${
                          isActive
                            ? 'border border-blue-200 bg-blue-50 text-slate-900'
                            : 'border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon size={16} className={isActive ? 'text-blue-700' : ''} />
                          <span className="text-sm font-semibold">{tab.label}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{tab.description}</p>
                      </button>
                    );
                  })}
                  {filteredTabs.length === 0 && (
                    <p className="px-3 py-2 text-xs text-slate-500">No matching settings found.</p>
                  )}
                </div>
              </aside>
            </div>
          )}

          {/* Main Content */}
          <div className="min-w-0 pb-24 sm:pb-0">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 sm:text-xl">{activeTabConfig?.label || 'Settings'}</h3>
                  <p className="mt-1 text-sm text-slate-600">{activeTabConfig?.description || 'Manage configuration values for this section.'}</p>
                </div>

                {activeTab !== 'categories' && (
                  <div className="hidden items-center gap-2 sm:flex">
                    {isCurrentSectionDirty ? (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Unsaved changes</span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Saved</span>
                    )}

                    <button
                      onClick={() => handleResetSettings(activeTab)}
                      disabled={!isCurrentSectionDirty}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Reset
                    </button>

                    <button
                      onClick={() => handleSaveSettings(activeTab, settings[activeTab] || {})}
                      disabled={!isCurrentSectionDirty}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Save size={16} />
                      Save
                    </button>
                  </div>
                )}
              </div>

              {tabRenderers[activeTab]?.()}
            </div>
          </div>
        </div>

        {/* Category Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-4 shadow-lg sm:p-6">
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
                  <select
                    value={formData.name || CATEGORY_NAME_OPTIONS[0]}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {CATEGORY_NAME_OPTIONS.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
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
            <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-lg sm:p-6">
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

        {activeTab !== 'categories' && (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur sm:hidden">
            <div className="mx-auto flex w-full max-w-7xl items-center gap-2">
              <button
                onClick={() => handleResetSettings(activeTab)}
                disabled={!isCurrentSectionDirty}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                Reset
              </button>
              <button
                onClick={() => handleSaveSettings(activeTab, settings[activeTab] || {})}
                disabled={!isCurrentSectionDirty}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </>
    </DashboardShell>
  );
}
