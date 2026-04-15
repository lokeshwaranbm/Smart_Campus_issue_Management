import xss from 'xss';

export const sanitizeString = (value) => {
  if (typeof value !== 'string') return value;
  return xss(value.trim());
};

export const sanitizeObjectStrings = (payload) => {
  if (!payload || typeof payload !== 'object') return payload;

  if (Array.isArray(payload)) {
    return payload.map((entry) => sanitizeObjectStrings(entry));
  }

  const result = {};
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else if (value && typeof value === 'object') {
      result[key] = sanitizeObjectStrings(value);
    } else {
      result[key] = value;
    }
  }

  return result;
};
