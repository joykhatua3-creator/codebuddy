import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Quiz from '@/models/Quiz';
import TopicProgress from '@/models/TopicProgress';
import { getAuthUser } from '@/lib/auth';
import { generateQuiz } from '@/lib/aiService';

export async function POST(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
    }

    await connectDB();
    const userId = user._id;

    let weakTopics = await TopicProgress.find({ user: userId })
      .sort({ level: 1 })
      .limit(3)
      .select('topic level');

    if (weakTopics.length === 0) {
      weakTopics = [
        { topic: 'Variables and Data Types' },
        { topic: 'Functions' },
        { topic: 'Loops' },
      ];
    }

    const topicNames = weakTopics.map((t) => t.topic);
    const aiResult = await generateQuiz(topicNames);

    const quiz = await Quiz.create({
      user: userId,
      topics: topicNames,
      questions: aiResult.questions,
      answers: [],
      totalQuestions: aiResult.questions.length,
      completed: false,
    });

    const safeQuestions = quiz.questions.map((q) => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      explanation: q.explanation,
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          _id: quiz._id,
          topics: quiz.topics,
          questions: safeQuestions,
          totalQuestions: quiz.totalQuestions,
          completed: false,
          createdAt: quiz.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Generate quiz error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Quiz generation failed' },
      { status: error.statusCode || 500 }
    );
  }
}
