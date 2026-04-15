import { apiFetch } from './apiConfig';

const SESSION_KEY = 'smart-campus-session';

const readSession = () => {
  const tabSession = sessionStorage.getItem(SESSION_KEY);
  if (tabSession) return tabSession;

  // Backward-compatibility: migrate old shared session from localStorage once.
  const legacySession = localStorage.getItem(SESSION_KEY);
  if (legacySession) {
    sessionStorage.setItem(SESSION_KEY, legacySession);
    localStorage.removeItem(SESSION_KEY);
    return legacySession;
  }

  return null;
};

export const registerUser = async (payload) => {
  const endpoint =
    payload.role === 'maintenance' ? '/api/auth/register/maintenance' : '/api/auth/register/student';

  try {
    const response = await apiFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok || !result?.ok) {
      return { ok: false, message: result?.message || 'Registration failed.' };
    }

    return { ok: true, user: result.data };
  } catch {
    return { ok: false, message: 'Unable to connect to backend. Please try again.' };
  }
};

export const detectRoleFromEmail = (email) => {
  const lowerEmail = email.toLowerCase();

  if (lowerEmail.includes('admin') || lowerEmail === 'admin@university.edu') {
    return 'admin';
  }

  if (lowerEmail.includes('maintenance') || lowerEmail.includes('staff')) {
    return 'maintenance';
  }

  return 'student';
};

export const loginUser = async ({ email, password }) => {
  try {
    const response = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const result = await response.json();

    if (!response.ok || !result?.ok) {
      return {
        ok: false,
        message: result?.message || 'Invalid email, password, or account not found.',
        pendingApproval: Boolean(result?.pendingApproval),
      };
    }

    return {
      ok: true,
      user: result.data.user,
      accessToken: result.data.accessToken,
      redirectTo: result.data.redirectTo,
    };
  } catch {
    return { ok: false, message: 'Unable to connect to backend. Please try again.' };
  }
};

export const resolveRoleRedirect = (role) => {
  if (role === 'student') return '/dashboard/student';
  if (role === 'maintenance') return '/dashboard/maintenance';
  return '/dashboard/admin';
};

export const setAuthSession = (user, accessToken = null) => {
  const payload = JSON.stringify({
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    accessToken: accessToken || null,
  });

  // Use tab-scoped storage so multiple accounts can stay logged in across tabs.
  sessionStorage.setItem(SESSION_KEY, payload);
  // Remove old shared-session key to prevent account leakage between tabs.
  localStorage.removeItem(SESSION_KEY);
};

export const getAuthSession = () => {
  const session = readSession();
  if (!session) return null;

  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
};

export const clearAuthSession = () => {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
};

export const getAccessToken = () => {
  const session = getAuthSession();
  return session?.accessToken || null;
};

export const logoutUser = async () => {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // no-op: client-side session cleanup still proceeds
  } finally {
    clearAuthSession();
  }
};

export const getPendingMaintenanceStaff = async () => {
  try {
    const response = await apiFetch('/api/auth/maintenance/pending');
    const result = await response.json();
    if (!response.ok || !result?.ok) return [];
    return result.data || [];
  } catch {
    return [];
  }
};

export const approveMaintenanceStaff = async (email) => {
  try {
    const response = await apiFetch(`/api/auth/maintenance/${encodeURIComponent(email)}/approve`, {
      method: 'PATCH',
    });
    const result = await response.json();
    if (!response.ok || !result?.ok) {
      return { ok: false, message: result?.message || 'Failed to approve staff.' };
    }
    return { ok: true, staff: result.data };
  } catch {
    return { ok: false, message: 'Unable to connect to backend. Please try again.' };
  }
};

export const rejectMaintenanceStaff = async (email) => {
  try {
    const response = await apiFetch(`/api/auth/maintenance/${encodeURIComponent(email)}/reject`, {
      method: 'DELETE',
    });
    const result = await response.json();
    if (!response.ok || !result?.ok) {
      return { ok: false, message: result?.message || 'Failed to reject staff.' };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: 'Unable to connect to backend. Please try again.' };
  }
};

export const getStaffAccounts = async () => {
  try {
    const response = await apiFetch('/api/admin/staff');
    const result = await response.json();
    if (!response.ok || !result?.ok) return [];
    // Normalize backend shape to the shape pages expect
    return (result.data || []).map((s) => ({
      staffId: s._id,
      fullName: s.name || s.fullName || '',
      email: s.email || '',
      phoneNumber: s.phone || s.phoneNumber || '',
      employeeId: s.employeeId || '',
      department: s.department || '',
      assignedCategories: s.assignedCategories || [],
      role: 'maintenance',
      status: s.isSuspended ? 'suspended' : s.isActive ? 'active' : 'inactive',
      stats: s.stats || {},
      createdAt: s.createdAt,
    }));
  } catch {
    return [];
  }
};

