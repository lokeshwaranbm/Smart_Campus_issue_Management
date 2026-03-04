// Default settings
const DEFAULT_SETTINGS = {
  categories: [
    { id: 'electrical', name: 'Electrical', slaHours: 48, isActive: true, priority: 'medium', isCritical: false },
    { id: 'plumbing', name: 'Plumbing & Water', slaHours: 48, isActive: true, priority: 'medium', isCritical: false },
    { id: 'network', name: 'Network & IT', slaHours: 24, isActive: true, priority: 'high', isCritical: true },
    { id: 'cleanliness', name: 'Cleanliness & Hygiene', slaHours: 48, isActive: true, priority: 'low', isCritical: false },
    { id: 'hostel', name: 'Hostel Maintenance', slaHours: 72, isActive: true, priority: 'medium', isCritical: false },
    { id: 'transport', name: 'Transport & Vehicles', slaHours: 48, isActive: true, priority: 'medium', isCritical: false },
  ],

  sla: {
    defaultSlaHours: 48,
    escalationTimeHours: 24,
    enableAutoEscalation: true,
    notifyOnEscalation: true,
  },

  staff: {
    maxIssuesPerStaff: 10,
    autoAssignmentEnabled: true,
    staffRoleHierarchy: ['Junior', 'Senior', 'Lead'],
    workingHoursStart: '09:00',
    workingHoursEnd: '18:00',
  },

  notifications: {
    enableRealtimeNotifications: true,
    enableEmailAlerts: true,
    enableSMSAlerts: false,
    enableEscalationAlerts: true,
    enableDailySummary: true,
  },

  campusInfo: {
    universityName: 'Your University Name',
    contactEmail: 'admin@university.edu',
    contactPhone: '+91-XXXXXXXXXX',
    address: 'Campus Address',
  },

  security: {
    passwordMinLength: 8,
    sessionTimeoutMinutes: 30,
    loginAttemptLimit: 5,
    accountLockDurationMinutes: 15,
  },

  system: {
    paginationLimit: 10,
    defaultDashboardView: 'overview',
    themeMode: 'light',
    dataRetentionDays: 365,
    autoArchiveDays: 30,
  },

  priorities: {
    low: { color: 'green', threshold: 0 },
    medium: { color: 'yellow', threshold: 5 },
    high: { color: 'red', threshold: 10 },
    critical: { color: 'darkred', threshold: 15 },
  },
};

// Get all settings
export const getSettings = () => {
  const stored = localStorage.getItem('smart-campus-settings');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  }
  return DEFAULT_SETTINGS;
};

// Update settings
export const updateSettings = (section, data) => {
  const settings = getSettings();
  settings[section] = { ...settings[section], ...data };
  localStorage.setItem('smart-campus-settings', JSON.stringify(settings));
  return { ok: true, message: `${section} updated successfully` };
};

// Get specific section
export const getSettingSection = (section) => {
  const settings = getSettings();
  return settings[section] || null;
};

// Category functions
export const addCategory = (categoryData) => {
  const settings = getSettings();
  const newCategory = {
    id: categoryData.id || categoryData.name.toLowerCase().replace(/\s+/g, '-'),
    name: categoryData.name,
    slaHours: categoryData.slaHours || 48,
    isActive: categoryData.isActive !== false,
    priority: categoryData.priority || 'medium',
    isCritical: categoryData.isCritical || false,
  };

  // Check if id already exists
  if (settings.categories.find((c) => c.id === newCategory.id)) {
    return { ok: false, message: 'Category already exists' };
  }

  settings.categories.push(newCategory);
  localStorage.setItem('smart-campus-settings', JSON.stringify(settings));
  return { ok: true, message: 'Category added successfully', category: newCategory };
};

export const updateCategory = (categoryId, updateData) => {
  const settings = getSettings();
  const categoryIndex = settings.categories.findIndex((c) => c.id === categoryId);

  if (categoryIndex === -1) {
    return { ok: false, message: 'Category not found' };
  }

  settings.categories[categoryIndex] = {
    ...settings.categories[categoryIndex],
    ...updateData,
  };

  localStorage.setItem('smart-campus-settings', JSON.stringify(settings));
  return { ok: true, message: 'Category updated successfully' };
};

export const deleteCategory = (categoryId) => {
  const settings = getSettings();
  settings.categories = settings.categories.filter((c) => c.id !== categoryId);
  localStorage.setItem('smart-campus-settings', JSON.stringify(settings));
  return { ok: true, message: 'Category deleted successfully' };
};

// Get categories
export const getCategories = () => {
  const settings = getSettings();
  return settings.categories || [];
};

// Reset to defaults
export const resetSettingsToDefaults = () => {
  localStorage.setItem('smart-campus-settings', JSON.stringify(DEFAULT_SETTINGS));
  return { ok: true, message: 'Settings reset to default' };
};

// Export settings as JSON
export const exportSettings = () => {
  const settings = getSettings();
  return JSON.stringify(settings, null, 2);
};
