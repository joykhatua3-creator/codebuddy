import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { reviewService } from '../../services';
import ErrorMessage from '../../components/ui/ErrorMessage';
import { ReviewDetailSkeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import ReviewReportView from '../../components/review/ReviewReportView';

export default function ReviewDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);
  const [retryingGemini, setRetryingGemini] = useState(false);

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

  const handleSaveTitle = async (newTitle) => {
    setSavingTitle(true);
    try {
      const res = await reviewService.update(id, { title: newTitle });
      setReview((prev) => ({ ...prev, title: res.data.data.title }));
      toast({ type: 'success', message: 'Title updated' });
      return true;
    } catch {
      toast({ type: 'error', message: 'Failed to update title' });
      return false;
    } finally {
      setSavingTitle(false);
    }
  };

  const handleRetryGemini = async () => {
    setRetryingGemini(true);
    try {
      const res = await reviewService.retry(id);
      const updated = res.data.data;
      setReview(updated);
      if (updated.isFallback) {
        toast({
          type: 'warning',
          message: updated.fallbackReason || 'Gemini AI is still unavailable; kept Static Syntax Analyzer results.',
        });
      } else {
        toast({ type: 'success', message: 'Review updated with Gemini AI!' });
      }
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Retry failed' });
    } finally {
      setRetryingGemini(false);
    }
  };

  if (loading) return <ReviewDetailSkeleton />;
  if (error) return <ErrorMessage message={error} onRetry={fetchReview} />;
  if (!review) return null;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm gap-1.5 text-gray-500">
        <ArrowLeft size={16} /> Back to History
      </button>

      <ReviewReportView
        review={review}
        editableTitle
        onSaveTitle={handleSaveTitle}
        savingTitle={savingTitle}
        onRetryGemini={handleRetryGemini}
        retryingGemini={retryingGemini}
        showPracticeActions
      />
    </div>
  );
}
