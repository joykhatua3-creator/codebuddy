'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Bug, Shield, Zap, BookOpen, Eye, EyeOff,
  Copy, CheckCheck
} from 'lucide-react';
import { reviewService } from '@/lib/clientApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import ScoreBadge from '@/components/ui/ScoreBadge';
import {
  formatDate, getLanguageLabel, getLanguageBadgeClass,
  getConceptLevelClass, getSeverityClass, copyToClipboard
} from '@/lib/helpers';
import { useToast } from '@/components/ui/Toast';

const BugCard = ({ bug }) => {
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
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
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
          <p className="text-xs font-semibold text-blue-700 mb-1">💡 Pedagogical Hint</p>
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
              <pre className="p-4 text-sm text-green-300 font-mono overflow-x-auto whitespace-pre-wrap">
                {bug.solution}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ReviewDetailPage({ params }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;
  }
  if (error) return <ErrorMessage message={error} onRetry={fetchReview} />;
  if (!review) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Link href="/dashboard/history" className="btn btn-secondary btn-sm gap-1.5">
          <ArrowLeft size={16} /> Back to History
        </Link>
        <span className="text-xs text-gray-400">Reviewed on {formatDate(review.createdAt)}</span>
      </div>

      <div className="card p-6 flex flex-col sm:flex-row items-center gap-6">
        <ScoreBadge score={review.score || 0} size="lg" />
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-2 flex-wrap">
            <span className={`badge ${getLanguageBadgeClass(review.language)}`}>
              {getLanguageLabel(review.language)}
            </span>
            {review.fromCache && <span className="badge badge-gray">From Cache</span>}
          </div>
          <h2 className="text-lg font-bold text-gray-900">{review.summary}</h2>
        </div>
      </div>

      {review.bugs?.length > 0 && (
        <div className="space-y-4">
          <h3 className="section-title flex items-center gap-2">
            <Bug size={18} className="text-red-500" /> Detected Issues ({review.bugs.length})
          </h3>
          <div className="space-y-3">
            {review.bugs.map((bug, i) => (
              <BugCard key={i} bug={bug} />
            ))}
          </div>
        </div>
      )}

      {review.complexity && (
        <div className="card p-5">
          <h3 className="section-title flex items-center gap-2 mb-3">
            <Zap size={18} className="text-yellow-500" /> Algorithmic Complexity
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-xs font-semibold text-gray-500 uppercase">Time Complexity</span>
              <p className="text-lg font-mono font-bold text-gray-900 mt-0.5">{review.complexity.time}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-xs font-semibold text-gray-500 uppercase">Space Complexity</span>
              <p className="text-lg font-mono font-bold text-gray-900 mt-0.5">{review.complexity.space}</p>
            </div>
          </div>
          {review.complexity.explanation && (
            <p className="text-sm text-gray-600 mt-3">{review.complexity.explanation}</p>
          )}
        </div>
      )}

      {review.concepts?.length > 0 && (
        <div className="card p-5">
          <h3 className="section-title flex items-center gap-2 mb-3">
            <BookOpen size={18} className="text-primary-500" /> Programming Concepts
          </h3>
          <div className="flex flex-wrap gap-2">
            {review.concepts.map((c, i) => (
              <span key={i} className={`badge ${getConceptLevelClass(c.level)}`}>
                {c.name} · {c.level}
              </span>
            ))}
          </div>
        </div>
      )}

      {review.security?.length > 0 && (
        <div className="card p-5">
          <h3 className="section-title flex items-center gap-2 mb-3">
            <Shield size={18} className="text-red-500" /> Security Recommendations
          </h3>
          <div className="space-y-2">
            {review.security.map((sec, i) => (
              <div key={i} className="p-3 rounded-lg bg-gray-50 border border-gray-100 flex items-start gap-3">
                <span className={`badge shrink-0 ${getSeverityClass(sec.severity)} uppercase`}>
                  {sec.severity}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{sec.issue}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{sec.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
