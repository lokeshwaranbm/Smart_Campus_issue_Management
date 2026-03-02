const NOTIFICATIONS_KEY = 'smart-campus-admin-notifications';

export const getAdminNotifications = () => {
  const data = localStorage.getItem(NOTIFICATIONS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveAdminNotifications = (notifications) => {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
};

export const addUnassignedIssueNotification = (issueId, category, categoryLabel) => {
  const notifications = getAdminNotifications();
  
  // Check if notification already exists for this category
  const existingIndex = notifications.findIndex(
    (n) => n.type === 'no-staff' && n.category === category
  );
  
  if (existingIndex !== -1) {
    // Update existing notification
    notifications[existingIndex].issues.push(issueId);
    notifications[existingIndex].count = notifications[existingIndex].issues.length;
    notifications[existingIndex].lastOccurred = new Date().toISOString();
  } else {
    // Create new notification
    notifications.push({
      id: `notif-${Date.now()}`,
      type: 'no-staff',
      category,
      categoryLabel,
      issues: [issueId],
      count: 1,
      message: `No staff assigned to handle "${categoryLabel}" issues. Please assign staff members to this category.`,
      createdAt: new Date().toISOString(),
      lastOccurred: new Date().toISOString(),
      dismissed: false,
    });
  }
  
  saveAdminNotifications(notifications);
};

export const dismissNotification = (notificationId) => {
  const notifications = getAdminNotifications();
  const notification = notifications.find((n) => n.id === notificationId);
  
  if (notification) {
    notification.dismissed = true;
    saveAdminNotifications(notifications);
  }
};

export const clearDismissedNotifications = () => {
  const notifications = getAdminNotifications();
  const active = notifications.filter((n) => !n.dismissed);
  saveAdminNotifications(active);
};

export const getActiveNotifications = () => {
  const notifications = getAdminNotifications();
  return notifications.filter((n) => !n.dismissed);
};
