import { useEffect, useState, useCallback } from 'react';
import { Map, RefreshCw, CheckCircle, Circle, Loader } from 'lucide-react';
import { roadmapService } from '../../services';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';

export default function RoadmapPage() {
  const toast = useToast();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Learning Roadmap</h2>
          <p className="text-sm text-gray-500 mt-0.5">Your personalized AI-generated learning plan</p>
        </div>
        <button onClick={handleGenerate} disabled={generating}
          className="btn btn-primary gap-2">
          {generating ? <><LoadingSpinner size="sm" /> Generating...</> : roadmap ? <><RefreshCw size={16} /> Regenerate</> : <><Map size={16} /> Generate Roadmap</>}
        </button>
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
          <div className="space-y-4">
            {roadmap.steps.map((step, i) => (
              <div key={step._id}
                className={`card p-5 border-l-4 ${step.completed ? 'border-green-400 opacity-80' : 'border-primary-400'}`}>
                <div className="flex items-start gap-3">
                  <button onClick={() => handleToggleStep(step._id, step.completed)}
                    className="mt-0.5 shrink-0 text-gray-400 hover:text-green-500 transition-colors">
                    {step.completed
                      ? <CheckCircle size={22} className="text-green-500" />
                      : <Circle size={22} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-primary-100 text-primary-700 font-semibold px-2 py-0.5 rounded">
                        Step {step.order}
                      </span>
                      <h3 className={`font-semibold text-gray-900 ${step.completed ? 'line-through text-gray-500' : ''}`}>
                        {step.topic}
                      </h3>
                    </div>
                    <p className="text-sm font-medium text-primary-600 mb-2">{step.objective}</p>
                    <p className="text-sm text-gray-600 mb-3">{step.explanation}</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <p className="text-xs font-semibold text-blue-700 mb-1">📚 Learning Task</p>
                        <p className="text-xs text-gray-700">{step.learningTask}</p>
                      </div>
                      <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                        <p className="text-xs font-semibold text-green-700 mb-1">🧪 Practice Assignment</p>
                        <p className="text-xs text-gray-700">{step.practiceAssignment}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {generating && (
        <div className="card p-8 text-center space-y-3">
          <LoadingSpinner size="lg" className="mx-auto" />
          <p className="font-medium text-gray-700">AI is generating your personalized roadmap...</p>
          <p className="text-sm text-gray-500">This may take 10–15 seconds</p>
        </div>
      )}
    </div>
  );
}
