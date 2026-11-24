import jwt from 'jsonwebtoken';
import { connectDB } from './db';
import User from '../models/User';

export const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_code_review_buddy';

export function generateToken(id) {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function getAuthUser(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return null;
    }

    await connectDB();
    const user = await User.findById(decoded.id).select('-password');
    return user;
  } catch (error) {
    console.error('getAuthUser error:', error);
    return null;
  }
}
