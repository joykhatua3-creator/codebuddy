const mongoose = require('mongoose');
const dns = require('dns');

// On Windows, local ISP DNS often fails to resolve MongoDB SRV records. Fall back to reliable public DNS.
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('<db_username>') || uri.includes('<username>') || uri.includes('<db_password>') || uri.includes('<password>')) {
    console.warn('\n⚠️  WARNING: MONGODB_URI in server/.env is missing or contains placeholder values (<db_username>, <db_password>).');
    console.warn('   Please update server/.env with your real MongoDB Atlas or local MongoDB connection string.\n');
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('   Please verify that your MongoDB connection string in server/.env is valid and your network/IP is whitelisted in MongoDB Atlas.\n');
    process.exit(1);
  }
};

module.exports = connectDB;
