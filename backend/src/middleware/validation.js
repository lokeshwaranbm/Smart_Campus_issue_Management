import { validationResult } from 'express-validator';
import { sanitizeObjectStrings } from '../utils/sanitize.js';

export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      ok: false,
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObjectStrings(req.body);
  }

  return next();
};
