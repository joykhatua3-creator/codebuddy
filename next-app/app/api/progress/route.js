import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import TopicProgress from '@/models/TopicProgress';
import Review from '@/models/Review';
import Quiz from '@/models/Quiz';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    await connectDB();
    const userId = user._id;

    const topics = await TopicProgress.find({ user: userId }).sort({ level: 1 });
    const weakestTopics = topics.slice(0, 3);

    const reviews = await Review.find({ user: userId }).select('score createdAt language');
    const totalReviews = reviews.length;
    const avgScore =
      totalReviews > 0
        ? Math.round(reviews.reduce((acc, r) => acc + (r.score || 0), 0) / totalReviews)
        : 0;

    const scoreTrend = reviews.slice(-30).map((r) => ({
      date: r.createdAt.toISOString().split('T')[0],
      score: r.score || 0,
      language: r.language,
    }));

    const quizzes = await Quiz.find({ user: userId, completed: true }).select(
      'score topics createdAt completedAt'
    );
    const totalQuizzes = quizzes.length;
    const avgQuizScore =
      totalQuizzes > 0
        ? Math.round(quizzes.reduce((acc, q) => acc + (q.score || 0), 0) / totalQuizzes)
        : 0;

    const recentQuizzes = quizzes.slice(-5).reverse();

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const recentReviews = await Review.find({
      user: userId,
      createdAt: { $gte: fourteenDaysAgo },
    }).select('createdAt');

    const activityMap = {};
    recentReviews.forEach((r) => {
      const day = r.createdAt.toISOString().split('T')[0];
      activityMap[day] = (activityMap[day] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalReviews,
          avgScore,
          totalQuizzes,
          avgQuizScore,
          streak: user.streak,
          weakTopicsCount: topics.filter((t) => t.level < 50).length,
        },
        scoreTrend,
        topics,
        weakestTopics,
        recentQuizzes,
        activity: activityMap,
      },
    });
  } catch (error) {
    console.error('Progress API error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}
