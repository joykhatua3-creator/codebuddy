import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Roadmap from '@/models/Roadmap';
import TopicProgress from '@/models/TopicProgress';
import { getAuthUser } from '@/lib/auth';
import { generateRoadmap } from '@/lib/aiService';

export async function POST(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    await connectDB();
    const weakTopics = await TopicProgress.find({ user: user._id })
      .sort({ level: 1 })
      .limit(5)
      .select('topic level');

    if (weakTopics.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No programming topics found yet. Submit at least one code review first.',
        },
        { status: 400 }
      );
    }

    const topicNames = weakTopics.map((t) => t.topic);
    const studentName = user.name ? user.name.split(' ')[0] : 'Student';

    const aiResult = await generateRoadmap(topicNames, studentName);

    const roadmap = await Roadmap.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        steps: aiResult.steps.map((s) => ({ ...s, completed: false, completedAt: null })),
        weakTopicsSnapshot: topicNames,
        generatedAt: new Date(),
      },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: roadmap });
  } catch (error) {
    console.error('Generate roadmap error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Roadmap generation failed' },
      { status: error.statusCode || 500 }
    );
  }
}
