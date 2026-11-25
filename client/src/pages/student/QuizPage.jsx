import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { quizService } from '../../services';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';

const OPTIONS = ['A', 'B', 'C', 'D'];

export default function QuizPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [quiz, setQuiz] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionIndex: selectedOption }
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
      const res = await quizService.submit(quiz._id, { answers: answersArray });
      navigate(`/dashboard/quiz/result/${quiz._id}`, { state: { result: res.data.data } });
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
          <p className="text-sm text-gray-500">Creating 5 questions on your weak topics</p>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQ];
  const isLast = currentQ === quiz.questions.length - 1;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Practice Quiz</h2>
          <div className="flex flex-wrap gap-1 mt-1">
            {quiz.topics?.map((t) => (
              <span key={t} className="badge badge-blue text-xs">{t}</span>
            ))}
          </div>
        </div>
        <button onClick={handleGenerate} disabled={submitting} className="btn btn-secondary btn-sm">New Quiz</button>
      </div>

      {/* Progress indicator */}
      <div className="card p-4">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Question {currentQ + 1} of {quiz.totalQuestions}</span>
          <span>{answeredCount}/{quiz.totalQuestions} answered</span>
        </div>
        <div className="flex gap-1">
          {quiz.questions.map((_, i) => (
            <button key={i} onClick={() => setCurrentQ(i)}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                i === currentQ ? 'bg-primary-600' : answers[i] !== undefined ? 'bg-primary-300' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question card */}
      <div className="card p-6 space-y-5">
        <div>
          <span className="badge badge-blue mb-3">Question {currentQ + 1}</span>
          <p className="text-base font-medium text-gray-900 leading-relaxed">{question.question}</p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, i) => {
            const isSelected = answers[currentQ] === i;
            return (
              <button
                key={i}
                onClick={() => selectAnswer(i)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-3 ${
                  isSelected ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {OPTIONS[i]}
                </span>
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button onClick={() => setCurrentQ((p) => p - 1)} disabled={currentQ === 0}
          className="btn btn-secondary gap-1">
          <ChevronLeft size={16} /> Previous
        </button>

        {isLast ? (
          <button onClick={handleSubmit} disabled={submitting || answeredCount === 0}
            className="btn btn-primary gap-2">
            {submitting ? <><LoadingSpinner size="sm" /> Submitting...</> : <><CheckCircle size={16} /> Submit Quiz</>}
          </button>
        ) : (
          <button onClick={() => setCurrentQ((p) => p + 1)}
            className="btn btn-primary gap-1">
            Next <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
