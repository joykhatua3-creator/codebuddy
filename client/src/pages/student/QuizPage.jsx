import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Bookmark,
  Sparkles,
  Layers,
  Code2,
  Terminal,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  Flame,
} from 'lucide-react';
import { quizService } from '../../services';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import { useToast } from '../../components/ui/Toast';

const OPTIONS = ['A', 'B', 'C', 'D'];

const QUICK_TOPICS = [
  'Mixed / Overall Coding Quiz',
  'Functions & Scope',
  'Arrays & Strings',
  'Data Structures',
  'Algorithms & Big-O',
  'OOP Concepts',
  'Async & APIs',
  'SQL & Databases',
  'Debugging & Output Prediction',
];

const LANGUAGES = [
  { id: 'general', label: 'Any / General' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
  { id: 'sql', label: 'SQL' },
];

const DIFFICULTY_LEVELS = [
  {
    id: 'Beginner',
    label: 'Beginner',
    count: 5,
    tag: '5 Questions',
    description: 'Core fundamentals, basic syntax rules, and simple execution trace.',
    gradient: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/30',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  {
    id: 'Intermediate',
    label: 'Intermediate',
    count: 10,
    tag: '10 Questions',
    description: 'Edge cases, mutation traps, bug spotting, and complexity analysis.',
    gradient: 'from-blue-500/10 to-indigo-500/10 border-blue-500/30',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  },
  {
    id: 'Advanced',
    label: 'Advanced',
    count: 15,
    tag: '15 Questions',
    description: 'Tricky code outputs, optimization trade-offs, and subtle runtime pitfalls.',
    gradient: 'from-purple-500/10 to-pink-500/10 border-purple-500/30',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  },
];

export default function QuizPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const urlTopic = searchParams.get('topic') || '';

  // Setup state
  const [selectedTopic, setSelectedTopic] = useState(
    urlTopic ? (QUICK_TOPICS.includes(urlTopic) ? urlTopic : 'Custom') : 'Mixed / Overall Coding Quiz'
  );
  const [customTopic, setCustomTopic] = useState(
    urlTopic && !QUICK_TOPICS.includes(urlTopic) ? urlTopic : ''
  );
  const [selectedLevel, setSelectedLevel] = useState('Beginner');
  const [selectedLanguage, setSelectedLanguage] = useState('general');

  // Active quiz state
  const [quiz, setQuiz] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionIndex]: optionIndex }
  const [flagged, setFlagged] = useState({}); // { [questionIndex]: boolean }
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Sync if URL query param changes
  useEffect(() => {
    if (urlTopic) {
      if (QUICK_TOPICS.includes(urlTopic)) {
        setSelectedTopic(urlTopic);
        setCustomTopic('');
      } else {
        setSelectedTopic('Custom');
        setCustomTopic(urlTopic);
      }
    }
  }, [urlTopic]);

  const activeLevelConfig =
    DIFFICULTY_LEVELS.find((l) => l.id === selectedLevel) || DIFFICULTY_LEVELS[0];

  const handleGenerate = async (customPayload = null) => {
    setGenerating(true);
    setError('');
    setAnswers({});
    setFlagged({});
    setCurrentQ(0);

    const payload = customPayload || {
      topic: selectedTopic === 'Custom' ? customTopic.trim() || 'Mixed / Overall Coding Quiz' : selectedTopic,
      customTopic: selectedTopic === 'Custom' ? customTopic.trim() : undefined,
      level: selectedLevel,
      language: selectedLanguage,
    };

    try {
      const res = await quizService.generate(payload);
      setQuiz(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate practice quiz. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const selectAnswer = (optionIndex) => {
    setAnswers((prev) => ({ ...prev, [currentQ]: optionIndex }));
  };

  const toggleFlag = (index = currentQ) => {
    setFlagged((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    setShowSubmitModal(false);
    setSubmitting(true);

    const answersArray = quiz.questions.map((_, i) => ({
      questionIndex: i,
      selectedOption: answers[i] ?? null,
    }));

    try {
      const res = await quizService.submit(quiz._id, { answers: answersArray });
      navigate(`/dashboard/quiz/result/${quiz._id}`, { state: { result: res.data.data } });
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Failed to submit quiz' });
      setSubmitting(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 1. SETUP PANEL (When no active quiz)
  // ───────────────────────────────────────────────────────────────────────────
  if (!quiz && !generating) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="card p-6 md:p-8 bg-gradient-to-r from-[#E85D3F]/10 via-[#F97316]/5 to-[#10B981]/10 border-[#E85D3F]/25 dark:border-[#F97316]/25">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#E85D3F]/10 text-[#E85D3F] dark:bg-orange-500/15 dark:text-orange-400 mb-2">
                <Brain size={14} /> Gemini 3.8 AI Practice Arena
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Practice Coding Quizzes
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
                Test yourself on targeted programming concepts or take an overall mixed coding quiz. Questions scale in depth with rich code snippets and instant feedback.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white/70 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
              <Flame size={20} className="text-amber-500 animate-pulse" />
              <div className="text-xs">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Daily Streak Ready</p>
                <p className="text-slate-500 dark:text-slate-400">Complete a quiz to earn XP</p>
              </div>
            </div>
          </div>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* Setup Card */}
        <div className="card p-6 md:p-8 space-y-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          {/* Step 1: Topic Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                Choose Quiz Topic
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {selectedTopic === 'Custom' ? 'Custom Topic' : selectedTopic}
              </span>
            </div>

            {/* Quick Select Pills */}
            <div className="flex flex-wrap gap-2">
              {QUICK_TOPICS.map((topic) => {
                const isSelected = selectedTopic === topic;
                const isMixed = topic === 'Mixed / Overall Coding Quiz';
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => {
                      setSelectedTopic(topic);
                      setCustomTopic('');
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-500/20 ring-2 ring-primary-500/30'
                        : isMixed
                        ? 'bg-gradient-to-r from-[#E85D3F]/10 to-[#10B981]/10 text-[#141210] dark:text-[#F8FAFC] border-[#E85D3F]/30 dark:border-[#F97316]/30 hover:border-[#E85D3F]'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                  >
                    {isMixed && <Sparkles size={14} className={isSelected ? 'text-amber-200' : 'text-blue-500'} />}
                    {topic}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setSelectedTopic('Custom')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 border ${
                  selectedTopic === 'Custom'
                    ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-500/20 ring-2 ring-primary-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                + Custom Topic
              </button>
            </div>

            {/* Custom Topic Input */}
            {selectedTopic === 'Custom' && (
              <div className="pt-2 animate-fadeIn">
                <div className="relative">
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Enter any topic (e.g. Recursion, React Hooks, Pointers, Dynamic Programming)..."
                    className="input w-full pl-3 pr-10 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                  {customTopic && (
                    <button
                      type="button"
                      onClick={() => setCustomTopic('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Language Preference & Difficulty Level */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Language Selector */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                Code Language
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Code snippets will be tailored to this language.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => setSelectedLanguage(lang.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-all ${
                      selectedLanguage === lang.id
                        ? 'border-primary-500 bg-primary-50 text-primary-900 dark:bg-primary-950/50 dark:text-primary-200 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Level Cards (Scales 5, 10, 15 Questions) */}
            <div className="md:col-span-2 space-y-3">
              <label className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                Difficulty & Question Count
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Difficulty scales the depth and the total number of questions automatically.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DIFFICULTY_LEVELS.map((lvl) => {
                  const isSelected = selectedLevel === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setSelectedLevel(lvl.id)}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-950/40 ring-2 ring-primary-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{lvl.label}</span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${lvl.badge}`}>
                            {lvl.tag}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                          {lvl.description}
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-[11px] font-semibold">
                        <span className="text-slate-500 dark:text-slate-400">Time estimate</span>
                        <span className="text-primary-700 dark:text-primary-300">
                          ~{lvl.count * 1.5} mins
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Terminal size={14} className="text-primary-500" />
              <span>Includes code snippets, Big-O analysis, and detailed explanations.</span>
            </div>
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={generating || (selectedTopic === 'Custom' && !customTopic.trim())}
              className="btn btn-primary w-full sm:w-auto px-8 py-3 text-sm sm:text-base font-bold shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2"
            >
              <Brain size={18} />
              Start Practice Quiz ({activeLevelConfig.count} Qs)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2. GENERATING SKELETON STATE
  // ───────────────────────────────────────────────────────────────────────────
  if (generating) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="card p-10 text-center space-y-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="relative w-16 h-16 mx-auto">
            <LoadingSpinner size="lg" className="mx-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Brain size={20} className="text-primary-600 animate-pulse" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Generating Your Code Quiz...
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Gemini AI is crafting {activeLevelConfig.count} high-quality questions for{' '}
              <strong className="text-slate-900 dark:text-slate-200">
                {selectedTopic === 'Custom' ? customTopic : selectedTopic}
              </strong>{' '}
              ({selectedLevel} level).
            </p>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
            <Sparkles size={14} className="text-amber-500 shrink-0" />
            <span>Adding code snippets, logic traps, and step-by-step explanations...</span>
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 3. ACTIVE QUIZ PLAYER
  // ───────────────────────────────────────────────────────────────────────────
  const question = quiz.questions[currentQ];
  const isLast = currentQ === quiz.questions.length - 1;
  const answeredCount = Object.keys(answers).length;
  const isFlagged = Boolean(flagged[currentQ]);
  const progressPercent = Math.round(((currentQ + 1) / quiz.totalQuestions) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-16">
      {/* Top Header Card */}
      <div className="card p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-blue text-xs font-bold uppercase tracking-wider">
              {quiz.level || selectedLevel}
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              {quiz.topic || selectedTopic}
            </span>
            {quiz.language && quiz.language !== 'general' && (
              <span className="badge badge-gray text-xs font-mono uppercase">{quiz.language}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleFlag(currentQ)}
              className={`btn btn-sm text-xs gap-1.5 transition-colors ${
                isFlagged
                  ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700'
                  : 'btn-secondary'
              }`}
              title="Flag this question to review before submitting"
            >
              <Bookmark size={14} className={isFlagged ? 'fill-amber-500 text-amber-500' : ''} />
              {isFlagged ? 'Flagged' : 'Flag'}
            </button>
            <button
              type="button"
              onClick={() => setQuiz(null)}
              disabled={submitting}
              className="btn btn-ghost btn-sm text-xs text-slate-500 hover:text-red-600"
            >
              Exit
            </button>
          </div>
        </div>

        {/* Progress Bar & Counter */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-medium text-slate-600 dark:text-slate-400">
            <span>
              Question <strong className="text-slate-900 dark:text-slate-100">{currentQ + 1}</strong> of{' '}
              {quiz.totalQuestions}
            </span>
            <span>
              {answeredCount} / {quiz.totalQuestions} answered
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question Stepper Dots */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {quiz.questions.map((_, i) => {
            const isCurrent = i === currentQ;
            const isAns = answers[i] !== undefined;
            const isFlg = Boolean(flagged[i]);
            return (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentQ(i)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center relative border ${
                  isCurrent
                    ? 'bg-primary-600 text-white border-primary-600 ring-2 ring-primary-500/40'
                    : isAns
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:border-slate-400'
                }`}
                title={`Question ${i + 1}${isFlg ? ' (Flagged)' : ''}${isAns ? ' (Answered)' : ''}`}
              >
                {i + 1}
                {isFlg && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-white dark:border-slate-900" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Card */}
      <div className="card p-6 md:p-8 space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Question Header & Sub-topic */}
        <div className="space-y-2">
          {question.subTopic && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
              <Code2 size={12} />
              {question.subTopic}
            </div>
          )}
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
            {question.question}
          </h2>
        </div>

        {/* Code Snippet Box (If present) */}
        {question.codeSnippet && question.codeSnippet.trim() && (
          <div className="rounded-xl overflow-hidden border border-slate-800 dark:border-slate-750 bg-slate-950 text-slate-100 shadow-md">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <Terminal size={12} className="text-primary-400" /> Code Snippet
              </span>
              <span className="uppercase text-[10px] tracking-wider text-slate-500">
                {quiz.language || 'code'}
              </span>
            </div>
            <pre className="p-4 text-xs sm:text-sm font-mono leading-relaxed overflow-x-auto text-emerald-300 selection:bg-slate-700">
              <code>{question.codeSnippet}</code>
            </pre>
          </div>
        )}

        {/* Options (A, B, C, D) */}
        <div className="space-y-3 pt-2">
          {question.options.map((option, i) => {
            const isSelected = answers[currentQ] === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => selectAnswer(i)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 relative ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50/70 text-slate-900 dark:border-primary-400 dark:bg-primary-950/40 dark:text-slate-100 ring-2 ring-primary-500/25 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-750 dark:hover:border-slate-600'
                }`}
              >
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {OPTIONS[i]}
                </span>
                <span className="text-sm sm:text-base leading-snug pt-0.5 flex-1">{option}</span>
                {isSelected && (
                  <CheckCircle size={18} className="text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center gap-3">
        <button
          type="button"
          onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
          disabled={currentQ === 0}
          className="btn btn-secondary text-sm font-semibold gap-1.5 px-4 py-2.5"
        >
          <ChevronLeft size={16} /> Previous
        </button>

        <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
          Use buttons to navigate • Questions save automatically
        </div>

        {isLast ? (
          <button
            type="button"
            onClick={() => {
              if (answeredCount < quiz.totalQuestions) {
                setShowSubmitModal(true);
              } else {
                handleSubmit();
              }
            }}
            disabled={submitting}
            className="btn btn-primary text-sm font-bold gap-2 px-6 py-2.5 shadow-lg shadow-primary-500/25"
          >
            {submitting ? (
              <>
                <LoadingSpinner size="sm" /> Submitting...
              </>
            ) : (
              <>
                <CheckCircle size={16} /> Submit Quiz
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrentQ((p) => Math.min(quiz.totalQuestions - 1, p + 1))}
            className="btn btn-primary text-sm font-semibold gap-1.5 px-6 py-2.5"
          >
            Next <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Unanswered Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="card max-w-md w-full p-6 space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <AlertCircle size={24} />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Unanswered Questions
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              You have answered <strong className="text-slate-900 dark:text-slate-100">{answeredCount}</strong> out of{' '}
              <strong className="text-slate-900 dark:text-slate-100">{quiz.totalQuestions}</strong> questions. Unanswered questions will be scored as incorrect.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="btn btn-secondary btn-sm"
              >
                Go Back & Finish
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="btn btn-primary btn-sm font-bold"
              >
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
