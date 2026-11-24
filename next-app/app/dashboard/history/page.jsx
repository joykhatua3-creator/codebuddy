'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, Trash2, Filter } from 'lucide-react';
import { reviewService } from '@/lib/clientApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmModal from '@/components/ui/ConfirmModal';
import ScoreBadge from '@/components/ui/ScoreBadge';
import { useToast } from '@/components/ui/Toast';
import { formatRelativeTime, getLanguageLabel, getLanguageBadgeClass, truncate } from '@/lib/helpers';

const LANGUAGES = ['', 'javascript', 'python', 'java', 'cpp'];
const SORTS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'createdAt', label: 'Oldest First' },
  { value: '-score', label: 'Highest Score' },
  { value: 'score', label: 'Lowest Score' },
];

export default function ReviewHistoryPage() {
  const router = useRouter();
  const toast = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [minScore, setMinScore] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { sort, page, limit: 10 };
      if (language) params.language = language;
      if (minScore) params.minScore = minScore;
      const res = await reviewService.getAll(params);
      setReviews(res.data.data.reviews || []);
      setPagination(res.data.data.pagination || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [language, sort, minScore, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleDelete = async () => {
    try {
      await reviewService.delete(deleteId);
      setDeleteId(null);
      toast({ type: 'success', message: 'Review deleted' });
      fetchReviews();
    } catch {
      toast({ type: 'error', message: 'Failed to delete review' });
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Review History</h2>
        <p className="text-sm text-gray-500 mt-0.5">All your past code reviews and progress reports</p>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <div className="min-w-[140px]">
          <label className="label">Language</label>
          <select value={language} onChange={(e) => { setLanguage(e.target.value); setPage(1); }} className="input">
            <option value="">All Languages</option>
            {LANGUAGES.filter(Boolean).map((l) => (
              <option key={l} value={l}>{getLanguageLabel(l)}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[120px]">
          <label className="label">Min Score</label>
          <input
            type="number"
            min="0"
            max="100"
            value={minScore}
            onChange={(e) => { setMinScore(e.target.value); setPage(1); }}
            className="input"
            placeholder="0–100"
          />
        </div>
        <div className="min-w-[160px]">
          <label className="label">Sort By</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchReviews} />
      ) : reviews.length === 0 ? (
        <EmptyState
          title="No reviews found"
          description="Submit code to receive your first structured AI review."
          actionLabel="Submit Code"
          onAction={() => router.push('/dashboard/code-review')}
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div
              key={r._id}
              onClick={() => router.push(`/dashboard/history/${r._id}`)}
              className="card card-hover p-4 flex items-center justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-center gap-4 min-w-0">
                <ScoreBadge score={r.score || 0} size="sm" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge ${getLanguageBadgeClass(r.language)}`}>
                      {getLanguageLabel(r.language)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatRelativeTime(r.createdAt)}
                    </span>
                    {r.fromCache && (
                      <span className="badge badge-gray text-xs">From Cache</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-1 truncate">
                    {r.summary || 'Code review summary'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(r._id);
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn btn-secondary btn-sm"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600">
                Page {page} of {pagination.pages}
              </span>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="btn btn-secondary btn-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
