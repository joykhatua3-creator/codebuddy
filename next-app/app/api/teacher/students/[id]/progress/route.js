import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Review from '@/models/Review';
import TopicProgress from '@/models/TopicProgress';
import Quiz from '@/models/Quiz';
import { getAuthUser } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'Access denied: teachers only' },
        { status: 403 }
      );
    }

    const { id } = await params;
    await connectDB();

    const student = await User.findById(id).select('-password');
    if (!student || student.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    const userId = student._id;

    const [reviews, topics, quizzes] = await Promise.all([
      Review.find({ user: userId })
        .select('score language summary createdAt bugs')
        .sort('-createdAt')
        .limit(20),
      TopicProgress.find({ user: userId }).sort({ level: 1 }),
      Quiz.find({ user: userId, completed: true })
        .select('topics score correctCount totalQuestions completedAt')
        .sort('-completedAt')
        .limit(10),
    ]);

    const totalReviews = reviews.length;
    const avgScore =
      totalReviews > 0
        ? Math.round(reviews.reduce((a, r) => a + (r.score || 0), 0) / totalReviews)
        : 0;

    const scoreTrend = reviews
      .slice()
      .reverse()
      .map((r) => ({
        date: r.createdAt.toISOString().split('T')[0],
        score: r.score || 0,
      }));

    return NextResponse.json({
      success: true,
      data: {
        student: {
          _id: student._id,
          name: student.name,
          email: student.email,
          streak: student.streak,
          createdAt: student.createdAt,
        },
        stats: {
          totalReviews,
          avgScore,
          totalQuizzes: quizzes.length,
        },
        scoreTrend,
        topics,
        recentReviews: reviews,
        recentQuizzes: quizzes,
      },
    });
  } catch (error) {
    console.error('Teacher getStudentProgress error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch student progress' },
      { status: 500 }
    );
  }
}
