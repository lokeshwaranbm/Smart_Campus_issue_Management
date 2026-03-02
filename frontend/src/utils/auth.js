const STORAGE_KEY = 'smart-campus-users';
const SESSION_KEY = 'smart-campus-session';

const defaultUsers = [
  {
    fullName: 'System Administrator',
    email: 'admin@university.edu',
    password: 'Admin@123',
    role: 'admin',
    status: 'active',
  },
];

const seedUsers = () => {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUsers));
  }
};

export const getUsers = () => {
  seedUsers();
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
};

export const saveUsers = (users) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

export const registerUser = (payload) => {
  const users = getUsers();
  const exists = users.some((user) => user.email.toLowerCase() === payload.email.toLowerCase());

  if (exists) {
    return { ok: false, message: 'An account with this email already exists.' };
  }

  users.push(payload);
  saveUsers(users);
  return { ok: true };
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

export const loginUser = ({ email, password }) => {
  const users = getUsers();

  const user = users.find(
    (entry) =>
      entry.email.toLowerCase() === email.toLowerCase() &&
      entry.password === password
  );

  if (!user) {
    return { ok: false, message: 'Invalid email, password, or account not found.' };
  }

  if (user.role === 'maintenance' && user.status !== 'active') {
    return { ok: false, message: 'Account pending admin approval.', pendingApproval: true };
  }

  if (user.role === 'student' && user.status !== 'active') {
    return { ok: false, message: 'Reporter account is disabled. Please contact admin.' };
  }

  return { ok: true, user };
};

export const resolveRoleRedirect = (role) => {
  if (role === 'student') return '/dashboard/student';
  if (role === 'maintenance') return '/dashboard/maintenance';
  return '/dashboard/admin';
};

export const setAuthSession = (user) => {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
    })
  );
};

export const getAuthSession = () => {
  const session = localStorage.getItem(SESSION_KEY);
  if (!session) return null;

  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const getPendingMaintenanceStaff = () => {
  const users = getUsers();
  return users.filter((u) => u.role === 'maintenance' && u.status === 'pending_approval');
};

export const approveMaintenanceStaff = (email) => {
  const users = getUsers();
  const staff = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!staff) {
    return { ok: false, message: 'Staff not found.' };
  }

  if (staff.status === 'active') {
    return { ok: false, message: 'Already approved.' };
  }

  staff.status = 'active';
  staff.approvedAt = new Date().toISOString();
  saveUsers(users);
  return { ok: true, staff };
};

export const rejectMaintenanceStaff = (email) => {
  const users = getUsers();
  const staffIndex = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());

  if (staffIndex === -1) {
    return { ok: false, message: 'Staff not found.' };
  }

  users.splice(staffIndex, 1);
  saveUsers(users);
  return { ok: true };
};

export const getStaffAccounts = () => {
  const users = getUsers();
  return users.filter((u) => u.role === 'maintenance');
};

export const createStaffAccount = ({ fullName, email, password, phoneNumber, department, assignedCategories }) => {
  const users = getUsers();
  const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());

  if (exists) {
    return { ok: false, message: 'An account with this email already exists.' };
  }

  const newStaff = {
    staffId: `STF-${Date.now()}`,
    fullName,
    email,
    password,
    phoneNumber: phoneNumber || '',
    department: department || '',
    assignedCategories: assignedCategories || [],
    role: 'maintenance',
    status: 'active',
    createdAt: new Date().toISOString(),
    stats: {
      completedIssues: 0,
      activeIssues: 0,
      overdueIssues: 0,
      slaCompliancePercent: 100,
      averageResolutionHours: 0,
    },
  };

  users.push(newStaff);
  saveUsers(users);
  return { ok: true, staff: newStaff };
};

export const updateStaffAccount = (originalEmail, updates) => {
  const users = getUsers();
  const staff = users.find(
    (u) => u.role === 'maintenance' && u.email.toLowerCase() === originalEmail.toLowerCase()
  );

  if (!staff) {
    return { ok: false, message: 'Staff account not found.' };
  }

  if (updates.email && updates.email.toLowerCase() !== originalEmail.toLowerCase()) {
    const emailExists = users.some((u) => u.email.toLowerCase() === updates.email.toLowerCase());
    if (emailExists) {
      return { ok: false, message: 'Another account with this email already exists.' };
    }
  }

  Object.assign(staff, updates, { updatedAt: new Date().toISOString() });
  saveUsers(users);
  return { ok: true, staff };
};

export const deleteStaffAccount = (email) => {
  const users = getUsers();
  const index = users.findIndex(
    (u) => u.role === 'maintenance' && u.email.toLowerCase() === email.toLowerCase()
  );

  if (index === -1) {
    return { ok: false, message: 'Staff account not found.' };
  }

  users.splice(index, 1);
  saveUsers(users);
  return { ok: true };
};

export const getReporterAccounts = () => {
  const users = getUsers();
  return users.filter((u) => u.role === 'student');
};

export const updateReporterStatus = (email, status) => {
  const users = getUsers();
  const reporter = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.role === 'student');

  if (!reporter) {
    return { ok: false, message: 'Reporter account not found.' };
  }

  reporter.status = status;
  reporter.updatedAt = new Date().toISOString();
  saveUsers(users);
  return { ok: true, reporter };
};

export const resetReporterPassword = (email, newPassword) => {
  const users = getUsers();
  const reporter = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.role === 'student');

  if (!reporter) {
    return { ok: false, message: 'Reporter account not found.' };
  }

  reporter.password = newPassword;
  reporter.updatedAt = new Date().toISOString();
  saveUsers(users);
  return { ok: true };
};

export const deleteReporterAccount = (email) => {
  const users = getUsers();
  const index = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase() && u.role === 'student');

  if (index === -1) {
    return { ok: false, message: 'Reporter account not found.' };
  }

  users.splice(index, 1);
  saveUsers(users);
  return { ok: true };
};
