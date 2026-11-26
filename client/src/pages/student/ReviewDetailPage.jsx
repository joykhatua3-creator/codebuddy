import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { reviewService } from '../../services';
import { QUERY_KEYS } from '../../lib/queryClient';
import ErrorMessage from '../../components/ui/ErrorMessage';
import { ReviewDetailSkeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import ReviewReportView from '../../components/review/ReviewReportView';

export default function ReviewDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [savingTitle, setSavingTitle] = useState(false);
  const [retryingGemini, setRetryingGemini] = useState(false);

  const { data: review, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.reviewDetail(id),
    queryFn: async () => {
      const res = await reviewService.getById(id);
      return res.data.data;
    },
    enabled: Boolean(id),
  });

  const handleSaveTitle = async (newTitle) => {
    setSavingTitle(true);
    try {
      const res = await reviewService.update(id, { title: newTitle });
      queryClient.setQueryData(QUERY_KEYS.reviewDetail(id), (prev) =>
        prev ? { ...prev, title: res.data.data.title } : res.data.data
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reviewsRoot });
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
      queryClient.setQueryData(QUERY_KEYS.reviewDetail(id), updated);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reviewsRoot });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.progress });
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

  if (isLoading && !review) return <ReviewDetailSkeleton />;
  if (error) {
    return (
      <ErrorMessage
        message={error.response?.data?.message || 'Failed to load review'}
        onRetry={refetch}
      />
    );
  }
  if (!review) return null;

  return (
    <div className="space-y-4 w-full max-w-[1440px] mx-auto px-2 sm:px-4 lg:px-6 overflow-x-hidden">
      <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm gap-1.5">
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
