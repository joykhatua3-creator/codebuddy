import { useEffect, useState, useCallback } from 'react';
import { Map, RefreshCw, CheckCircle, Circle, Loader, Trash2 } from 'lucide-react';
import { roadmapService } from '../../services';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useToast } from '../../components/ui/Toast';

export default function RoadmapPage() {
  const toast = useToast();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [error, setError] = useState('');

  const fetchRoadmap = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await roadmapService.get();
      setRoadmap(res.data.data);
    } catch (err) {
      if (err.response?.status !== 404) setError(err.response?.data?.message || 'Failed to load roadmap');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoadmap(); }, [fetchRoadmap]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await roadmapService.generate();
      setRoadmap(res.data.data);
      toast({ type: 'success', message: 'Learning roadmap generated!' });
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Failed to generate roadmap' });
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await roadmapService.delete();
      setRoadmap(null);
      setDeleteModalOpen(false);
      toast({ type: 'success', message: 'Roadmap reset successfully' });
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Failed to reset roadmap' });
    } finally {
      setResetting(false);
    }
  };

  const handleToggleStep = async (stepId, currentState) => {
    try {
      const res = await roadmapService.updateStep(stepId, { completed: !currentState });
      setRoadmap((prev) => ({
        ...prev,
        completionPercentage: res.data.data.completionPercentage,
        steps: prev.steps.map((s) =>
          s._id === stepId ? { ...s, completed: !currentState } : s
        ),
      }));
      toast({ type: 'success', message: !currentState ? 'Step marked complete!' : 'Step unmarked' });
    } catch {
      toast({ type: 'error', message: 'Failed to update step' });
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;
  if (error) return <ErrorMessage message={error} onRetry={fetchRoadmap} />;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Learning Roadmap</h2>
          <p className="text-sm text-gray-500 mt-0.5">Your personalized AI-generated learning plan</p>
        </div>
        <div className="flex items-center gap-2">
          {roadmap && (
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="btn btn-secondary btn-sm gap-1.5 text-red-600 hover:bg-red-50"
            >
              <Trash2 size={14} /> Reset Plan
            </button>
          )}
          <button onClick={handleGenerate} disabled={generating} className="btn btn-primary gap-2">
            {generating ? (
              <><LoadingSpinner size="sm" /> Generating...</>
            ) : roadmap ? (
              <><RefreshCw size={16} /> Regenerate</>
            ) : (
              <><Map size={16} /> Generate Roadmap</>
            )}
          </button>
        </div>
      </div>

      {!roadmap ? (
        <EmptyState
          icon={Map}
          title="No roadmap yet"
          description="Generate a personalized learning roadmap based on your weak programming topics. Submit at least one code review first."
          actionLabel="Generate Roadmap"
          onAction={handleGenerate}
        />
      ) : (
        <>
          {/* Progress bar */}
          <div className="card p-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Overall Progress</span>
              <span className="font-bold text-primary-600">{roadmap.completionPercentage}%</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-500"
                style={{ width: `${roadmap.completionPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {roadmap.steps.filter((s) => s.completed).length} of {roadmap.steps.length} steps completed
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {roadmap.steps.map((step, idx) => (
              <div
                key={step._id || idx}
                className={`card p-4 transition-all duration-200 border-l-4 ${
                  step.completed ? 'border-l-green-500 bg-green-50/30' : 'border-l-primary-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleStep(step._id, step.completed)}
                    className="mt-0.5 text-gray-400 hover:text-primary-600 transition-colors shrink-0"
                  >
                    {step.completed ? (
                      <CheckCircle className="text-green-500" size={20} />
                    ) : (
                      <Circle size={20} />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{step.title}</span>
                      <span className="badge badge-blue text-xs">{step.topic}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                    {step.estimatedHours && (
                      <p className="text-xs text-gray-400 mt-2">⏱ Est: {step.estimatedHours}h</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Confirm Reset Roadmap Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        danger
        title="Reset Learning Roadmap?"
        message="Are you sure you want to clear your current roadmap? You can generate a fresh one anytime based on your latest review progress."
        confirmLabel={resetting ? 'Resetting...' : 'Yes, Reset Roadmap'}
        onConfirm={handleReset}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
