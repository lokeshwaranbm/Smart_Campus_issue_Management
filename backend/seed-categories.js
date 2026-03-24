/**
 * Sample data seeding script for SLA categories
 * Run this to initialize the database with standard categories
 * Usage: node seed-categories.js
 */

import mongoose from 'mongoose';
import { Category } from './src/models/Category.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-campus';

const SAMPLE_CATEGORIES = [
  {
    name: 'Electrical',
    description: 'Electrical issues including power outages, switch failures, wiring problems',
    slaHours: 24,
  },
  {
    name: 'Plumbing',
    description: 'Plumbing issues including leaks, blockages, water supply problems',
    slaHours: 48,
  },
  {
    name: 'Network',
    description: 'Network and IT issues including internet connectivity, cable problems',
    slaHours: 16,
  },
  {
    name: 'Cleanliness',
    description: 'Campus cleanliness issues, maintenance of public areas',
    slaHours: 72,
  },
  {
    name: 'Hostel',
    description: 'Hostel-specific issues including furniture, fixtures, amenities',
    slaHours: 48,
  },
  {
    name: 'Transport',
    description: 'Campus transport issues including shuttle services, parking',
    slaHours: 96,
  },
  {
    name: 'Maintenance',
    description: 'General building maintenance, repairs, replacements',
    slaHours: 48,
  },
  {
    name: 'Other',
    description: 'Other miscellaneous issues',
    slaHours: 72,
  },
];

const seedCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('🗑️  Cleared existing categories');

    // Insert sample categories
    const created = await Category.insertMany(
      SAMPLE_CATEGORIES.map((cat) => ({
        ...cat,
        createdBy: new mongoose.Types.ObjectId(),
        isActive: true,
      }))
    );

    console.log(`✅ Created ${created.length} categories:`);
    created.forEach((cat) => {
      console.log(`   - ${cat.name} (${cat.slaHours}h SLA)`);
    });

    // Disconnect
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding categories:', error.message);
    process.exit(1);
  }
};

// Run seeding
seedCategories();
