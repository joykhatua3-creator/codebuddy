import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Quiz from '@/models/Quiz';
import { getAuthUser } from '@/lib/auth';
import { quizSubmitSchema } from '@/lib/schemas';

export async function POST(req, { params }) {
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

    if (quiz.user.toString() !== user._id.toString()) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
    }

    if (quiz.completed) {
      return NextResponse.json({ success: false, message: 'Quiz already submitted' }, { status: 400 });
    }

    const body = await req.json();
    const result = quizSubmitSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }

    const { answers } = result.data;
    let correctCount = 0;
    const gradedAnswers = answers.map((a) => {
      const question = quiz.questions[a.questionIndex];
      const isCorrect = question && a.selectedOption === question.correctAnswer;
      if (isCorrect) correctCount++;
      return {
        questionIndex: a.questionIndex,
        selectedOption: a.selectedOption,
        isCorrect,
        correctAnswer: question?.correctAnswer,
      };
    });

    const score = Math.round((correctCount / quiz.questions.length) * 100);

    quiz.answers = answers;
    quiz.score = score;
    quiz.correctCount = correctCount;
    quiz.completed = true;
    quiz.completedAt = new Date();
    await quiz.save();

    return NextResponse.json({
      success: true,
      data: {
        _id: quiz._id,
        score,
        correctCount,
        totalQuestions: quiz.questions.length,
        gradedAnswers,
        questions: quiz.questions,
      },
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to submit quiz' },
      { status: 500 }
    );
  }
}
