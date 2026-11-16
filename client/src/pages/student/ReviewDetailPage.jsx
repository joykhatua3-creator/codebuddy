import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Bug, Shield, Zap, BookOpen, Eye, EyeOff,
  Copy, CheckCheck, ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react';
import { reviewService } from '../../services';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import ScoreBadge from '../../components/ui/ScoreBadge';
import {
  formatDate, getLanguageLabel, getLanguageBadgeClass,
  getConceptLevelClass, getSeverityClass, copyToClipboard
} from '../../utils/helpers';
import { useToast } from '../../components/ui/Toast';

const BugCard = ({ bug, index }) => {
  const [showSolution, setShowSolution] = useState(false);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const handleCopy = async () => {
    await copyToClipboard(bug.solution);
    setCopied(true);
    toast({ type: 'success', message: 'Solution copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-start gap-3 p-4 bg-red-50 border-b border-red-100">
        <div className="p-1.5 bg-red-100 rounded-lg shrink-0 mt-0.5"><Bug size={14} className="text-red-600" /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{bug.title}</span>
            {bug.lineNumber > 0 && (
              <span className="bg-gray-800 text-gray-100 text-xs px-2 py-0.5 rounded font-mono">Line {bug.lineNumber}</span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{bug.description}</p>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Why it happens</p>
          <p className="text-sm text-gray-700">{bug.whyItHappens}</p>
        </div>
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-xs font-semibold text-blue-700 mb-1">💡 Hint</p>
          <p className="text-sm text-blue-800">{bug.hint}</p>
        </div>
        <div>
          <button
            onClick={() => setShowSolution((p) => !p)}
            className="btn btn-secondary btn-sm gap-1.5"
          >
            {showSolution ? <><EyeOff size={14} /> Hide Solution</> : <><Eye size={14} /> Show Solution</>}
          </button>
          {showSolution && (
            <div className="mt-3 bg-gray-900 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-800">
                <span className="text-xs text-gray-400 font-mono">Suggested Fix</span>
                <button onClick={handleCopy} className="btn btn-ghost btn-sm text-gray-400 hover:text-white p-1">
                  {copied ? <CheckCheck size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
              </div>
              <pre className="p-4 text-sm text-green-300 font-mono overflow-x-auto whitespace-pre-wrap">{bug.solution}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ReviewDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allSolutions, setAllSolutions] = useState(false);

  const fetchReview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await reviewService.getById(id);
      setReview(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load review');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchReview(); }, [fetchReview]);

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;
  if (error) return <ErrorMessage message={error} onRetry={fetchReview} />;
  if (!review) return null;

  const qMetrics = review.codeQuality ? Object.entries(review.codeQuality) : [];

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate(-1)} className="btn btn-ghost p-2 mt-0.5">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`badge text-xs font-medium px-2.5 py-1 rounded-full ${getLanguageBadgeClass(review.language)}`}>
              {getLanguageLabel(review.language)}
            </span>
            <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
            {review.fromCache && <span className="badge badge-blue">Cached</span>}
          </div>
          <h2 className="text-xl font-bold text-gray-900">Code Review Result</h2>
        </div>
        <ScoreBadge score={review.score} size="lg" />
      </div>

      {/* Summary */}
      <div className="card p-5">
        <h3 className="section-title mb-2">Overall Assessment</h3>
        <p className="text-sm text-gray-700 leading-relaxed">{review.summary}</p>
      </div>

      {/* Bugs */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title flex items-center gap-2">
            <Bug size={18} className="text-red-500" />
            Bugs Detected ({review.bugs?.length || 0})
          </h3>
          {review.bugs?.length > 1 && (
            <div className="flex gap-2">
              <button onClick={() => setAllSolutions(true)} className="btn btn-secondary btn-sm gap-1">
                <Eye size={14} /> Show All
              </button>
              <button onClick={() => setAllSolutions(false)} className="btn btn-secondary btn-sm gap-1">
                <EyeOff size={14} /> Hide All
              </button>
            </div>
          )}
        </div>
        {review.bugs?.length > 0 ? (
          <div className="space-y-4">
            {review.bugs.map((bug, i) => <BugCard key={i} bug={bug} index={i} forceSolution={allSolutions} />)}
          </div>
        ) : (
          <div className="text-center py-8 text-green-600">
            <CheckCheck size={32} className="mx-auto mb-2" />
            <p className="font-medium">No bugs detected! Great work.</p>
          </div>
        )}
      </div>

      {/* Code Quality */}
      {review.codeQuality && (
        <div className="card p-5">
          <h3 className="section-title mb-4">Code Quality</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {Object.entries(review.codeQuality).map(([key, val]) => (
              <div key={key} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-600 capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <span className="text-xs font-bold text-gray-900">{val.score}/10</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-primary-500 rounded-full" style={{ width: `${val.score * 10}%` }} />
                </div>
                <p className="text-xs text-gray-500">{val.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complexity */}
      {review.complexity && (
        <div className="card p-5">
          <h3 className="section-title flex items-center gap-2 mb-4">
            <Zap size={18} className="text-yellow-500" /> Complexity Analysis
          </h3>
          <div className="grid sm:grid-cols-2 gap-4 mb-3">
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-gray-500 mb-1">Time Complexity</p>
              <p className="text-lg font-bold font-mono text-gray-900">{review.complexity.time}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-gray-500 mb-1">Space Complexity</p>
              <p className="text-lg font-bold font-mono text-gray-900">{review.complexity.space}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">{review.complexity.explanation}</p>
        </div>
      )}

      {/* Security */}
      {review.security?.length > 0 && (
        <div className="card p-5">
          <h3 className="section-title flex items-center gap-2 mb-4">
            <Shield size={18} className="text-orange-500" /> Security Analysis
          </h3>
          <div className="space-y-3">
            {review.security.map((s, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-100 rounded-lg">
                <AlertTriangle size={16} className="text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-900">{s.issue}</span>
                    <span className={`badge text-xs ${getSeverityClass(s.severity)}`}>{s.severity}</span>
                  </div>
                  <p className="text-xs text-gray-600">{s.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Concepts */}
      {review.concepts?.length > 0 && (
        <div className="card p-5">
          <h3 className="section-title flex items-center gap-2 mb-4">
            <BookOpen size={18} className="text-blue-500" /> Programming Concepts
          </h3>
          <div className="flex flex-wrap gap-2">
            {review.concepts.map((c, i) => (
              <span key={i} className={`badge ${getConceptLevelClass(c.level)} px-3 py-1`}>
                {c.name} · {c.level}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
