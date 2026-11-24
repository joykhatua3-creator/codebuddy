const Quiz = require('../models/Quiz');
const TopicProgress = require('../models/TopicProgress');
const User = require('../models/User');
const { generateQuiz: aiGenerateQuiz } = require('../services/aiService');
const { asyncHandler } = require('../utils/helpers');

/**
 * @route   POST /api/quizzes/generate
 * @desc    Generate a new quiz based on student's weakest topics
 * @access  Private (student)
 */
const generateQuiz = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const weakTopics = await TopicProgress.find({ user: userId })
    .sort({ level: 1 })
    .limit(3)
    .select('topic level')
    .lean();

  if (weakTopics.length === 0) {
    weakTopics.push(
      { topic: 'Variables and Data Types' },
      { topic: 'Functions' },
      { topic: 'Loops' }
    );
  }

  const topicNames = weakTopics.map((t) => t.topic);
  const aiResult = await aiGenerateQuiz(topicNames);

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

  res.status(201).json({
    success: true,
    data: {
      _id: quiz._id,
      topics: quiz.topics,
      questions: safeQuestions,
      totalQuestions: quiz.totalQuestions,
      completed: false,
      createdAt: quiz.createdAt,
    },
  });
});

/**
 * @route   POST /api/quizzes/:id/submit
 * @desc    Submit quiz answers and get results
 * @access  Private (student, owner)
 */
const submitQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);

  if (!quiz) {
    return res.status(404).json({ success: false, message: 'Quiz not found' });
  }

  if (quiz.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  if (quiz.completed) {
    return res.status(400).json({ success: false, message: 'Quiz already submitted' });
  }

  const { answers } = req.validatedData;

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

  const score = quiz.totalQuestions > 0 ? Math.round((correctCount / quiz.totalQuestions) * 100) : 0;

  quiz.answers = answers;
  quiz.score = score;
  quiz.correctCount = correctCount;
  quiz.completed = true;
  quiz.completedAt = new Date();
  await quiz.save();

  // Update user streak on quiz completion
  const user = await User.findById(req.user._id);
  if (user) {
    user.updateStreak();
    await user.save();
  }

  const results = quiz.questions.map((q, i) => ({
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    selectedOption: answers.find((a) => a.questionIndex === i)?.selectedOption ?? null,
    isCorrect: gradedAnswers.find((a) => a.questionIndex === i)?.isCorrect ?? false,
  }));

  res.json({
    success: true,
    data: {
      _id: quiz._id,
      topics: quiz.topics,
      score,
      correctCount,
      totalQuestions: quiz.totalQuestions,
      results,
      completedAt: quiz.completedAt,
    },
  });
});

/**
 * @route   GET /api/quizzes
 * @desc    Get all quizzes for the authenticated student
 * @access  Private (student)
 */
const getQuizzes = asyncHandler(async (req, res) => {
  const quizzes = await Quiz.find({ user: req.user._id })
    .select('-questions.correctAnswer')
    .sort('-createdAt')
    .limit(20)
    .lean();

  res.json({ success: true, data: quizzes });
});

/**
 * @route   GET /api/quizzes/:id
 * @desc    Get a single quiz by ID
 * @access  Private (owner or teacher)
 */
const getQuizById = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id).lean();

  if (!quiz) {
    return res.status(404).json({ success: false, message: 'Quiz not found' });
  }

  if (quiz.user.toString() !== req.user._id.toString() && req.user.role !== 'teacher') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  // Prevent exposing answers to student before quiz submission
  if (!quiz.completed && req.user.role !== 'teacher') {
    quiz.questions = quiz.questions.map(({ correctAnswer, ...rest }) => rest);
  } else if (quiz.completed) {
    quiz.results = quiz.questions.map((q, i) => {
      const userAnswer = quiz.answers?.find((a) => a.questionIndex === i);
      const selectedOption = userAnswer?.selectedOption ?? null;
      return {
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        selectedOption,
        isCorrect: selectedOption === q.correctAnswer,
      };
    });
  }

  res.json({ success: true, data: quiz });
});

/**
 * @route   DELETE /api/quizzes/:id
 * @desc    Delete a quiz
 * @access  Private (owner only)
 */
const deleteQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);

  if (!quiz) {
    return res.status(404).json({ success: false, message: 'Quiz not found' });
  }

  if (quiz.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  await quiz.deleteOne();
  res.json({ success: true, message: 'Quiz deleted successfully' });
});

module.exports = {
  generateQuiz,
  submitQuiz,
  getQuizzes,
  getQuizById,
  deleteQuiz,
};
