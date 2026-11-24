import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Roadmap from '@/models/Roadmap';
import { getAuthUser } from '@/lib/auth';

export async function PATCH(req, { params }) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { completed } = body;

    await connectDB();
    const roadmap = await Roadmap.findOne({ user: user._id });

    if (!roadmap) {
      return NextResponse.json({ success: false, message: 'Roadmap not found' }, { status: 404 });
    }

    const step = roadmap.steps.id(id);
    if (!step) {
      return NextResponse.json({ success: false, message: 'Step not found' }, { status: 404 });
    }

    step.completed = completed !== undefined ? completed : !step.completed;
    step.completedAt = step.completed ? new Date() : null;

    await roadmap.save();

    return NextResponse.json({
      success: true,
      data: {
        stepId: step._id,
        completed: step.completed,
        completionPercentage: roadmap.completionPercentage,
      },
    });
  } catch (error) {
    console.error('Update roadmap step error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update step' },
      { status: 500 }
    );
  }
}
