import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Trash2, Bookmark, BookmarkCheck, Filter, ChevronDown } from 'lucide-react';
import { reviewService } from '../../services';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';
import ScoreBadge from '../../components/ui/ScoreBadge';
import { useToast } from '../../components/ui/Toast';
import { formatRelativeTime, getLanguageLabel, getLanguageBadgeClass, truncate } from '../../utils/helpers';

const LANGUAGES = ['', 'javascript', 'python', 'java', 'cpp'];
const SORTS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'createdAt', label: 'Oldest First' },
  { value: '-score', label: 'Highest Score' },
  { value: 'score', label: 'Lowest Score' },
];

export default function ReviewHistoryPage() {
  const navigate = useNavigate();
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

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

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

  const handleBookmark = async (id, e) => {
    e.stopPropagation();
    try {
      await reviewService.toggleBookmark(id);
      setReviews((prev) =>
        prev.map((r) => r._id === id ? { ...r, isBookmarked: !r.isBookmarked } : r)
      );
    } catch {
      toast({ type: 'error', message: 'Failed to update bookmark' });
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Review History</h2>
        <p className="text-sm text-gray-500 mt-0.5">All your past code reviews</p>
      </div>

      {/* Filters */}
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
          <input type="number" min="0" max="100" value={minScore}
            onChange={(e) => { setMinScore(e.target.value); setPage(1); }}
            className="input" placeholder="0–100" />
        </div>
        <div className="min-w-[160px]">
          <label className="label">Sort By</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input">
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <button onClick={() => { setLanguage(''); setMinScore(''); setSort('-createdAt'); setPage(1); }}
          className="btn btn-secondary btn-sm">Reset</button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchReviews} />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No reviews found"
          description="Submit your first code review to see it here."
          actionLabel="Submit Code Review"
          onAction={() => navigate('/dashboard/code-review')}
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r._id} className="card p-4 hover:shadow-card-hover transition-shadow cursor-pointer"
              onClick={() => navigate(`/dashboard/review/${r._id}`)}>
              <div className="flex items-start gap-4">
                <ScoreBadge score={r.score} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`badge text-xs px-2 py-0.5 rounded-full ${getLanguageBadgeClass(r.language)}`}>
                      {getLanguageLabel(r.language)}
                    </span>
                    <span className="text-xs text-gray-400">{formatRelativeTime(r.createdAt)}</span>
                    {r.bugs !== undefined && (
                      <span className="text-xs text-red-500">{r.bugs} bug{r.bugs !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{truncate(r.summary, 120)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button onClick={(e) => handleBookmark(r._id, e)}
                    className="btn btn-ghost p-1.5 text-gray-400 hover:text-yellow-500">
                    {r.isBookmarked ? <BookmarkCheck size={16} className="text-yellow-500" /> : <Bookmark size={16} />}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/review/${r._id}`); }}
                    className="btn btn-ghost p-1.5 text-gray-400 hover:text-blue-500">
                    <Eye size={16} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteId(r._id); }}
                    className="btn btn-ghost p-1.5 text-gray-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn btn-secondary btn-sm">← Prev</button>
          <span className="btn btn-ghost btn-sm">{page} / {pagination.pages}</span>
          <button disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)} className="btn btn-secondary btn-sm">Next →</button>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Review"
        message="This review will be permanently deleted. This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
