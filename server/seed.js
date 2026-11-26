/**
 * Seed script: Creates a default teacher and student account for testing.
 * Run once: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing test accounts
    await User.deleteMany({ email: { $in: ['teacher@crbuddy.com', 'student@crbuddy.com'] } });

    // Create teacher
    const teacher = await User.create({
      name: 'Dr. Sarah Ahmed',
      email: 'teacher@crbuddy.com',
      password: 'Teacher@123',
      role: 'teacher',
      isDemo: true,
    });
    console.log('✅ Teacher created:', teacher.email);

    // Create student
    const student = await User.create({
      name: 'Ali Hassan',
      email: 'student@crbuddy.com',
      password: 'Student@123',
      role: 'student',
      isDemo: true,
    });
    console.log('✅ Student created:', student.email);

    console.log('\n📋 Test Credentials:');
    console.log('Teacher: teacher@crbuddy.com / Teacher@123');
    console.log('Student: student@crbuddy.com / Student@123');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seed();
