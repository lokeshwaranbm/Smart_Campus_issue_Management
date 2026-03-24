/**
 * Complete Workflow Seeding Script
 * 
 * Creates realistic test data for all verified API flows:
 * 1. Admin login workflow
 * 2. Student signup & login
 * 3. Maintenance staff registration & approval
 * 4. Issue creation, assignment, commenting
 * 5. SLA tracking and escalation
 * 6. Category and staff management
 */

import mongoose from 'mongoose';
import { User } from './src/models/User.js';
import { Issue } from './src/models/Issue.js';
import { Category } from './src/models/Category.js';
import { IssueSLA } from './src/models/IssueSLA.js';
import { IssueComment } from './src/models/IssueComment.js';
import { IssueUpdate } from './src/models/IssueUpdate.js';
import { Notification } from './src/models/Notification.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart-campus';

const seedWorkflow = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Issue.deleteMany({}),
      Category.deleteMany({}),
      IssueSLA.deleteMany({}),
      IssueComment.deleteMany({}),
      IssueUpdate.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    console.log('🗑️  Cleared all existing data\n');

    // ============ STEP 1: CREATE ADMIN AND STAFF USERS ============
    console.log('📝 Creating users...');

    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@university.edu',
      password: 'Admin@123',
      role: 'admin',
      department: 'administration',
      isActive: true,
      isSuspended: false,
    });
    console.log(`   ✓ Admin: ${admin.email}`);

    // Active maintenance staff
    const staff1 = await User.create({
      name: 'Rajesh Kumar',
      email: 'rajesh@university.edu',
      password: 'Staff@123',
      role: 'staff',
      department: 'electrical',
      phone: '+91-9876543210',
      employeeId: 'EMP001',
      isActive: true,
      isSuspended: false,
    });
    console.log(`   ✓ Staff (Active): ${staff1.email}`);

    const staff2 = await User.create({
      name: 'Priya Singh',
      email: 'priya@university.edu',
      password: 'Staff@123',
      role: 'staff',
      department: 'plumbing',
      phone: '+91-9876543211',
      employeeId: 'EMP002',
      isActive: true,
      isSuspended: false,
    });
    console.log(`   ✓ Staff (Active): ${staff2.email}`);

    // Pending maintenance staff (awaiting approval)
    const staffPending = await User.create({
      name: 'Amit Verma',
      email: 'amit@university.edu',
      password: 'Staff@123',
      role: 'staff',
      department: 'infrastructure',
      phone: '+91-9876543212',
      employeeId: 'EMP003',
      isActive: false, // Pending approval
      isSuspended: false,
    });
    console.log(`   ✓ Staff (Pending Approval): ${staffPending.email}`);

    // Student reporters
    const student1 = await User.create({
      name: 'Arjun Patel',
      email: 's1@gmail.com',
      password: 'Student@123',
      role: 'student',
      department: 'computer-science',
      registerNumber: 'CS2021001',
      semester: '6',
      isActive: true,
      isSuspended: false,
    });
    console.log(`   ✓ Student: ${student1.email}`);

    const student2 = await User.create({
      name: 'Divya Sharma',
      email: 's2@gmail.com',
      password: 'Student@123',
      role: 'student',
      department: 'mechanical',
      registerNumber: 'ME2021005',
      semester: '4',
      isActive: true,
      isSuspended: false,
    });
    console.log(`   ✓ Student: ${student2.email}`);

    const student3 = await User.create({
      name: 'Vikram Singh',
      email: 's3@gmail.com',
      password: 'Student@123',
      role: 'student',
      department: 'electrical',
      registerNumber: 'EE2021012',
      semester: '5',
      isActive: false, // Disabled reporter
      isSuspended: false,
    });
    console.log(`   ✓ Student (Inactive): ${student3.email}\n`);

    // ============ STEP 2: CREATE CATEGORIES ============
    console.log('🏷️  Creating categories...');

    const categories = await Category.insertMany([
      {
        name: 'Electrical',
        description: 'Electrical issues including power outages, switch failures, wiring problems',
        assignedStaff: [staff1._id],
        slaHours: 24,
        isActive: true,
        createdBy: admin._id,
      },
      {
        name: 'Plumbing',
        description: 'Plumbing issues including leaks, blockages, water supply problems',
        assignedStaff: [staff2._id],
        slaHours: 48,
        isActive: true,
        createdBy: admin._id,
      },
      {
        name: 'Network',
        description: 'Network and IT issues including internet connectivity, cable problems',
        assignedStaff: [staff1._id, staff2._id],
        slaHours: 16,
        isActive: true,
        createdBy: admin._id,
      },
      {
        name: 'Cleanliness',
        description: 'Campus cleanliness issues, maintenance of public areas',
        assignedStaff: [],
        slaHours: 72,
        isActive: true,
        createdBy: admin._id,
      },
      {
        name: 'Hostel',
        description: 'Hostel-specific issues including furniture, fixtures, amenities',
        assignedStaff: [],
        slaHours: 48,
        isActive: true,
        createdBy: admin._id,
      },
      {
        name: 'Transport',
        description: 'Campus transport issues including shuttle services, parking',
        assignedStaff: [],
        slaHours: 96,
        isActive: true,
        createdBy: admin._id,
      },
      {
        name: 'Maintenance',
        description: 'General building maintenance, repairs, replacements',
        assignedStaff: [staff1._id],
        slaHours: 48,
        isActive: true,
        createdBy: admin._id,
      },
      {
        name: 'Other',
        description: 'Other miscellaneous issues',
        assignedStaff: [],
        slaHours: 72,
        isActive: true,
        createdBy: admin._id,
      },
    ]);
    console.log(`   ✓ Created ${categories.length} categories\n`);

    // ============ STEP 3: CREATE ISSUES (Multiple Statuses) ============
    console.log('🚨 Creating issues with various statuses...');

    // Issue 1: Newly submitted (no assignment)
    const issue1 = await Issue.create({
      id: 'ISS-001',
      title: 'Main Gate Power Outage',
      description:
        'The main gate area has lost power. All lights and security cameras are down. This needs urgent attention.',
      category: 'electrical',
      categoryId: categories[0]._id,
      location: 'Main Gate',
      latitude: 13.0135,
      longitude: 77.5771,
      imageUrl: 'https://via.placeholder.com/400x300?text=Power+Outage',
      studentEmail: student1.email,
      studentName: student1.name,
      priority: 'high',
      status: 'submitted',
      assignedTo: null,
      assignedDepartment: null,
      supports: 15,
      supportedBy: ['user1@test.com', 'user2@test.com'],
      comments: [],
      remarks: [],
    });
    console.log(`   ✓ Issue 1 (submitted): ${issue1.id}`);

    // Issue 2: Assigned to staff
    const issue2 = await Issue.create({
      id: 'ISS-002',
      title: 'Hostel Block A - Water Leakage',
      description:
        'Severe water leakage from ceiling in Room 201, Block A hostel. Affecting multiple rooms. Water damage to furniture.',
      category: 'plumbing',
      categoryId: categories[1]._id,
      location: 'Hostel Block A',
      latitude: 13.0145,
      longitude: 77.5765,
      studentEmail: student2.email,
      studentName: student2.name,
      priority: 'critical',
      status: 'assigned',
      assignedTo: staff2.email,
      assignedToName: staff2.name,
      assignedDepartment: 'plumbing',
      assignedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      autoAssigned: true,
      supports: 8,
      supportedBy: ['s1@test.com'],
      comments: [],
      remarks: [],
    });
    console.log(`   ✓ Issue 2 (assigned): ${issue2.id}`);

    // Issue 3: In progress
    const issue3 = await Issue.create({
      id: 'ISS-003',
      title: 'WiFi Network Down - Building C',
      description: 'Internet connectivity completely lost in Building C. All 200+ computers are offline.',
      category: 'network',
      categoryId: categories[2]._id,
      location: 'Building C - Lab',
      latitude: 13.0155,
      longitude: 77.5780,
      studentEmail: student1.email,
      studentName: student1.name,
      priority: 'high',
      status: 'in_progress',
      assignedTo: staff1.email,
      assignedToName: staff1.name,
      assignedDepartment: 'infrastructure',
      assignedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      firstResponseAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      supports: 25,
      supportedBy: Array(25).fill().map((_, i) => `user${i}@test.com`),
      comments: [],
      remarks: [],
    });
    console.log(`   ✓ Issue 3 (in_progress): ${issue3.id}`);

    // Issue 4: Resolved
    const issue4 = await Issue.create({
      id: 'ISS-004',
      title: 'Broken Window - Classroom A-101',
      description: 'Window pane in classroom A-101 has been shattered. Poses safety risk.',
      category: 'maintenance',
      categoryId: categories[6]._id,
      location: 'Classroom A-101',
      latitude: 13.0125,
      longitude: 77.5755,
      studentEmail: student2.email,
      studentName: student2.name,
      priority: 'medium',
      status: 'resolved',
      assignedTo: staff1.email,
      assignedToName: staff1.name,
      assignedDepartment: 'electrical',
      assignedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      firstResponseAt: new Date(Date.now() - 22 * 60 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      supports: 3,
      supportedBy: [],
      comments: [],
      remarks: [],
    });
    console.log(`   ✓ Issue 4 (resolved): ${issue4.id}`);

    // Issue 5: Closed
    const issue5 = await Issue.create({
      id: 'ISS-005',
      title: 'Corridor Lights Not Working - Building D',
      description: 'Multiple ceiling lights are not functioning in the corridor of Building D.',
      category: 'electrical',
      categoryId: categories[0]._id,
      location: 'Building D - Corridor',
      latitude: 13.0165,
      longitude: 77.5790,
      studentEmail: student1.email,
      studentName: student1.name,
      priority: 'low',
      status: 'closed',
      assignedTo: staff1.email,
      assignedToName: staff1.name,
      assignedDepartment: 'electrical',
      assignedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      closedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      supports: 1,
      supportedBy: [],
      comments: [],
      remarks: [],
    });
    console.log(`   ✓ Issue 5 (closed): ${issue5.id}\n`);

    // ============ STEP 4: CREATE SLA RECORDS ============
    console.log('⏱️  Creating SLA records...');

    const sla1 = await IssueSLA.create({
      issueId: issue2._id,
      categoryId: categories[1]._id,
      assignedTo: staff2._id,
      slaDeadline: new Date(Date.now() + 22 * 60 * 60 * 1000), // 22 hours from now
      escalationLevel: 0,
      isOverdue: false,
    });
    console.log(`   ✓ SLA 1 (On Track): Deadline in 22 hours`);

    const sla2 = await IssueSLA.create({
      issueId: issue3._id,
      categoryId: categories[2]._id,
      assignedTo: staff1._id,
      slaDeadline: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours overdue
      escalationLevel: 1,
      isOverdue: true,
      warningSent: true,
    });
    console.log(`   ✓ SLA 2 (Overdue): 2 hours past deadline`);

    const sla3 = await IssueSLA.create({
      issueId: issue4._id,
      categoryId: categories[6]._id,
      assignedTo: staff1._id,
      slaDeadline: new Date(Date.now() - 22 * 60 * 60 * 1000),
      escalationLevel: 0,
      isOverdue: false,
      completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      completedOnTime: false,
      overdueHours: 2,
    });
    console.log(`   ✓ SLA 3 (Completed Late): 2 hours overdue\n`);

    // ============ STEP 5: CREATE COMMENTS AND UPDATES ============
    console.log('💬 Creating comments and issue updates...');

    // Comments on issue 3
    const comment1 = await IssueComment.create({
      issueId: issue3._id,
      authorId: staff1._id,
      authorEmail: staff1.email,
      authorName: staff1.name,
      body: 'Started diagnosing the network issue. Checking router configuration.',
      visibility: 'public',
    });

    const comment2 = await IssueComment.create({
      issueId: issue3._id,
      authorId: student1._id,
      authorEmail: student1.email,
      authorName: student1.name,
      body: 'Thank you for quick response. When do you expect it to be fixed?',
      visibility: 'public',
    });

    const comment3 = await IssueComment.create({
      issueId: issue3._id,
      authorId: staff1._id,
      authorEmail: staff1.email,
      authorName: staff1.name,
      body: 'Issue identified - faulty switch module. Replacement in progress.',
      visibility: 'public',
    });
    console.log(`   ✓ Created 3 comments on Issue 3`);

    // Issue updates (timeline)
    await IssueUpdate.create({
      issueId: issue3._id,
      eventType: 'created',
      previousValue: null,
      newValue: { status: 'submitted' },
      note: 'Issue reported by student',
      changedByEmail: student1.email,
    });

    await IssueUpdate.create({
      issueId: issue3._id,
      eventType: 'assigned',
      previousValue: { assignedTo: null },
      newValue: { assignedTo: staff1.email },
      note: 'Auto-assigned to Rajesh Kumar',
      changedByEmail: null,
    });

    await IssueUpdate.create({
      issueId: issue3._id,
      eventType: 'status_changed',
      previousValue: { status: 'assigned' },
      newValue: { status: 'in_progress' },
      note: 'Staff member started working',
      changedByEmail: staff1.email,
    });

    console.log(`   ✓ Created 3 issue updates for Issue 3\n`);

    // ============ STEP 6: CREATE NOTIFICATIONS ============
    console.log('🔔 Creating notifications...');

    await Notification.create({
      userId: staff1._id,
      message: '⚠️ Issue "WiFi Network Down - Building C" is now OVERDUE by 2 hours!',
      type: 'warning',
      isRead: false,
      metadata: {
        issueTitle: issue3.title,
        escalationLevel: 1,
        overdueHours: 2,
      },
    });

    await Notification.create({
      userId: staff2._id,
      message: '📋 Issue "Hostel Block A - Water Leakage" has been assigned to you.',
      type: 'assignment',
      isRead: true,
      metadata: {
        issueTitle: issue2.title,
      },
    });

    await Notification.create({
      userId: student1._id,
      message: '✅ Your issue "Main Gate Power Outage" has been received by the maintenance team.',
      type: 'completion',
      isRead: true,
      metadata: {
        issueTitle: issue1.title,
      },
    });

    console.log(`   ✓ Created 3 notifications\n`);

    // ============ SUMMARY ============
    console.log('\n' + '='.repeat(60));
    console.log('✅ WORKFLOW SEEDING COMPLETE');
    console.log('='.repeat(60));

    const counts = {
      users: await User.countDocuments(),
      issues: await Issue.countDocuments(),
      categories: await Category.countDocuments(),
      issueSLAs: await IssueSLA.countDocuments(),
      comments: await IssueComment.countDocuments(),
      updates: await IssueUpdate.countDocuments(),
      notifications: await Notification.countDocuments(),
    };

    console.log('\n📊 Database Summary:');
    console.log(`   Users: ${counts.users} (1 admin, 2 active staff, 1 pending staff, 3 students)`);
    console.log(`   Categories: ${counts.categories}`);
    console.log(`   Issues: ${counts.issues} (multiple statuses: submitted, assigned, in_progress, resolved, closed)`);
    console.log(`   SLA Records: ${counts.issueSLAs}`);
    console.log(`   Comments: ${counts.comments}`);
    console.log(`   Issue Updates: ${counts.updates}`);
    console.log(`   Notifications: ${counts.notifications}`);

    console.log('\n🧪 Test Accounts:');
    console.log('   Admin:');
    console.log('      Email: admin@university.edu');
    console.log('      Password: Admin@123');
    console.log('   Maintenance Staff (Active):');
    console.log('      Email: rajesh@university.edu or priya@university.edu');
    console.log('      Password: Staff@123');
    console.log('   Maintenance Staff (Pending Approval):');
    console.log('      Email: amit@university.edu');
    console.log('      Password: Staff@123');
    console.log('   Students:');
    console.log('      Email: s1@gmail.com, s2@gmail.com, or s3@gmail.com (inactive)');
    console.log('      Password: Student@123');

    console.log('\n📚 Ready for Testing:');
    console.log('   ✓ Admin login and dashboard');
    console.log('   ✓ Staff approval workflow');
    console.log('   ✓ Issue creation and assignment');
    console.log('   ✓ SLA tracking (on-time and overdue)');
    console.log('   ✓ Comments and issue updates');
    console.log('   ✓ Notifications system');
    console.log('   ✓ Category management');
    console.log('   ✓ Staff workload distribution');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
    process.exit(1);
  }
};

seedWorkflow();
