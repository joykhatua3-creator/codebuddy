'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Trophy, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { quizService } from '@/lib/clientApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';

const OPTIONS = ['A', 'B', 'C', 'D'];

export default function QuizResultPage({ params }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openItems, setOpenItems] = useState({ 0: true });

  const fetchQuiz = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await quizService.getById(id);
      setQuiz(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load quiz results');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;
  }
  if (error) return <ErrorMessage message={error} onRetry={fetchQuiz} />;
  if (!quiz) return null;

  const toggleItem = (i) => {
    setOpenItems((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="card p-8 text-center bg-white">
        <div className="mx-auto w-24 h-24 rounded-full border-4 border-primary-500 bg-primary-50 flex flex-col items-center justify-center mb-4">
          <Trophy size={32} className="text-primary-600 mb-0.5" />
          <span className="text-lg font-bold text-primary-700">{quiz.score}%</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Quiz Completed!</h2>
        <p className="text-sm text-gray-500 mt-1">
          You got <span className="font-semibold text-gray-900">{quiz.correctCount}</span> out of{' '}
          <span className="font-semibold text-gray-900">{quiz.totalQuestions}</span> questions correct.
        </p>
        <div className="flex justify-center gap-3 mt-6">
          <Link href="/dashboard/quiz" className="btn btn-primary btn-sm gap-1.5">
            <RotateCcw size={15} /> Take Another Quiz
          </Link>
          <Link href="/dashboard" className="btn btn-secondary btn-sm">
            Dashboard
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="section-title">Review Answers</h3>
        {quiz.questions.map((q, idx) => {
          const userAns = quiz.answers?.find((a) => a.questionIndex === idx)?.selectedOption;
          const isCorrect = userAns === q.correctAnswer;
          const isOpen = !!openItems[idx];

          return (
            <div
              key={idx}
              className={`border-2 rounded-xl overflow-hidden bg-white ${
                isCorrect ? 'border-green-200' : 'border-red-200'
              }`}
            >
              <button
                onClick={() => toggleItem(idx)}
                className={`w-full flex items-start gap-3 p-4 text-left ${
                  isCorrect ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                {isCorrect ? (
                  <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
                ) : (
                  <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-gray-500">Question {idx + 1}</span>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{q.question}</p>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {isOpen && (
                <div className="p-4 space-y-2">
                  {q.options.map((opt, i) => {
                    const isSelected = i === userAns;
                    const isCorrectOpt = i === q.correctAnswer;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border ${
                          isCorrectOpt
                            ? 'border-green-400 bg-green-50'
                            : isSelected && !isCorrectOpt
                            ? 'border-red-300 bg-red-50'
                            : 'border-transparent bg-gray-50'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                            isCorrectOpt
                              ? 'bg-green-500 text-white'
                              : isSelected
                              ? 'bg-red-400 text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {OPTIONS[i]}
                        </span>
                        <span className="text-sm text-gray-800 flex-1">{opt}</span>
                      </div>
                    );
                  })}
                  {q.explanation && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-900">
                      <span className="font-semibold block mb-0.5">💡 Explanation:</span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
