import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  LayoutDashboard,
  ChevronDown,
  ChevronUp,
  Flame,
  Sparkles,
  ArrowRight,
  Code2,
  Terminal,
  Target,
  BarChart3,
  Award,
  BookOpen,
} from 'lucide-react';
import { quizService } from '../../services';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getScoreColor, getScoreLabel } from '../../utils/helpers';

const OPTIONS = ['A', 'B', 'C', 'D'];

const QuestionResultCard = ({ q, index }) => {
  const [open, setOpen] = useState(true);
  const isCorrect = q.isCorrect;

  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden transition-all duration-200 bg-white dark:bg-slate-900 shadow-sm ${
        isCorrect
          ? 'border-emerald-200 dark:border-emerald-900/60'
          : 'border-red-200 dark:border-red-900/60'
      }`}
    >
      {/* Header Button */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`w-full flex items-start gap-3.5 p-4 sm:p-5 text-left transition-colors ${
          isCorrect
            ? 'bg-emerald-50/60 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30'
            : 'bg-red-50/60 hover:bg-red-50 dark:bg-red-950/20 dark:hover:bg-red-950/30'
        }`}
      >
        {isCorrect ? (
          <CheckCircle2 size={22} className="text-emerald-500 shrink-0 mt-0.5" />
        ) : (
          <XCircle size={22} className="text-red-500 shrink-0 mt-0.5" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                isCorrect
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
              }`}
            >
              Q{index + 1} • {isCorrect ? 'Correct' : 'Needs Review'}
            </span>
            {q.subTopic && (
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Code2 size={11} />
                {q.subTopic}
              </span>
            )}
          </div>
          <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug">
            {q.question}
          </p>
        </div>

        <div className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mt-1 shrink-0">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Expanded Details */}
      {open && (
        <div className="p-4 sm:p-6 space-y-4 border-t border-slate-100 dark:border-slate-800">
          {/* Code Snippet (If present) */}
          {q.codeSnippet && q.codeSnippet.trim() && (
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100 text-xs sm:text-sm font-mono shadow-inner">
              <div className="px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
                <Terminal size={12} className="text-primary-400" /> Snippet
              </div>
              <pre className="p-3.5 overflow-x-auto text-emerald-300 leading-relaxed">
                <code>{q.codeSnippet}</code>
              </pre>
            </div>
          )}

          {/* Options List */}
          <div className="space-y-2">
            {q.options.map((opt, i) => {
              const isSelected = i === q.selectedOption;
              const isCorrectOpt = i === q.correctAnswer;

              return (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all text-xs sm:text-sm ${
                    isCorrectOpt
                      ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500/20'
                      : isSelected && !isCorrectOpt
                      ? 'border-red-400 bg-red-50/80 text-red-950 dark:bg-red-950/40 dark:text-red-200 font-medium ring-1 ring-red-400/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold shrink-0 mt-0.5 ${
                      isCorrectOpt
                        ? 'bg-emerald-600 text-white'
                        : isSelected && !isCorrectOpt
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {OPTIONS[i]}
                  </span>

                  <span className="flex-1 pt-0.5 leading-snug">{opt}</span>

                  {isCorrectOpt && (
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 shrink-0 mt-0.5">
                      <CheckCircle2 size={14} /> Correct
                    </span>
                  )}
                  {isSelected && !isCorrectOpt && (
                    <span className="text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1 shrink-0 mt-0.5">
                      <XCircle size={14} /> Your Answer
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Explanation Box */}
          {q.explanation && (
            <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-xl space-y-1">
              <p className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5 uppercase tracking-wide">
                <span>💡</span> Why this answer is correct
              </p>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {q.explanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function QuizResultPage() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState(state?.result || null);
  const [loading, setLoading] = useState(!state?.result && Boolean(id));

  useEffect(() => {
    if (!result && id) {
      quizService
        .getById(id)
        .then((res) => {
          const data = res.data?.data;
          if (data && data.completed) {
            setResult(data);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [id, result]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-slate-500">Loading quiz results...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center py-16 space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
          <Award size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Result Not Found</h2>
        <p className="text-sm text-slate-500">We could not locate this quiz score or result details.</p>
        <button onClick={() => navigate('/dashboard/quiz')} className="btn btn-primary">
          Back to Quizzes
        </button>
      </div>
    );
  }

  const {
    score = 0,
    correctCount = 0,
    totalQuestions = 0,
    results = [],
    topics = [],
    topic = '',
    level = 'Beginner',
    language = 'general',
    xpEarned = 20 + correctCount * 10,
    subTopicBreakdown = {},
  } = result;

  // Identify lowest performing sub-topic for targeted roadmap prompt
  const subTopicEntries = Object.entries(subTopicBreakdown || {});
  const weakestSubTopicEntry = subTopicEntries
    .filter(([_, stats]) => stats && stats.total > 0 && stats.percentage < 75)
    .sort((a, b) => a[1].percentage - b[1].percentage)[0];

  const weakestSubTopic = weakestSubTopicEntry ? weakestSubTopicEntry[0] : null;

  // Determine next difficulty recommendation
  const nextLevel =
    score >= 80
      ? level === 'Beginner'
        ? 'Intermediate'
        : level === 'Intermediate'
        ? 'Advanced'
        : null
      : null;

  return (
    <div className="w-full max-w-[1440px] mx-auto space-y-6 pb-16 overflow-x-hidden">
      {/* 1. HERO SCORE CARD */}
      <div className="card p-6 sm:p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        {/* Score Ring */}
        <div
          className={`mx-auto w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center shadow-lg transition-transform ${
            score >= 80
              ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/10'
              : score >= 60
              ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-blue-500/10'
              : score >= 40
              ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shadow-amber-500/10'
              : 'border-red-500 bg-red-50/80 dark:bg-red-950/40 text-red-600 dark:text-red-400 shadow-red-500/10'
          }`}
        >
          <span className="text-3xl font-extrabold tracking-tight">{score}%</span>
          <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">Score</span>
        </div>

        {/* Title & XP Badge */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              <Flame size={14} className="text-amber-500" /> +{xpEarned} XP Earned
            </span>
            <span className="badge badge-blue text-xs font-semibold">{level}</span>
            {language && language !== 'general' && (
              <span className="badge badge-gray text-xs font-mono uppercase">{language}</span>
            )}
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {getScoreLabel(score)}
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-400">
            You got <strong className="text-slate-900 dark:text-slate-100">{correctCount}</strong> out of{' '}
            <strong className="text-slate-900 dark:text-slate-100">{totalQuestions}</strong> questions correct in{' '}
            <strong className="text-slate-900 dark:text-slate-100">{topic || topics[0] || 'Practice Quiz'}</strong>.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard/quiz')}
            className="btn btn-primary gap-2 text-sm font-bold shadow-md shadow-primary-500/20"
          >
            <RotateCcw size={16} /> Take Another Quiz
          </button>

          {nextLevel && (
            <button
              type="button"
              onClick={() => {
                navigate(`/dashboard/quiz?topic=${encodeURIComponent(topic || topics[0] || '')}`);
              }}
              className="btn btn-secondary gap-2 text-sm font-semibold border-primary-500 text-primary-700 dark:text-primary-300"
            >
              <Sparkles size={16} /> Level Up to {nextLevel}
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn btn-ghost gap-2 text-sm text-slate-600 dark:text-slate-400"
          >
            <LayoutDashboard size={16} /> Dashboard
          </button>
        </div>
      </div>

      {/* 2. SUB-TOPIC ACCURACY BREAKDOWN */}
      {subTopicEntries.length > 0 && (
        <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 size={16} className="text-primary-600" />
              Sub-Topic Performance Breakdown
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {subTopicEntries.length} Domains Analyzed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {subTopicEntries.map(([sub, stats]) => {
              const pct = stats.percentage ?? 0;
              const isHigh = pct >= 80;
              const isMid = pct >= 50 && pct < 80;

              return (
                <div
                  key={sub}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800 dark:text-slate-200 truncate pr-2">{sub}</span>
                    <span
                      className={`font-bold ${
                        isHigh
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isMid
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-red-500 dark:text-red-400'
                      }`}
                    >
                      {pct}% ({stats.correct}/{stats.total})
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${
                        isHigh ? 'bg-emerald-500' : isMid ? 'bg-blue-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Weak Topic Roadmap Recommendation */}
          {weakestSubTopic && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-300/60 dark:border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Target size={14} /> Targeted Learning Recommendation
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  You scored lower in <strong className="text-slate-900 dark:text-slate-100">{weakestSubTopic}</strong>. Generate a custom step-by-step roadmap to master this topic.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  navigate(`/dashboard/roadmap?skill=${encodeURIComponent(weakestSubTopic)}`)
                }
                className="btn btn-sm btn-primary shrink-0 gap-1.5 font-bold shadow-md shadow-primary-500/20 text-xs"
              >
                <BookOpen size={14} /> Generate Roadmap for {weakestSubTopic} →
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. QUESTION BREAKDOWN */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Detailed Question Review
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {correctCount} / {totalQuestions} Correct
          </span>
        </div>

        <div className="space-y-4">
          {results.map((q, i) => (
            <QuestionResultCard key={i} q={q} index={i} />
          ))}
        </div>
      </div>

      {/* Footer Return Navigation */}
      <div className="pt-4 flex justify-center">
        <button
          type="button"
          onClick={() => navigate('/dashboard/quiz')}
          className="btn btn-primary gap-2 px-8 py-3 text-sm font-bold shadow-lg shadow-primary-500/20"
        >
          <RotateCcw size={16} /> Choose Another Quiz Topic
        </button>
      </div>
    </div>
  );
}
