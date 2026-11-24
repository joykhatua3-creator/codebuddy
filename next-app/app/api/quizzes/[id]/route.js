import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Quiz from '@/models/Quiz';
import { getAuthUser } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return NextResponse.json({ success: false, message: 'Quiz not found' }, { status: 404 });
    }

    if (quiz.user.toString() !== user._id.toString() && user.role !== 'teacher') {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
    }

    const safeQuestions = quiz.questions.map((q) => {
      const base = {
        _id: q._id,
        question: q.question,
        options: q.options,
      };
      if (quiz.completed) {
        base.correctAnswer = q.correctAnswer;
        base.explanation = q.explanation;
      }
      return base;
    });

    return NextResponse.json({
      success: true,
      data: {
        _id: quiz._id,
        topics: quiz.topics,
        questions: safeQuestions,
        answers: quiz.answers,
        score: quiz.score,
        correctCount: quiz.correctCount,
        totalQuestions: quiz.totalQuestions,
        completed: quiz.completed,
        completedAt: quiz.completedAt,
        createdAt: quiz.createdAt,
      },
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch quiz' },
      { status: 500 }
    );
  }
}
