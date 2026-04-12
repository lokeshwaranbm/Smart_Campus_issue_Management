import { Router } from 'express';
import { User } from '../models/User.js';

export const authRouter = Router();

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

const ensureDefaultAdmin = async () => {
  const adminEmail = 'admin@university.edu';
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (existingAdmin) return;

  await User.create({
    name: 'System Administrator',
    email: adminEmail,
    password: 'Admin@123',
    role: 'admin',
    isActive: true,
    isSuspended: false,
  });
};

authRouter.post('/register/student', async (req, res) => {
  try {
    await ensureDefaultAdmin();

    const { fullName, email, password, registerNumber, department, semester } = req.body;

    if (!fullName || !email || !password || !registerNumber || !department || !semester) {
      return res.status(400).json({
        ok: false,
        message: 'All required fields must be provided.',
      });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) {
      return res.status(409).json({
        ok: false,
        message: 'An account with this email already exists.',
      });
    }

    const user = await User.create({
      name: fullName,
      email,
      password,
      role: 'student',
      department,
      registerNumber,
      semester,
      isActive: true,
      isSuspended: false,
    });

    return res.status(201).json({
      ok: true,
      message: 'Student account created successfully.',
      data: toAuthUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Failed to register student account.',
      error: error.message,
    });
  }
});

authRouter.post('/register/maintenance', async (req, res) => {
  try {
    await ensureDefaultAdmin();

    const { fullName, email, employeeId, department, phoneNumber, password } = req.body;

    if (!fullName || !email || !employeeId || !department || !phoneNumber || !password) {
      return res.status(400).json({
        ok: false,
        message: 'All required fields must be provided.',
      });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) {
      return res.status(409).json({
        ok: false,
        message: 'An account with this email already exists.',
      });
    }

    const user = await User.create({
      name: fullName,
      email,
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
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Failed to submit maintenance registration.',
      error: error.message,
    });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    await ensureDefaultAdmin();

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        message: 'Email and password are required.',
      });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        ok: false,
        message: 'Invalid email, password, or account not found.',
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        ok: false,
        message: 'Invalid email, password, or account not found.',
      });
    }

    const frontendRole = getFrontendRole(user.role);
    const status = getAccountStatus(user);

    if (frontendRole === 'maintenance' && status === 'pending_approval') {
      return res.status(403).json({
        ok: false,
        message: 'Account pending admin approval.',
        pendingApproval: true,
      });
    }

    if (frontendRole === 'student' && status !== 'active') {
      return res.status(403).json({
        ok: false,
        message: 'Reporter account is disabled. Please contact admin.',
      });
    }

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
        redirectTo,
      },
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Login failed.',
      error: error.message,
    });
  }
});

authRouter.get('/maintenance/pending', async (_req, res) => {
  try {
    const pendingStaff = await User.find({ role: 'staff', isActive: false, isSuspended: false }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      ok: true,
      data: pendingStaff.map(toAuthUser),
      count: pendingStaff.length,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Failed to fetch pending maintenance staff.',
      error: error.message,
    });
  }
});

authRouter.patch('/maintenance/:email/approve', async (req, res) => {
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

    return res.status(200).json({
      ok: true,
      message: 'Staff approved successfully.',
      data: toAuthUser(staff),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Failed to approve staff.',
      error: error.message,
    });
  }
});

authRouter.delete('/maintenance/:email/reject', async (req, res) => {
  try {
    const email = String(req.params.email).toLowerCase();
    const result = await User.deleteOne({ email, role: 'staff', isActive: false });

    if (!result.deletedCount) {
      return res.status(404).json({ ok: false, message: 'Staff not found.' });
    }

    return res.status(200).json({ ok: true, message: 'Staff registration rejected.' });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Failed to reject staff registration.',
      error: error.message,
    });
  }
});
