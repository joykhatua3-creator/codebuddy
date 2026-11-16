import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Trophy, RotateCcw, LayoutDashboard, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { getScoreColor, getScoreLabel } from '../../utils/helpers';

const OPTIONS = ['A', 'B', 'C', 'D'];

const QuestionResult = ({ q, index }) => {
  const [open, setOpen] = useState(index === 0);
  const isCorrect = q.isCorrect;

  return (
    <div className={`border-2 rounded-xl overflow-hidden ${isCorrect ? 'border-green-200' : 'border-red-200'}`}>
      <button onClick={() => setOpen((p) => !p)}
        className={`w-full flex items-start gap-3 p-4 text-left ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
        {isCorrect
          ? <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
          : <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />}
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-gray-500">Q{index + 1}</span>
          <p className="text-sm font-medium text-gray-800 mt-0.5">{q.question}</p>
        </div>
        {open ? <ChevronUp size={16} className="shrink-0 text-gray-400 mt-1" /> : <ChevronDown size={16} className="shrink-0 text-gray-400 mt-1" />}
      </button>

      {open && (
        <div className="p-4 space-y-2">
          {q.options.map((opt, i) => {
            const isSelected = i === q.selectedOption;
            const isCorrectOpt = i === q.correctAnswer;
            return (
              <div key={i} className={`flex items-center gap-2 p-2.5 rounded-lg border ${
                isCorrectOpt ? 'border-green-400 bg-green-50' :
                isSelected && !isCorrectOpt ? 'border-red-300 bg-red-50' :
                'border-transparent bg-gray-50'
              }`}>
                <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                  isCorrectOpt ? 'bg-green-500 text-white' :
                  isSelected && !isCorrectOpt ? 'bg-red-400 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>{OPTIONS[i]}</span>
                <span className="text-sm text-gray-800 flex-1">{opt}</span>
                {isCorrectOpt && <CheckCircle size={14} className="text-green-500 shrink-0" />}
                {isSelected && !isCorrectOpt && <XCircle size={14} className="text-red-500 shrink-0" />}
              </div>
            );
          })}
          {q.explanation && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs font-semibold text-blue-700 mb-0.5">💡 Explanation</p>
              <p className="text-xs text-gray-700">{q.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function QuizResultPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const result = state?.result;

  if (!result) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Result not found.</p>
        <button onClick={() => navigate('/dashboard/quiz')} className="btn btn-primary">Go to Quizzes</button>
      </div>
    );
  }

  const { score, correctCount, totalQuestions, results = [], topics = [] } = result;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Score card */}
      <div className="card p-8 text-center">
        <div className={`mx-auto w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center mb-4 ${
          score >= 80 ? 'border-green-400 bg-green-50' :
          score >= 60 ? 'border-blue-400 bg-blue-50' :
          score >= 40 ? 'border-yellow-400 bg-yellow-50' :
          'border-red-400 bg-red-50'
        }`}>
          <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}%</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900">{getScoreLabel(score)}!</h2>
        <p className="text-gray-500 mt-1 text-sm">
          You got <strong>{correctCount}</strong> out of <strong>{totalQuestions}</strong> questions correct
        </p>
        {topics.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1 mt-3">
            {topics.map((t) => <span key={t} className="badge badge-blue text-xs">{t}</span>)}
          </div>
        )}
        <div className="flex gap-3 justify-center mt-6">
          <button onClick={() => navigate('/dashboard/quiz')} className="btn btn-primary gap-2">
            <RotateCcw size={16} /> Take Another Quiz
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary gap-2">
            <LayoutDashboard size={16} /> Dashboard
          </button>
        </div>
      </div>

      {/* Question breakdown */}
      <div>
        <h3 className="section-title mb-3">Question Breakdown</h3>
        <div className="space-y-3">
          {results.map((q, i) => <QuestionResult key={i} q={q} index={i} />)}
        </div>
      </div>
    </div>
  );
}
