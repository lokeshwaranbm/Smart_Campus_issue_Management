import { Router } from 'express';

export const authRouter = Router();

authRouter.post('/register/student', (req, res) => {
  const payload = req.body;
  return res.status(201).json({
    ok: true,
    message: 'Student registered (backend stub).',
    data: { ...payload, role: 'student', status: 'active' },
  });
});

authRouter.post('/register/maintenance', (req, res) => {
  const payload = req.body;
  return res.status(201).json({
    ok: true,
    message: 'Maintenance registration submitted.',
    data: { ...payload, role: 'maintenance', status: 'pending_approval' },
  });
});

authRouter.post('/login', (req, res) => {
  const { email, role } = req.body;

  return res.status(200).json({
    ok: true,
    message: 'Login endpoint connected (backend stub).',
    data: {
      email,
      role,
      redirectTo:
        role === 'student'
          ? '/dashboard/student'
          : role === 'maintenance'
          ? '/dashboard/maintenance'
          : '/dashboard/admin',
    },
  });
});
