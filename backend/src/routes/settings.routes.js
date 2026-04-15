import { Router } from 'express';
import { AppSettings, APP_SETTINGS_DEFAULTS } from '../models/AppSettings.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

export const settingsRouter = Router();
settingsRouter.use('/settings', requireAuth, requireRoles('admin'));

const ALLOWED_SECTIONS = [
  'sla',
  'staff',
  'notifications',
  'campusInfo',
  'security',
  'system',
  'priorities',
];

const ensureSettingsDocument = async () => {
  let settings = await AppSettings.findOne({ key: 'global' }).lean();
  if (!settings) {
    const created = await AppSettings.create({ key: 'global', ...APP_SETTINGS_DEFAULTS });
    settings = created.toObject();
  }
  return settings;
};

settingsRouter.get('/settings', async (_req, res) => {
  try {
    const settings = await ensureSettingsDocument();
    res.status(200).json({
      ok: true,
      data: {
        sla: settings.sla,
        staff: settings.staff,
        notifications: settings.notifications,
        campusInfo: settings.campusInfo,
        security: settings.security,
        system: settings.system,
        priorities: settings.priorities,
      },
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Failed to fetch settings', error: error.message });
  }
});

settingsRouter.patch('/settings/:section', async (req, res) => {
  try {
    const { section } = req.params;
    const payload = req.body || {};

    if (!ALLOWED_SECTIONS.includes(section)) {
      return res.status(400).json({ ok: false, message: 'Invalid settings section' });
    }

    const current = await ensureSettingsDocument();
    const mergedSection = {
      ...(current[section] || {}),
      ...payload,
    };

    const updated = await AppSettings.findOneAndUpdate(
      { key: 'global' },
      {
        $set: {
          [section]: mergedSection,
        },
      },
      { new: true }
    ).lean();

    res.status(200).json({
      ok: true,
      message: `${section} updated successfully`,
      data: {
        [section]: updated[section],
      },
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Failed to update settings', error: error.message });
  }
});

settingsRouter.post('/settings/reset', async (_req, res) => {
  try {
    const updated = await AppSettings.findOneAndUpdate(
      { key: 'global' },
      {
        $set: {
          sla: APP_SETTINGS_DEFAULTS.sla,
          staff: APP_SETTINGS_DEFAULTS.staff,
          notifications: APP_SETTINGS_DEFAULTS.notifications,
          campusInfo: APP_SETTINGS_DEFAULTS.campusInfo,
          security: APP_SETTINGS_DEFAULTS.security,
          system: APP_SETTINGS_DEFAULTS.system,
          priorities: APP_SETTINGS_DEFAULTS.priorities,
        },
      },
      { upsert: true, new: true }
    ).lean();

    res.status(200).json({
      ok: true,
      message: 'Settings reset to default',
      data: {
        sla: updated.sla,
        staff: updated.staff,
        notifications: updated.notifications,
        campusInfo: updated.campusInfo,
        security: updated.security,
        system: updated.system,
        priorities: updated.priorities,
      },
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Failed to reset settings', error: error.message });
  }
});
