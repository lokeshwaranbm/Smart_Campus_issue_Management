import { Router } from 'express';
import crypto from 'crypto';
import { body, param } from 'express-validator';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { requireAuth, requireRoles, signAccessToken } from '../middleware/auth.js';
import { handleValidation } from '../middleware/validation.js';
import { authRateLimiter } from '../middleware/security.js';

export const authRouter = Router();

const REFRESH_TTL_DAYS = Number(process.env.JWT_REFRESH_TTL_DAYS || 7);
const COOKIE_NAME = 'refreshToken';

const getFrontendRole = (dbRole) => {
  if (dbRole === 'staff') return 'maintenance';
  return dbRole;
};

const getAccountStatus = (user) => {
  if (user.role === 'staff' && !user.isActive) return 'pending_approval';
  if (user.isSuspended || !user.isActive) return 'inactive';
  return 'active';
};

const toAuthUser = (user) => ({
  id: user._id,
  fullName: user.name,
  email: user.email,
  role: getFrontendRole(user.role),
  status: getAccountStatus(user),
  phoneNumber: user.phone || '',
  department: user.department || '',
  registerNumber: user.registerNumber || '',
  semester: user.semester || '',
  employeeId: user.employeeId || '',
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/api/auth',
  maxAge: REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
});

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const issueRefreshToken = async (user, req, res) => {
  const rawToken = crypto.randomBytes(48).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    expiresAt,
    ipAddress: req.ip || null,
    userAgent: req.get('user-agent') || null,
  });

  res.cookie(COOKIE_NAME, rawToken, getRefreshCookieOptions());
};

const rotateRefreshToken = async (rawToken, req, res) => {
  const tokenHash = hashToken(rawToken);
  const existing = await RefreshToken.findOne({ tokenHash, revokedAt: null });
  if (!existing) return null;
  if (existing.expiresAt < new Date()) return null;

  existing.revokedAt = new Date();
  await existing.save();

  const user = await User.findById(existing.userId).lean();
  if (!user) return null;

  await issueRefreshToken(user, req, res);
  return user;
};

const clearRefreshToken = (res) => {
  res.clearCookie(COOKIE_NAME, {
    ...getRefreshCookieOptions(),
    maxAge: undefined,
  });
};

const ensureDefaultAdmin = async () => {
  const adminEmail = String(process.env.DEFAULT_ADMIN_EMAIL || 'admin@university.edu').toLowerCase();
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (existingAdmin) return;

  await User.create({
    name: process.env.DEFAULT_ADMIN_NAME || 'System Administrator',
    email: adminEmail,
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123',
    role: 'admin',
    isActive: true,
    isSuspended: false,
  });
};

authRouter.post(
  '/register/student',
  [
    body('fullName').isLength({ min: 2, max: 120 }),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }).matches(/[A-Z]/).matches(/[a-z]/).matches(/\d/),
    body('registerNumber').isLength({ min: 2, max: 64 }),
    body('department').isLength({ min: 2, max: 120 }),
    body('semester').isLength({ min: 1, max: 30 }),
    handleValidation,
  ],
  async (req, res) => {
    try {
      await ensureDefaultAdmin();
      const { fullName, email, password, registerNumber, department, semester } = req.body;

      const normalizedEmail = String(email).toLowerCase();
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(409).json({ ok: false, message: 'An account with this email already exists.' });
      }

      const user = await User.create({
        name: fullName,
        email: normalizedEmail,
        password,
        role: 'student',
        department,
        registerNumber,
        semester,
        isActive: true,
        isSuspended: false,
      });

      return res.status(201).json({ ok: true, message: 'Student account created successfully.', data: toAuthUser(user) });
    } catch {
      return res.status(500).json({ ok: false, message: 'Failed to register student account.' });
    }
  }
);

authRouter.post(
  '/register/maintenance',
  [
    body('fullName').isLength({ min: 2, max: 120 }),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }).matches(/[A-Z]/).matches(/[a-z]/).matches(/\d/),
    body('employeeId').isLength({ min: 2, max: 64 }),
    body('department').isLength({ min: 2, max: 120 }),
    body('phoneNumber').isLength({ min: 7, max: 30 }),
    handleValidation,
  ],
  async (req, res) => {
    try {
      await ensureDefaultAdmin();
      const { fullName, email, employeeId, department, phoneNumber, password } = req.body;

      const normalizedEmail = String(email).toLowerCase();
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(409).json({ ok: false, message: 'An account with this email already exists.' });
      }

      const user = await User.create({
        name: fullName,
        email: normalizedEmail,
        password,
        role: 'staff',
        department,
        phone: phoneNumber,
        employeeId,
        isActive: false,
        isSuspended: false,
      });

      return res.status(201).json({
        ok: true,
        message: 'Maintenance registration submitted. Awaiting admin approval.',
        data: toAuthUser(user),
      });
    } catch {
      return res.status(500).json({ ok: false, message: 'Failed to submit maintenance registration.' });
    }
  }
);

