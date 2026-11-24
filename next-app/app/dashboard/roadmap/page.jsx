'use client';

import { useEffect, useState, useCallback } from 'react';
import { Map, RefreshCw, CheckCircle, Circle } from 'lucide-react';
import { roadmapService } from '@/lib/clientApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

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
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || 'Failed to load roadmap');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoadmap();
  }, [fetchRoadmap]);

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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Learning Roadmap</h2>
          <p className="text-sm text-gray-500 mt-0.5">Your personalized AI-generated learning plan</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn btn-primary gap-2"
        >
          {generating ? (
            <><LoadingSpinner size="sm" /> Generating...</>
          ) : roadmap ? (
            <><RefreshCw size={16} /> Regenerate</>
          ) : (
            <><Map size={16} /> Generate Roadmap</>
          )}
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

          <div className="space-y-3">
            {roadmap.steps.map((step, idx) => (
              <div
                key={step._id || idx}
                className={`card p-5 transition-all ${
                  step.completed ? 'bg-gray-50 border-gray-200 opacity-80' : 'bg-white'
                }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => handleToggleStep(step._id, step.completed)}
                    className="mt-1 text-primary-600 hover:scale-110 transition-transform"
                  >
                    {step.completed ? (
                      <CheckCircle size={22} className="text-green-500 fill-green-50" />
                    ) : (
                      <Circle size={22} className="text-gray-300 hover:text-primary-500" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-primary-600 uppercase tracking-wide">
                        Step {step.order}
                      </span>
                      <span className="badge badge-gray text-xs">{step.topic}</span>
                    </div>
                    <h3 className={`text-base font-semibold mt-1 ${step.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {step.objective}
                    </h3>
                    {step.explanation && (
                      <p className="text-sm text-gray-600 mt-1">{step.explanation}</p>
                    )}
                    {step.learningTask && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-900">
                        <span className="font-semibold block mb-0.5">📚 Learning Task:</span>
                        {step.learningTask}
                      </div>
                    )}
                    {step.practiceAssignment && (
                      <div className="mt-2 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-900">
                        <span className="font-semibold block mb-0.5">💻 Practice Assignment:</span>
                        {step.practiceAssignment}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
