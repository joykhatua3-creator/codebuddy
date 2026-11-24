import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Review from '@/models/Review';
import TopicProgress from '@/models/TopicProgress';
import Quiz from '@/models/Quiz';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'Access denied: teachers only' },
        { status: 403 }
      );
    }

    await connectDB();
    const students = await User.find({ role: 'student' }).select('name email streak createdAt');

    const enriched = await Promise.all(
      students.map(async (student) => {
        const [reviews, weakestTopic, quizzes] = await Promise.all([
          Review.find({ user: student._id }).select('score'),
          TopicProgress.findOne({ user: student._id }).sort({ level: 1 }).select('topic level'),
          Quiz.find({ user: student._id, completed: true }).select('score'),
        ]);

        const totalReviews = reviews.length;
        const avgScore =
          totalReviews > 0
            ? Math.round(reviews.reduce((a, r) => a + (r.score || 0), 0) / totalReviews)
            : 0;
        const avgQuizScore =
          quizzes.length > 0
            ? Math.round(quizzes.reduce((a, q) => a + (q.score || 0), 0) / quizzes.length)
            : 0;

        return {
          _id: student._id,
          name: student.name,
          email: student.email,
          streak: student.streak,
          totalReviews,
          avgScore,
          weakestTopic: weakestTopic?.topic || 'N/A',
          weakestTopicLevel: weakestTopic?.level ?? null,
          totalQuizzes: quizzes.length,
          avgQuizScore,
          joinedAt: student.createdAt,
        };
      })
    );

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Teacher getStudents error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch students' },
      { status: 500 }
    );
  }
}
