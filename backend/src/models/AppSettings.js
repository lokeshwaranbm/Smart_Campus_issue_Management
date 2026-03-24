import mongoose from 'mongoose';

const DEFAULT_SETTINGS = {
  sla: {
    defaultSlaHours: 48,
    escalationTimeHours: 24,
    enableAutoEscalation: true,
    notifyOnEscalation: true,
  },
  staff: {
    maxIssuesPerStaff: 10,
    autoAssignmentEnabled: true,
    staffRoleHierarchy: ['Junior', 'Senior', 'Lead'],
    workingHoursStart: '09:00',
    workingHoursEnd: '18:00',
  },
  notifications: {
    enableRealtimeNotifications: true,
    enableEmailAlerts: true,
    enableSMSAlerts: false,
    enableEscalationAlerts: true,
    enableDailySummary: true,
  },
  campusInfo: {
    universityName: 'Your University Name',
    contactEmail: 'admin@university.edu',
    contactPhone: '+91-XXXXXXXXXX',
    address: 'Campus Address',
  },
  security: {
    passwordMinLength: 8,
    sessionTimeoutMinutes: 30,
    loginAttemptLimit: 5,
    accountLockDurationMinutes: 15,
  },
  system: {
    paginationLimit: 10,
    defaultDashboardView: 'overview',
    themeMode: 'light',
    dataRetentionDays: 365,
    autoArchiveDays: 30,
  },
  priorities: {
    low: { color: 'green', threshold: 0 },
    medium: { color: 'yellow', threshold: 5 },
    high: { color: 'red', threshold: 10 },
    critical: { color: 'darkred', threshold: 15 },
  },
};

const AppSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'global',
      index: true,
    },
    sla: {
      type: Object,
      default: DEFAULT_SETTINGS.sla,
    },
    staff: {
      type: Object,
      default: DEFAULT_SETTINGS.staff,
    },
    notifications: {
      type: Object,
      default: DEFAULT_SETTINGS.notifications,
    },
    campusInfo: {
      type: Object,
      default: DEFAULT_SETTINGS.campusInfo,
    },
    security: {
      type: Object,
      default: DEFAULT_SETTINGS.security,
    },
    system: {
      type: Object,
      default: DEFAULT_SETTINGS.system,
    },
    priorities: {
      type: Object,
      default: DEFAULT_SETTINGS.priorities,
    },
  },
  { timestamps: true }
);

export const AppSettings = mongoose.model('AppSettings', AppSettingsSchema);
export const APP_SETTINGS_DEFAULTS = DEFAULT_SETTINGS;
