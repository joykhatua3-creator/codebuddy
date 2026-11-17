// Run with: npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const accounts = [
  { name: 'Demo Teacher', email: 'teacher@crbuddy.com', password: 'Teacher@123', role: 'teacher' },
  { name: 'Demo Student', email: 'student@crbuddy.com', password: 'Student@123', role: 'student' },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    for (const acc of accounts) {
      const exists = await User.findOne({ email: acc.email });
      if (exists) {
        console.log(`Skipped (exists): ${acc.email}`);
        continue;
      }
      await User.create(acc);
      console.log(`Created ${acc.role}: ${acc.email}`);
    }
  } catch (err) {
    console.error('Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
  }
})();