authRouter.post(
  '/login',
  authRateLimiter,
  [body('email').isEmail(), body('password').isLength({ min: 1 }), handleValidation],
  async (req, res) => {
    try {
      await ensureDefaultAdmin();
      const { email, password } = req.body;

      const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
      if (!user) {
        return res.status(401).json({ ok: false, message: 'Invalid credentials.' });
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ ok: false, message: 'Invalid credentials.' });
      }

      const frontendRole = getFrontendRole(user.role);
      const status = getAccountStatus(user);

      if (frontendRole === 'maintenance' && status === 'pending_approval') {
        return res.status(403).json({ ok: false, message: 'Account pending admin approval.', pendingApproval: true });
      }

      if (status !== 'active') {
        return res.status(403).json({ ok: false, message: 'Account is inactive.' });
      }

      const accessToken = signAccessToken(user);
      await issueRefreshToken(user, req, res);

      const redirectTo =
        frontendRole === 'student'
          ? '/dashboard/student'
          : frontendRole === 'maintenance'
            ? '/dashboard/maintenance'
            : '/dashboard/admin';

      return res.status(200).json({
        ok: true,
        message: 'Login successful.',
        data: {
          user: toAuthUser(user),
          accessToken,
          redirectTo,
        },
      });
    } catch {
      return res.status(500).json({ ok: false, message: 'Login failed.' });
    }
  }
);

authRouter.post('/refresh', async (req, res) => {
  try {
    const rawToken = req.cookies?.[COOKIE_NAME] || req.body?.refreshToken;
    if (!rawToken) {
      return res.status(401).json({ ok: false, message: 'Missing refresh token.' });
    }

    const user = await rotateRefreshToken(rawToken, req, res);
    if (!user) {
      clearRefreshToken(res);
      return res.status(401).json({ ok: false, message: 'Invalid refresh token.' });
    }

    const accessToken = signAccessToken(user);
    return res.status(200).json({ ok: true, data: { accessToken } });
  } catch {
    clearRefreshToken(res);
    return res.status(500).json({ ok: false, message: 'Token refresh failed.' });
  }
});

authRouter.post('/logout', async (req, res) => {
  try {
    const rawToken = req.cookies?.[COOKIE_NAME] || req.body?.refreshToken;
    if (rawToken) {
      const tokenHash = hashToken(rawToken);
      await RefreshToken.findOneAndUpdate({ tokenHash, revokedAt: null }, { revokedAt: new Date() });
    }
    clearRefreshToken(res);
    return res.status(200).json({ ok: true, message: 'Logged out successfully.' });
  } catch {
    clearRefreshToken(res);
    return res.status(200).json({ ok: true, message: 'Logged out successfully.' });
  }
});

authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ ok: false, message: 'User not found.' });
    return res.status(200).json({ ok: true, data: toAuthUser(user) });
  } catch {
    return res.status(500).json({ ok: false, message: 'Failed to fetch account.' });
  }
});

authRouter.get('/maintenance/pending', requireAuth, requireRoles('admin'), async (_req, res) => {
  try {
    const pendingStaff = await User.find({ role: 'staff', isActive: false, isSuspended: false }).sort({ createdAt: -1 });
    return res.status(200).json({ ok: true, data: pendingStaff.map(toAuthUser), count: pendingStaff.length });
  } catch {
    return res.status(500).json({ ok: false, message: 'Failed to fetch pending maintenance staff.' });
  }
});

authRouter.patch(
  '/maintenance/:email/approve',
  requireAuth,
  requireRoles('admin'),
  [param('email').isEmail(), handleValidation],
  async (req, res) => {
    try {
      const email = String(req.params.email).toLowerCase();
      const staff = await User.findOne({ email, role: 'staff' });
      if (!staff) {
        return res.status(404).json({ ok: false, message: 'Staff not found.' });
      }

      if (staff.isActive && !staff.isSuspended) {
        return res.status(400).json({ ok: false, message: 'Already approved.' });
      }

      staff.isActive = true;
      staff.isSuspended = false;
      await staff.save();

      return res.status(200).json({ ok: true, message: 'Staff approved successfully.', data: toAuthUser(staff) });
    } catch {
      return res.status(500).json({ ok: false, message: 'Failed to approve staff.' });
    }
  }
);

authRouter.delete(
  '/maintenance/:email/reject',
  requireAuth,
  requireRoles('admin'),
  [param('email').isEmail(), handleValidation],
  async (req, res) => {
    try {
      const email = String(req.params.email).toLowerCase();
      const result = await User.deleteOne({ email, role: 'staff', isActive: false });
      if (!result.deletedCount) {
        return res.status(404).json({ ok: false, message: 'Staff not found.' });
      }

      return res.status(200).json({ ok: true, message: 'Staff registration rejected.' });
    } catch {
      return res.status(500).json({ ok: false, message: 'Failed to reject staff registration.' });
    }
  }
);
