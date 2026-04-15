import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_me';

export const signAccessToken = (user) => {
  const payload = {
    sub: String(user._id),
    email: String(user.email).toLowerCase(),
    role: user.role,
  };

  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    issuer: 'smart-campus-backend',
    audience: 'smart-campus-frontend',
  });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_TOKEN_SECRET, {
    issuer: 'smart-campus-backend',
    audience: 'smart-campus-frontend',
  });
};

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ ok: false, message: 'Authentication required.' });
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
    return next();
  } catch {
    return res.status(401).json({ ok: false, message: 'Invalid or expired access token.' });
  }
};

export const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ ok: false, message: 'Insufficient permissions.' });
    }

    return next();
  };
};
