import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Roadmap from '@/models/Roadmap';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    await connectDB();
    const roadmap = await Roadmap.findOne({ user: user._id });

    if (!roadmap) {
      return NextResponse.json(
        { success: false, message: 'No roadmap found. Generate one first.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: roadmap });
  } catch (error) {
    console.error('Get roadmap error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch roadmap' },
      { status: 500 }
    );
  }
}
