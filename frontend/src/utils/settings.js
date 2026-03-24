import { apiFetch } from './apiConfig';

const SETTINGS_CACHE_KEY = 'smart-campus-settings-cache';

const DEFAULT_SETTINGS = {
  categories: [],
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

const readCache = () => {
  const raw = localStorage.getItem(SETTINGS_CACHE_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const writeCache = (settings) => {
  localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings));
};

const normalizeCategory = (category) => ({
  id: String(category._id || category.id),
  name: category.name,
  slaHours: category.slaHours || 48,
  isActive: category.isActive !== false,
  priority: category.priority || 'medium',
  isCritical: Boolean(category.isCritical),
  description: category.description || '',
});

const mergeAndCache = (settingsPayload, categoriesPayload = null) => {
  const current = readCache();
  const merged = {
    ...current,
    ...settingsPayload,
    ...(categoriesPayload ? { categories: categoriesPayload.map(normalizeCategory) } : {}),
  };
  writeCache(merged);
  return merged;
};

export const getDefaultSettings = () => DEFAULT_SETTINGS;

export const getSettings = async () => {
  try {
    const [settingsResponse, categoriesResponse] = await Promise.all([
      apiFetch('/api/settings', { method: 'GET' }),
      apiFetch('/api/categories', { method: 'GET' }),
    ]);

    const settingsJson = await settingsResponse.json();
    const categoriesJson = await categoriesResponse.json();

    if (!settingsResponse.ok || !settingsJson?.ok) {
      return readCache();
    }

    const merged = mergeAndCache(
      settingsJson.data || {},
      categoriesResponse.ok && categoriesJson?.ok ? categoriesJson.data || [] : null
    );
    return merged;
  } catch {
    return readCache();
  }
};

export const updateSettings = async (section, data) => {
  try {
    const response = await apiFetch(`/api/settings/${encodeURIComponent(section)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    const result = await response.json();

    if (!response.ok || !result?.ok) {
      return { ok: false, message: result?.message || 'Failed to update settings' };
    }

    const current = readCache();
    const merged = {
      ...current,
      [section]: result?.data?.[section] || { ...current[section], ...data },
    };
    writeCache(merged);
    return { ok: true, message: result?.message || `${section} updated successfully`, settings: merged };
  } catch {
    return { ok: false, message: 'Unable to connect to backend. Please try again.' };
  }
};

export const getSettingSection = (section) => {
  const settings = readCache();
  return settings[section] || null;
};

export const addCategory = async (categoryData) => {
  try {
    const response = await apiFetch('/api/categories', {
      method: 'POST',
      body: JSON.stringify({
        name: categoryData.name,
        description: categoryData.description || '',
        slaHours: categoryData.slaHours || 48,
      }),
    });
    const result = await response.json();

    if (!response.ok || !result?.ok) {
      return { ok: false, message: result?.message || 'Failed to create category' };
    }

    const current = readCache();
    const nextCategories = [...(current.categories || []), normalizeCategory(result.data)];
    writeCache({ ...current, categories: nextCategories });
    return { ok: true, message: result?.message || 'Category added successfully', category: result.data };
  } catch {
    return { ok: false, message: 'Unable to connect to backend. Please try again.' };
  }
};

export const updateCategory = async (categoryId, updateData) => {
  try {
    const response = await apiFetch(`/api/categories/${encodeURIComponent(categoryId)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: updateData.name,
        description: updateData.description || '',
        slaHours: updateData.slaHours,
        isActive: updateData.isActive,
      }),
    });
    const result = await response.json();

    if (!response.ok || !result?.ok) {
      return { ok: false, message: result?.message || 'Failed to update category' };
    }

    const current = readCache();
    const nextCategories = (current.categories || []).map((category) =>
      String(category.id) === String(categoryId) ? normalizeCategory(result.data) : category
    );
    writeCache({ ...current, categories: nextCategories });
    return { ok: true, message: result?.message || 'Category updated successfully' };
  } catch {
    return { ok: false, message: 'Unable to connect to backend. Please try again.' };
  }
};

export const deleteCategory = async (categoryId) => {
  try {
    const response = await apiFetch(`/api/categories/${encodeURIComponent(categoryId)}`, {
      method: 'DELETE',
    });
    const result = await response.json();

    if (!response.ok || !result?.ok) {
      return { ok: false, message: result?.message || 'Failed to delete category' };
    }

    const current = readCache();
    const nextCategories = (current.categories || []).filter(
      (category) => String(category.id) !== String(categoryId)
    );
    writeCache({ ...current, categories: nextCategories });
    return { ok: true, message: result?.message || 'Category deleted successfully' };
  } catch {
    return { ok: false, message: 'Unable to connect to backend. Please try again.' };
  }
};

export const getCategories = () => {
  const settings = readCache();
  return settings.categories || [];
};

export const resetSettingsToDefaults = async () => {
  try {
    const response = await apiFetch('/api/settings/reset', { method: 'POST' });
    const result = await response.json();
    if (!response.ok || !result?.ok) {
      return { ok: false, message: result?.message || 'Failed to reset settings' };
    }

    const merged = mergeAndCache(result.data || {});
    return { ok: true, message: result?.message || 'Settings reset to default', settings: merged };
  } catch {
    return { ok: false, message: 'Unable to connect to backend. Please try again.' };
  }
};

export const exportSettings = () => {
  const settings = readCache();
  return JSON.stringify(settings, null, 2);
};
