import mongoose from 'mongoose';
import dns from 'dns';

// Fallback to Google DNS to guarantee SRV resolution on Windows
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    if (!MONGODB_URI || MONGODB_URI.includes('<db_username>') || MONGODB_URI.includes('<username>')) {
      console.warn('\n⚠️ WARNING: MONGODB_URI in next-app/.env.local contains placeholder values.');
    }

    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(MONGODB_URI || '', opts).then((mongooseInstance) => {
      console.log(`✅ Next.js MongoDB Connected: ${mongooseInstance.connection.host}`);
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
