export const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: 'Very weak' };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { score, label: 'Weak' };
  if (score === 3) return { score, label: 'Moderate' };
  if (score === 4) return { score, label: 'Strong' };
  return { score, label: 'Very strong' };
};

export const getStrengthBarClass = (score) => {
  if (score <= 2) return 'bg-red-500';
  if (score === 3) return 'bg-amber-500';
  return 'bg-emerald-500';
};
