import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquarePlus, Save } from 'lucide-react';
import { reviewService, teacherService } from '../../services';
import ErrorMessage from '../../components/ui/ErrorMessage';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { ReviewDetailSkeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import ReviewReportView from '../../components/review/ReviewReportView';
import { formatDate } from '../../utils/helpers';

export default function TeacherReviewDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [comment, setComment] = useState('');
  const [adjustedScore, setAdjustedScore] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchReview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await reviewService.getById(id);
      const data = res.data.data;
      setReview(data);
      setComment(data.teacherFeedback?.comment || '');
      setAdjustedScore(
        data.teacherFeedback?.adjustedScore != null
          ? String(data.teacherFeedback.adjustedScore)
          : data.score != null
          ? String(data.score)
          : ''
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load student review');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      return toast({ type: 'error', message: 'Please enter a mentor feedback comment' });
    }
    const payload = { comment: comment.trim() };
    if (adjustedScore !== '' && !Number.isNaN(Number(adjustedScore))) {
      const num = Math.max(0, Math.min(100, Math.round(Number(adjustedScore))));
      payload.adjustedScore = num;
    }

    setSaving(true);
    try {
      const res = await teacherService.addReviewFeedback(id, payload);
      setReview(res.data.data);
      toast({ type: 'success', message: 'Mentor feedback and score saved!' });
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Failed to save feedback' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ReviewDetailSkeleton />;
  if (error) return <ErrorMessage message={error} onRetry={fetchReview} />;
  if (!review) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm gap-1.5 text-gray-500">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Teacher Mentor Feedback & Score Override Panel */}
      <form onSubmit={handleSubmitFeedback} className="card p-5 border-l-4 border-l-primary-600 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-primary-700 dark:text-primary-300 font-semibold text-sm">
            <MessageSquarePlus size={18} />
            <span>Mentor Feedback &amp; Score Override</span>
          </div>
          {review.teacherFeedback?.updatedAt && (
            <span className="text-xs text-gray-500 dark:text-slate-400">
              Last updated {formatDate(review.teacherFeedback.updatedAt)}
            </span>
          )}
        </div>

        <div className="grid sm:grid-cols-4 gap-4">
          <div className="sm:col-span-3">
            <label className="label">Mentor Comment (visible to student)</label>
            <textarea
              rows={3}
              className="input"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write constructive feedback, guidance, or grading remarks..."
              required
            />
          </div>
          <div>
            <label className="label">Score Override (0–100)</label>
            <input
              type="number"
              min="0"
              max="100"
              className="input"
              value={adjustedScore}
              onChange={(e) => setAdjustedScore(e.target.value)}
            />
            {review.teacherFeedback?.originalScore != null && (
              <p className="text-[11px] text-gray-400 dark:text-slate-400 mt-1">
                Original AI Score: {review.teacherFeedback.originalScore}%
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn btn-primary btn-sm gap-1.5">
            {saving ? <><LoadingSpinner size="sm" /> Saving...</> : <><Save size={14} /> Save Mentor Feedback</>}
          </button>
        </div>
      </form>

      <ReviewReportView review={review} />
    </div>
  );
}
