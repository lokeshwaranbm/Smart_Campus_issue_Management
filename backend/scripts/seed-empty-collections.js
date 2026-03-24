import mongoose from 'mongoose';

const uri = 'mongodb://127.0.0.1:27017/smart-campus';

const now = new Date();
const oid = () => new mongoose.Types.ObjectId();

async function upsertOneIfEmpty(db, name, docFactory) {
  const collection = db.collection(name);
  const count = await collection.countDocuments();
  if (count === 0) {
    await collection.insertOne(docFactory());
    console.log(`inserted:${name}`);
  } else {
    console.log(`skipped:${name}:${count}`);
  }
}

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const user = await db.collection('users').findOne({});
  const issue = await db.collection('issues').findOne({});

  let departmentId = oid();
  let categoryId = oid();

  await upsertOneIfEmpty(db, 'departments', () => ({
    _id: departmentId,
    name: 'Facilities',
    code: 'FAC',
    description: 'Campus facilities team',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }));

  const existingDepartment = await db.collection('departments').findOne({});
  if (existingDepartment?._id) departmentId = existingDepartment._id;

  await upsertOneIfEmpty(db, 'categories', () => ({
    _id: categoryId,
    name: 'Electrical',
    description: 'Electrical maintenance issues',
    assignedStaff: user?._id ? [user._id] : [],
    slaHours: 24,
    isActive: true,
    createdBy: user?._id || oid(),
    createdAt: now,
    updatedAt: now,
  }));

  const existingCategory = await db.collection('categories').findOne({});
  if (existingCategory?._id) categoryId = existingCategory._id;

  await upsertOneIfEmpty(db, 'campuslocations', () => ({
    campus: 'Main Campus',
    zone: 'A',
    building: 'Block 1',
    floor: 'Ground',
    room: 'G-01',
    label: 'Main Gate Area',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }));

  await upsertOneIfEmpty(db, 'notifications', () => ({
    userId: user?._id || oid(),
    issueId: issue?._id || oid(),
    message: 'Sample notification',
    type: 'assignment',
    escalationLevel: 0,
    isRead: false,
    actionUrl: '/issues',
    metadata: {
      issueTitle: issue?.title || 'Sample Issue',
    },
    createdAt: now,
    updatedAt: now,
  }));

  await upsertOneIfEmpty(db, 'issueslas', () => ({
    issueId: issue?._id || oid(),
    categoryId,
    assignedTo: user?._id || null,
    slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
    escalationLevel: 0,
    isOverdue: false,
    warningSent: false,
    escalationWarningsSent: 0,
    completedAt: null,
    completedOnTime: null,
    overdueHours: 0,
    lastEscalationAt: null,
    createdAt: now,
    updatedAt: now,
  }));

  await upsertOneIfEmpty(db, 'issueupdates', () => ({
    issueId: issue?._id || oid(),
    eventType: 'created',
    previousValue: null,
    newValue: { status: 'submitted' },
    note: 'Initial sample timeline event',
    changedBy: user?._id || null,
    changedByEmail: user?.email || null,
    createdAt: now,
    updatedAt: now,
  }));

  await upsertOneIfEmpty(db, 'issuecomments', () => ({
    issueId: issue?._id || oid(),
    authorId: user?._id || null,
    authorEmail: user?.email || 'sample@campus.edu',
    authorName: user?.name || 'Sample User',
    body: 'Sample comment for testing',
    visibility: 'public',
    isEdited: false,
    editedAt: null,
    createdAt: now,
    updatedAt: now,
  }));

  await upsertOneIfEmpty(db, 'issueattachments', () => ({
    issueId: issue?._id || oid(),
    uploadedBy: user?._id || null,
    uploadedByEmail: user?.email || null,
    fileName: 'sample.txt',
    mimeType: 'text/plain',
    sizeBytes: 1234,
    storageProvider: 'local',
    storageKey: 'sample/sample.txt',
    publicUrl: null,
    checksum: 'abc123',
    createdAt: now,
    updatedAt: now,
  }));

  await upsertOneIfEmpty(db, 'slapolicies', () => ({
    name: 'Default Electrical SLA',
    categoryId,
    departmentId,
    priority: 'medium',
    firstResponseMinutes: 60,
    resolutionMinutes: 1440,
    businessHoursOnly: false,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }));

  await upsertOneIfEmpty(db, 'auditlogs', () => ({
    actorId: user?._id || null,
    actorRole: user?.role || 'system',
    actorEmail: user?.email || null,
    action: 'seeded_sample_data',
    entityType: 'system',
    entityId: null,
    before: null,
    after: { seeded: true },
    ipAddress: '127.0.0.1',
    userAgent: 'manual-seed',
    createdAt: now,
    updatedAt: now,
  }));

  const names = [
    'users',
    'issues',
    'categories',
    'notifications',
    'issueslas',
    'departments',
    'campuslocations',
    'issueupdates',
    'issuecomments',
    'issueattachments',
    'slapolicies',
    'auditlogs',
  ];

  for (const name of names) {
    const count = await db.collection(name).countDocuments();
    console.log(`${name}:${count}`);
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors
  }
  process.exit(1);
});
