const Quiz = require('../models/Quiz');
const TopicProgress = require('../models/TopicProgress');
const User = require('../models/User');
const { generateQuiz: aiGenerateQuiz } = require('../services/aiService');
const { asyncHandler } = require('../utils/helpers');

/**
 * @route   POST /api/quizzes/generate
 * @desc    Generate a new quiz based on selected topic, difficulty level & language
 * @access  Private (student)
 */
const generateQuiz = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const customTopic = typeof req.body?.customTopic === 'string' ? req.body.customTopic.trim() : '';
  const requestedTopic = typeof req.body?.topic === 'string' ? req.body.topic.trim() : '';
  const requestedTopics = Array.isArray(req.body?.topics)
    ? req.body.topics.map((t) => String(t).trim()).filter(Boolean).slice(0, 5)
    : [];

  const level = ['Beginner', 'Intermediate', 'Advanced'].includes(req.body?.level)
    ? req.body.level
    : 'Beginner';
  const language =
    typeof req.body?.language === 'string' && req.body.language.trim()
      ? req.body.language.trim()
      : 'general';

  const targetCount = level === 'Advanced' ? 15 : level === 'Intermediate' ? 10 : 5;

  let chosenTopic = 'Mixed / Overall Coding Quiz';
  let topicNames = [];

  if (customTopic) {
    chosenTopic = customTopic;
    topicNames = [customTopic];
  } else if (requestedTopic) {
    chosenTopic = requestedTopic;
    topicNames = [requestedTopic];
  } else if (requestedTopics.length > 0) {
    chosenTopic = requestedTopics[0];
    topicNames = requestedTopics;
  } else {
    const weakTopics = await TopicProgress.find({ user: userId })
      .sort({ level: 1 })
      .limit(3)
      .select('topic level')
      .lean();

    if (weakTopics.length > 0) {
      topicNames = weakTopics.map((t) => t.topic);
      chosenTopic = topicNames[0];
    } else {
      chosenTopic = 'Mixed / Overall Coding Quiz';
      topicNames = [
        'Data Structures',
        'Algorithms & Big-O',
        'Debugging & Output Prediction',
        'Functions & Scope',
        'OOP Concepts',
      ];
    }
  }

  const aiResult = await aiGenerateQuiz(topicNames, {
    topic: chosenTopic,
    level,
    language,
    count: targetCount,
  });

  const quiz = await Quiz.create({
    user: userId,
    topic: chosenTopic,
    topics: topicNames.length > 0 ? topicNames : [chosenTopic],
    level,
    language,
    questions: aiResult.questions,
    answers: [],
    totalQuestions: aiResult.questions.length,
    completed: false,
  });

  const safeQuestions = quiz.questions.map((q) => ({
    _id: q._id,
    id: q.id || String(q._id),
    question: q.question,
    codeSnippet: q.codeSnippet || '',
    subTopic: q.subTopic || chosenTopic,
    options: q.options,
  }));

  res.status(201).json({
    success: true,
    data: {
      _id: quiz._id,
      topic: quiz.topic,
      topics: quiz.topics,
      level: quiz.level,
      language: quiz.language,
      questions: safeQuestions,
      totalQuestions: quiz.totalQuestions,
      completed: false,
      createdAt: quiz.createdAt,
    },
  });
});

