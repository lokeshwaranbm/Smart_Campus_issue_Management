export const ISSUE_CATEGORIES = [
  { value: 'electrical', label: 'Electrical Issues' },
  { value: 'wifi', label: 'WiFi / Internet' },
  { value: 'laboratory', label: 'Laboratory Equipment' },
  { value: 'hostel', label: 'Hostel Maintenance' },
  { value: 'plumbing', label: 'Plumbing & Water' },
  { value: 'classroom', label: 'Classroom Infrastructure' },
  { value: 'cleanliness', label: 'Cleanliness & Hygiene' },
  { value: 'other', label: 'Other' },
];

export const ISSUE_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'text-emerald-600 bg-emerald-50' },
  { value: 'medium', label: 'Medium', color: 'text-amber-600 bg-amber-50' },
  { value: 'high', label: 'High', color: 'text-orange-600 bg-orange-50' },
  { value: 'critical', label: 'Critical', color: 'text-red-600 bg-red-50' },
];

export const ISSUE_STATUS = [
  { value: 'submitted', label: 'Submitted', color: 'bg-slate-100 text-slate-700' },
  { value: 'assigned', label: 'Assigned', color: 'bg-blue-100 text-blue-700' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-amber-100 text-amber-700' },
  { value: 'resolved', label: 'Resolved', color: 'bg-emerald-100 text-emerald-700' },
];

export const DEPARTMENTS = [
  { value: 'electrical', label: 'Electrical Department' },
  { value: 'plumbing', label: 'Plumbing & Water' },
  { value: 'ict', label: 'IT & Networking' },
  { value: 'infrastructure', label: 'Infrastructure & Building' },
  { value: 'cleanliness', label: 'Housekeeping & Cleanliness' },
  { value: 'general', label: 'General Maintenance' },
];

export const CATEGORY_TO_DEPARTMENT = {
  electrical: 'electrical',
  wifi: 'ict',
  laboratory: 'infrastructure',
  hostel: 'general',
  plumbing: 'plumbing',
  classroom: 'infrastructure',
  cleanliness: 'cleanliness',
  other: 'general',
};

export const generateIssueId = () => `ISS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
