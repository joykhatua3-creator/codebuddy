import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Review from '@/models/Review';
import TopicProgress from '@/models/TopicProgress';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import { reviewSubmitSchema } from '@/lib/schemas';
import { generateCodeHash } from '@/lib/helpers';
import { reviewCode } from '@/lib/aiService';

const updateTopicProgress = async (userId, concepts) => {
  for (const concept of concepts) {
    const update = {};
    if (concept.level === 'weak') update.$inc = { weakCount: 1 };
    else if (concept.level === 'ok') update.$inc = { okCount: 1 };
    else if (concept.level === 'strong') update.$inc = { strongCount: 1 };

    update.$set = { lastSeen: new Date() };

    await TopicProgress.findOneAndUpdate(
      { user: userId, topic: concept.name },
      update,
      { upsert: true, new: true, runValidators: true }
    );

    const tp = await TopicProgress.findOne({ user: userId, topic: concept.name });
    if (tp) await tp.save();
  }
};

export async function POST(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = reviewSubmitSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }

    const { language, code } = result.data;
    await connectDB();

    const codeHash = generateCodeHash(code, language);
    const cached = await Review.findOne({ user: user._id, codeHash });
    if (cached) {
      return NextResponse.json({
        success: true,
        data: { ...cached.toObject(), fromCache: true },
      });
    }

    const aiResult = await reviewCode(code, language);

    const review = await Review.create({
      user: user._id,
      language,
      code,
      codeHash,
      score: aiResult.score,
      summary: aiResult.summary,
      bugs: aiResult.bugs,
      codeQuality: aiResult.codeQuality,
      complexity: aiResult.complexity,
      security: aiResult.security,
      concepts: aiResult.concepts,
      fromCache: false,
    });

    if (aiResult.concepts?.length > 0) {
      updateTopicProgress(user._id, aiResult.concepts).catch((err) =>
        console.error('Topic progress update error:', err.message)
      );
    }

    const dbUser = await User.findById(user._id);
    if (dbUser) {
      dbUser.updateStreak();
      await dbUser.save();
    }

    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (error) {
    console.error('Review submit error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'AI review failed' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function GET(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const language = searchParams.get('language');
    const minScore = searchParams.get('minScore');
    const maxScore = searchParams.get('maxScore');
    const sort = searchParams.get('sort') || '-createdAt';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10'));

    const filter = { user: user._id };
    if (language) filter.language = language;
    if (minScore || maxScore) {
      filter.score = {};
      if (minScore) filter.score.$gte = Number(minScore);
      if (maxScore) filter.score.$lte = Number(maxScore);
    }

    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .select('-code')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
