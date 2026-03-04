import { getSettings } from './settings';

const LOGIN_ATTEMPTS_KEY = 'smart-campus-login-attempts';
const LOCKED_ACCOUNTS_KEY = 'smart-campus-locked-accounts';

const getAttemptStore = () => {
  try {
    return JSON.parse(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '{}');
  } catch (error) {
    return {};
  }
};

const setAttemptStore = (data) => {
  localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(data));
};

const getLockStore = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCKED_ACCOUNTS_KEY) || '{}');
  } catch (error) {
    return {};
  }
};

const setLockStore = (data) => {
  localStorage.setItem(LOCKED_ACCOUNTS_KEY, JSON.stringify(data));
};

const getEmailKey = (email) => (email || '').trim().toLowerCase();

const getSecurityLimits = () => {
  const settings = getSettings();
  const security = settings?.security || {};

  return {
    loginAttemptLimit: Number(security.loginAttemptLimit) || 5,
    accountLockDurationMinutes: Number(security.accountLockDurationMinutes) || 15,
  };
};

export const getLoginAttempts = (email) => {
  const emailKey = getEmailKey(email);
  if (!emailKey) return { count: 0, lastAttempt: null };

  const attempts = getAttemptStore();
  return attempts[emailKey] || { count: 0, lastAttempt: null };
};

export const clearLoginAttempts = (email) => {
  const emailKey = getEmailKey(email);
  if (!emailKey) return;

  const attempts = getAttemptStore();
  delete attempts[emailKey];
  setAttemptStore(attempts);
};

export const isAccountLocked = (email) => {
  const emailKey = getEmailKey(email);
  if (!emailKey) return false;

  const locks = getLockStore();
  const lockInfo = locks[emailKey];
  if (!lockInfo?.lockedUntil) return false;

  const stillLocked = Date.now() < lockInfo.lockedUntil;
  if (!stillLocked) {
    delete locks[emailKey];
    setLockStore(locks);
    return false;
  }

  return true;
};

export const getLockTimeRemaining = (email) => {
  const emailKey = getEmailKey(email);
  if (!emailKey) return 0;

  const locks = getLockStore();
  const lockInfo = locks[emailKey];
  if (!lockInfo?.lockedUntil) return 0;

  const msRemaining = lockInfo.lockedUntil - Date.now();
  if (msRemaining <= 0) return 0;

  return Math.ceil(msRemaining / (60 * 1000));
};

export const lockAccount = (email) => {
  const emailKey = getEmailKey(email);
  if (!emailKey) return;

  const { accountLockDurationMinutes } = getSecurityLimits();
  const locks = getLockStore();

  locks[emailKey] = {
    lockedAt: Date.now(),
    lockedUntil: Date.now() + accountLockDurationMinutes * 60 * 1000,
  };

  setLockStore(locks);
};

export const recordFailedLogin = (email) => {
  const emailKey = getEmailKey(email);
  if (!emailKey) return;

  const { loginAttemptLimit } = getSecurityLimits();
  const attempts = getAttemptStore();
  const existing = attempts[emailKey] || { count: 0, lastAttempt: null };
  const nextCount = existing.count + 1;

  attempts[emailKey] = {
    count: nextCount,
    lastAttempt: Date.now(),
  };

  setAttemptStore(attempts);

  if (nextCount >= loginAttemptLimit) {
    lockAccount(emailKey);
    clearLoginAttempts(emailKey);
  }
};

export const checkLoginAttempt = (email) => {
  const emailKey = getEmailKey(email);
  const { loginAttemptLimit } = getSecurityLimits();

  if (!emailKey) {
    return {
      allowed: false,
      locked: false,
      message: 'Please enter a valid email address.',
      attemptsRemaining: 0,
    };
  }

  if (isAccountLocked(emailKey)) {
    const minutesRemaining = getLockTimeRemaining(emailKey);
    return {
      allowed: false,
      locked: true,
      message: `Account is temporarily locked. Try again in ${minutesRemaining} minute(s).`,
      minutesRemaining,
      attemptsRemaining: 0,
    };
  }

  const { count } = getLoginAttempts(emailKey);
  const attemptsRemaining = Math.max(loginAttemptLimit - count, 0);

  return {
    allowed: true,
    locked: false,
    attemptsRemaining,
  };
};
