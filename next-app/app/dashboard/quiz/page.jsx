'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { quizService } from '@/lib/clientApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

const OPTIONS = ['A', 'B', 'C', 'D'];

export default function QuizPage() {
  const router = useRouter();
  const toast = useToast();
  const [quiz, setQuiz] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setAnswers({});
    setCurrentQ(0);
    try {
      const res = await quizService.generate();
      setQuiz(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate quiz. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const selectAnswer = (optionIndex) => {
    setAnswers((prev) => ({ ...prev, [currentQ]: optionIndex }));
  };

  const handleSubmit = async () => {
    const answersArray = quiz.questions.map((_, i) => ({
      questionIndex: i,
      selectedOption: answers[i] ?? null,
    }));
    setSubmitting(true);
    try {
      await quizService.submit(quiz._id, { answers: answersArray });
      router.push(`/dashboard/quiz/${quiz._id}`);
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Failed to submit quiz' });
      setSubmitting(false);
    }
  };

  if (!quiz && !generating) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Practice Quizzes</h2>
          <p className="text-sm text-gray-500 mt-0.5">AI-generated quizzes based on your weakest topics</p>
        </div>
        {error && <ErrorMessage message={error} />}
        <EmptyState
          icon={Brain}
          title="Ready for a quiz?"
          description="Generate a quiz with 5 questions targeting your weakest programming concepts."
          actionLabel="Generate Quiz"
          onAction={handleGenerate}
        />
      </div>
    );
  }

  if (generating) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-10 text-center space-y-4">
          <LoadingSpinner size="lg" className="mx-auto" />
          <p className="font-medium text-gray-700">AI is generating your quiz...</p>
          <p className="text-sm text-gray-500">Creating 5 questions tailored to your weak topics</p>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQ];
  const isLast = currentQ === quiz.questions.length - 1;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Practice Quiz</h2>
          <div className="flex flex-wrap gap-1 mt-1">
            {quiz.topics?.map((t) => (
              <span key={t} className="badge badge-blue text-xs">{t}</span>
            ))}
          </div>
        </div>
        <span className="text-sm text-gray-500 font-medium">
          Question {currentQ + 1} of {quiz.questions.length}
        </span>
      </div>

      <div className="card p-6 space-y-6">
        <h3 className="text-base font-semibold text-gray-900 leading-relaxed">
          {question.question}
        </h3>

        <div className="space-y-3">
          {question.options.map((opt, i) => {
            const isSelected = answers[currentQ] === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => selectAnswer(i)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 text-primary-900'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {OPTIONS[i]}
                </span>
                <span className="text-sm flex-1">{opt}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button
            onClick={() => setCurrentQ((p) => p - 1)}
            disabled={currentQ === 0}
            className="btn btn-secondary btn-sm gap-1"
          >
            <ChevronLeft size={16} /> Previous
          </button>

          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || answeredCount < quiz.questions.length}
              className="btn btn-primary btn-sm gap-1.5"
            >
              {submitting ? <LoadingSpinner size="sm" /> : <><CheckCircle size={16} /> Submit Quiz</>}
            </button>
          ) : (
            <button
              onClick={() => setCurrentQ((p) => p + 1)}
              className="btn btn-primary btn-sm gap-1"
            >
              Next <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