/**
 * @route   POST /api/quizzes/:id/submit
 * @desc    Submit quiz answers and get results with sub-topic breakdown
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

  // Deduplicate by questionIndex and restrict to valid question bounds
  const uniqueAnswersMap = new Map();
  for (const a of answers) {
    if (a.questionIndex >= 0 && a.questionIndex < quiz.questions.length) {
      uniqueAnswersMap.set(a.questionIndex, a.selectedOption);
    }
  }
  const normalizedAnswers = Array.from(uniqueAnswersMap.entries()).map(([questionIndex, selectedOption]) => ({
    questionIndex,
    selectedOption,
  }));

  let correctCount = 0;
  const gradedAnswers = normalizedAnswers.map((a) => {
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

  const score =
    quiz.totalQuestions > 0
      ? Math.min(100, Math.round((correctCount / quiz.totalQuestions) * 100))
      : 0;

  // Compute XP earned: base 20 XP for completion + 10 XP per correct question
  const xpEarned = 20 + correctCount * 10;

  // Calculate Sub-Topic Accuracy Breakdown
  const subTopicMap = {};
  quiz.questions.forEach((q, i) => {
    const sub = q.subTopic || quiz.topic || 'General';
    if (!subTopicMap[sub]) {
      subTopicMap[sub] = { total: 0, correct: 0, percentage: 0 };
    }
    subTopicMap[sub].total += 1;
    const userAnswer = uniqueAnswersMap.get(i);
    if (userAnswer !== undefined && userAnswer === q.correctAnswer) {
      subTopicMap[sub].correct += 1;
    }
  });

  for (const k of Object.keys(subTopicMap)) {
    const entry = subTopicMap[k];
    entry.percentage = entry.total > 0 ? Math.round((entry.correct / entry.total) * 100) : 0;
  }

  quiz.answers = normalizedAnswers;
  quiz.score = score;
  quiz.correctCount = correctCount;
  quiz.xpEarned = xpEarned;
  quiz.subTopicBreakdown = subTopicMap;
  quiz.completed = true;
  quiz.completedAt = new Date();
  await quiz.save();

  // Update user streak and XP on quiz completion
  const user = await User.findById(req.user._id);
  if (user) {
    user.updateStreak();
    user.xp = (user.xp || 0) + xpEarned;
    await user.save();
  }

  const results = quiz.questions.map((q, i) => ({
    question: q.question,
    codeSnippet: q.codeSnippet || '',
    subTopic: q.subTopic || quiz.topic,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation || '',
    selectedOption: answers.find((a) => a.questionIndex === i)?.selectedOption ?? null,
    isCorrect: gradedAnswers.find((a) => a.questionIndex === i)?.isCorrect ?? false,
  }));

  res.json({
    success: true,
    data: {
      _id: quiz._id,
      topic: quiz.topic,
      topics: quiz.topics,
      level: quiz.level,
      language: quiz.language,
      score,
      correctCount,
      totalQuestions: quiz.totalQuestions,
      xpEarned,
      subTopicBreakdown: subTopicMap,
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

  // Isolate demo teacher from viewing real registered students' quizzes by ID
  if (
    req.user.role === 'teacher' &&
    (req.user.isDemo || req.user.email === 'teacher@crbuddy.com') &&
    quiz.user.toString() !== req.user._id.toString()
  ) {
    const owner = await User.findById(quiz.user).select('isDemo email').lean();
    if (!owner || (!owner.isDemo && owner.email !== 'student@crbuddy.com')) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
  }

  // Prevent exposing answers or explanations to student before quiz submission
  if (!quiz.completed && req.user.role !== 'teacher') {
    quiz.questions = quiz.questions.map(({ correctAnswer, explanation, ...rest }) => rest);
  } else if (quiz.completed) {
    quiz.results = quiz.questions.map((q, i) => {
      const userAnswer = quiz.answers?.find((a) => a.questionIndex === i);
      const selectedOption = userAnswer?.selectedOption ?? null;
      return {
        question: q.question,
        codeSnippet: q.codeSnippet || '',
        subTopic: q.subTopic || quiz.topic,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
        selectedOption,
        isCorrect: selectedOption === q.correctAnswer,
      };
    });

    if (!quiz.subTopicBreakdown) {
      const subMap = {};
      quiz.questions.forEach((q, i) => {
        const sub = q.subTopic || quiz.topic || 'General';
        if (!subMap[sub]) subMap[sub] = { total: 0, correct: 0, percentage: 0 };
        subMap[sub].total += 1;
        const userAnswer = quiz.answers?.find((a) => a.questionIndex === i);
        if (userAnswer && userAnswer.selectedOption === q.correctAnswer) {
          subMap[sub].correct += 1;
        }
      });
      for (const k of Object.keys(subMap)) {
        subMap[k].percentage = subMap[k].total > 0 ? Math.round((subMap[k].correct / subMap[k].total) * 100) : 0;
      }
      quiz.subTopicBreakdown = subMap;
    }
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
