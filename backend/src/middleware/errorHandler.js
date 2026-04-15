import { logger } from '../config/logger.js';

export const notFoundHandler = (req, res) => {
  res.status(404).json({ ok: false, message: 'Route not found.' });
};

export const errorHandler = (err, req, res, _next) => {
  const status = err.status || 500;

  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  return res.status(status).json({
    ok: false,
    message: status >= 500 ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV === 'development' && status >= 500 ? { debug: err.message } : {}),
  });
};
