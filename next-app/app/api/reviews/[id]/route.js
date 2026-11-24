import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Review from '@/models/Review';
import { getAuthUser } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const review = await Review.findById(id).populate('user', 'name email');
    if (!review) {
      return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 });
    }

    const isOwner = review.user._id.toString() === user._id.toString();
    const isTeacher = user.role === 'teacher';
    if (!isOwner && !isTeacher) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    console.error('Get review by id error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch review' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 });
    }

    if (review.user.toString() !== user._id.toString()) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
    }

    await review.deleteOne();
    return NextResponse.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete review' },
      { status: 500 }
    );
  }
}
