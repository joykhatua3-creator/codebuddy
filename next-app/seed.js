import mongoose from 'mongoose';
import User from './models/User.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/code-review-buddy';

const seed = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await User.deleteMany({ email: { $in: ['teacher@crbuddy.com', 'student@crbuddy.com'] } });

    const teacher = await User.create({
      name: 'Dr. Sarah Ahmed',
      email: 'teacher@crbuddy.com',
      password: 'Teacher@123',
      role: 'teacher',
    });
    console.log('✅ Teacher created:', teacher.email);

    const student = await User.create({
      name: 'Ali Hassan',
      email: 'student@crbuddy.com',
      password: 'Student@123',
      role: 'student',
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
