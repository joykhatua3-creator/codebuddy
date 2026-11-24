import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Bug, Shield, Zap, BookOpen, Eye, EyeOff,
  Copy, CheckCheck, ChevronDown, ChevronUp, AlertTriangle,
  Edit2, Check, X
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
        <div className="p-1.5 bg-red-100 rounded-lg shrink-0 mt-0.5">
          <Bug size={14} className="text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{bug.title}</span>
            {bug.lineNumber > 0 && (
              <span className="bg-gray-800 text-gray-100 text-xs px-2 py-0.5 rounded font-mono">
                Line {bug.lineNumber}
              </span>
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
          <p className="text-xs font-semibold text-blue-700 mb-1">💡 Guided Hint</p>
          <p className="text-sm text-blue-800">{bug.hint}</p>
        </div>
        <div>
          <button
            onClick={() => setShowSolution((p) => !p)}
            className="btn btn-secondary btn-sm gap-1.5"
          >
            {showSolution ? <><EyeOff size={14} /> Hide Solution</> : <><Eye size={14} /> Reveal Solution</>}
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
  const toast = useToast();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);

  const fetchReview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await reviewService.getById(id);
      setReview(res.data.data);
      setTitleValue(res.data.data.title || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load review');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchReview(); }, [fetchReview]);

  const handleSaveTitle = async () => {
    setSavingTitle(true);
    try {
      const res = await reviewService.update(id, { title: titleValue });
      setReview((prev) => ({ ...prev, title: res.data.data.title }));
      setEditingTitle(false);
      toast({ type: 'success', message: 'Title updated' });
    } catch (err) {
      toast({ type: 'error', message: 'Failed to update title' });
    } finally {
      setSavingTitle(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;
  if (error) return <ErrorMessage message={error} onRetry={fetchReview} />;
  if (!review) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top navigation */}
      <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm gap-1.5 text-gray-500">
        <ArrowLeft size={16} /> Back to History
      </button>

      {/* Header card with Score & Editable Title */}
      <div className="card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`badge ${getLanguageBadgeClass(review.language)} font-mono text-xs uppercase`}>
              {getLanguageLabel(review.language)}
            </span>
            <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
          </div>

          {editingTitle ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                className="input input-sm font-bold text-gray-900"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                placeholder="Name this review"
              />
              <button onClick={handleSaveTitle} disabled={savingTitle} className="btn btn-primary btn-sm">
                <Check size={14} />
              </button>
              <button onClick={() => setEditingTitle(false)} className="btn btn-secondary btn-sm">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <h2 className="text-xl font-bold text-gray-900">{review.title || 'Code Review Report'}</h2>
              <button onClick={() => setEditingTitle(true)} className="text-gray-400 hover:text-gray-600">
                <Edit2 size={14} />
              </button>
            </div>
          )}

          <p className="text-sm text-gray-600 mt-2">{review.summary}</p>
        </div>

        <div className="shrink-0 flex items-center gap-4">
          <ScoreBadge score={review.score} size="lg" />
        </div>
      </div>

      {/* Complexity and Concepts */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Complexity card */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2 text-primary-600 font-semibold text-sm">
            <Zap size={16} />
            <span>Complexity Analysis</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 font-medium">Time Complexity</p>
              <p className="text-base font-bold text-gray-900 font-mono mt-0.5">
                {review.complexity?.time || 'O(1)'}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 font-medium">Space Complexity</p>
              <p className="text-base font-bold text-gray-900 font-mono mt-0.5">
                {review.complexity?.space || 'O(1)'}
              </p>
            </div>
          </div>
          {review.complexity?.explanation && (
            <p className="text-xs text-gray-500 mt-2">{review.complexity.explanation}</p>
          )}
        </div>

        {/* Concept tags card */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2 text-primary-600 font-semibold text-sm">
            <BookOpen size={16} />
            <span>Tagged Concepts</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {review.concepts?.map((c, i) => (
              <span
                key={i}
                className={`badge text-xs px-2.5 py-1 ${getConceptLevelClass(c.status)}`}
              >
                {c.name} • {c.status}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bugs & Guided Hints */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Bug size={18} className="text-red-500" />
          <span>Identified Bugs & Pedagogical Hints ({review.bugs?.length || 0})</span>
        </h3>

        {review.bugs?.length === 0 ? (
          <div className="card p-6 text-center text-gray-500 text-sm">
            🎉 No bugs found! Excellent work.
          </div>
        ) : (
          review.bugs?.map((bug, i) => <BugCard key={i} bug={bug} index={i} />)
        )}
      </div>

      {/* Security Analysis */}
      {review.securityIssues?.length > 0 && (
        <div className="card p-5 border-l-4 border-l-amber-500 space-y-3">
          <div className="flex items-center gap-2 text-amber-700 font-semibold">
            <Shield size={18} />
            <span>Security Considerations ({review.securityIssues.length})</span>
          </div>
          <div className="space-y-2">
            {review.securityIssues.map((issue, idx) => (
              <div key={idx} className="p-3 bg-amber-50/50 rounded-lg text-sm text-amber-900">
                <span className="font-semibold">{issue.title || issue.issue || 'Security Note'}: </span>
                <span>{issue.description || issue.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