export const createStaffAccount = async ({ fullName, email, password, phoneNumber, employeeId, department, assignedCategories }) => {
  const normalizedAssignedCategories = (assignedCategories || [])
    .map((category) => {
      if (typeof category === 'string') return category;
      return category?._id || category?.id || category?.value || null;
    })
    .filter(Boolean);

  try {
    const response = await apiFetch('/api/admin/staff', {
      method: 'POST',
      body: JSON.stringify({
        name: fullName,
        email,
        password,
        phone: phoneNumber || '',
        employeeId: employeeId || '',
        department: department || '',
        assignedCategories: normalizedAssignedCategories,
      }),
    });
    const result = await response.json();
    if (!response.ok || !result?.ok) {
      return { ok: false, message: result?.message || 'Failed to create staff account.' };
    }
    return { ok: true, staff: result.data };
  } catch {
    return { ok: false, message: 'Unable to connect to backend. Please try again.' };
  }
};

export const updateStaffAccount = async (staffId, updates) => {
  const normalizedAssignedCategories = (updates.assignedCategories || [])
    .map((category) => {
      if (typeof category === 'string') return category;
      return category?._id || category?.id || category?.value || null;
    })
    .filter(Boolean);

  try {
    const response = await apiFetch(`/api/admin/staff/${encodeURIComponent(staffId)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: updates.fullName,
        email: updates.email,
        phone: updates.phoneNumber,
        employeeId: updates.employeeId,
        department: updates.department,
        assignedCategories: normalizedAssignedCategories,
      }),
    });
    const result = await response.json();
    if (!response.ok || !result?.ok) {
      return { ok: false, message: result?.message || 'Failed to update staff account.' };
    }
    // Handle suspend/reactivate separately if status changed
    if (updates.status === 'suspended' || updates.status === 'inactive') {
      await apiFetch(`/api/admin/staff/${encodeURIComponent(staffId)}/suspend`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: updates.suspendedReason || '' }),
      });
    } else if (updates.status === 'active') {
      await apiFetch(`/api/admin/staff/${encodeURIComponent(staffId)}/reactivate`, {
        method: 'PATCH',
      });
    }
    return { ok: true, staff: result.data };
  } catch {
    return { ok: false, message: 'Unable to connect to backend. Please try again.' };
  }
};

export const deleteStaffAccount = async (staffId) => {
  try {
    const response = await apiFetch(`/api/admin/staff/${encodeURIComponent(staffId)}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    if (!response.ok || !result?.ok) {
      return { ok: false, message: result?.message || 'Failed to delete staff account.' };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: 'Unable to connect to backend. Please try again.' };
  }
};

export const getReporterAccounts = async () => {
  try {
    const response = await apiFetch('/api/admin/reporters');
    const result = await response.json();
    if (!response.ok || !result?.ok) return [];
    return (result.data || []).map((r) => ({
      _id: r._id,
      fullName: r.fullName || r.name || '',
      email: r.email || '',
      registerNumber: r.registerNumber || '',
      semester: r.semester || '',
      phoneNumber: r.phoneNumber || r.phone || '',
      department: r.department || '',
      role: 'student',
      status: r.isActive ? 'active' : 'inactive',
      createdAt: r.createdAt,
    }));
  } catch {
    return [];
  }
};

export const updateReporterStatus = async (reporterId, status) => {
  try {
    const response = await apiFetch(`/api/admin/reporters/${encodeURIComponent(reporterId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    const result = await response.json();
    if (!response.ok || !result?.ok) {
      return { ok: false, message: result?.message || 'Failed to update reporter status.' };
    }
    return { ok: true, reporter: result.data };
  } catch {
    return { ok: false, message: 'Unable to connect to backend. Please try again.' };
  }
};

export const deleteReporterAccount = async (reporterId) => {
  try {
    const response = await apiFetch(`/api/admin/reporters/${encodeURIComponent(reporterId)}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    if (!response.ok || !result?.ok) {
      return { ok: false, message: result?.message || 'Failed to delete reporter account.' };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: 'Unable to connect to backend. Please try again.' };
  }
};
