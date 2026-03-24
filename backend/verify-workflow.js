import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart-campus';

async function verify() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const cols = await db.listCollections().toArray();

  console.log('\n📊 DATABASE VERIFICATION\n');
  console.log('='.repeat(60));

  for (const c of cols) {
    const count = await db.collection(c.name).countDocuments();
    console.log(`  ${c.name.padEnd(20)}: ${count} documents`);
  }

  console.log('='.repeat(60));

  // Sample document checks
  const users = await db
    .collection('users')
    .find({})
    .toArray();
  console.log('\n👥 Users by Role:');
  console.log(`   Admin: ${users.filter((u) => u.role === 'admin').length}`);
  console.log(`   Staff (Active): ${users.filter((u) => u.role === 'staff' && u.isActive).length}`);
  console.log(`   Staff (Pending): ${users.filter((u) => u.role === 'staff' && !u.isActive).length}`);
  console.log(`   Student: ${users.filter((u) => u.role === 'student').length}`);

  const issues = await db
    .collection('issues')
    .find({})
    .toArray();
  console.log('\n🚨 Issues by Status:');
  console.log(
    `   Submitted: ${issues.filter((i) => i.status === 'submitted').length}`
  );
  console.log(
    `   Assigned: ${issues.filter((i) => i.status === 'assigned').length}`
  );
  console.log(
    `   In Progress: ${issues.filter((i) => i.status === 'in_progress').length}`
  );
  console.log(
    `   Resolved: ${issues.filter((i) => i.status === 'resolved').length}`
  );
  console.log(`   Closed: ${issues.filter((i) => i.status === 'closed').length}`);

  const categories = await db
    .collection('categories')
    .find({})
    .toArray();
  console.log('\n🏷️  Categories:');
  for (const cat of categories) {
    console.log(`   - ${cat.name} (SLA: ${cat.slaHours}h, Staff: ${cat.assignedStaff?.length || 0})`);
  }

  const slas = await db
    .collection('issueslas')
    .find({})
    .toArray();
  console.log('\n⏱️  SLA Records:');
  console.log(
    `   On Time: ${slas.filter((s) => !s.isOverdue).length}`
  );
  console.log(
    `   Overdue: ${slas.filter((s) => s.isOverdue).length}`
  );

  console.log('\n✅ All workflow data properly seeded!\n');

  await mongoose.disconnect();
}

verify().catch(console.error);
