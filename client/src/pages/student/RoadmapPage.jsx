import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Map, RefreshCw, CheckCircle, Circle, Trash2, Clock,
  ChevronDown, ChevronUp, Target, BookOpen, Code, Copy,
  CheckCheck, Sparkles, Brain, ArrowRight
} from 'lucide-react';
import { roadmapService } from '../../services';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useToast } from '../../components/ui/Toast';
import { copyToClipboard } from '../../utils/helpers';

export default function RoadmapPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [expandedSteps, setExpandedSteps] = useState({});
  const [copiedStep, setCopiedStep] = useState(null);

  const fetchRoadmap = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await roadmapService.get();
      setRoadmap(res.data.data);
      // Auto-expand the first uncompleted step
      if (res.data.data?.steps?.length > 0) {
        const firstUncompleted = res.data.data.steps.find((s) => !s.completed) || res.data.data.steps[0];
        setExpandedSteps({ [firstUncompleted._id || 0]: true });
      }
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
      if (res.data.data?.steps?.length > 0) {
        setExpandedSteps({ [res.data.data.steps[0]._id || 0]: true });
      }
      toast({ type: 'success', message: 'Modern learning roadmap generated!' });
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
      toast({ type: 'success', message: !currentState ? 'Milestone marked complete! 🎉' : 'Milestone marked pending' });
    } catch {
      toast({ type: 'error', message: 'Failed to update step' });
    }
  };

  const toggleExpand = (id) => {
    setExpandedSteps((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyStarter = async (stepId, code) => {
    await copyToClipboard(code);
    setCopiedStep(stepId);
    toast({ type: 'success', message: 'Starter code copied to clipboard!' });
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const getLevelBadge = (level = 'Beginner') => {
    const l = level.toLowerCase();
    if (l === 'advanced') {
      return 'bg-purple-100 text-purple-700 border-purple-200';
    }
    if (l === 'intermediate') {
      return 'bg-blue-100 text-blue-700 border-blue-200';
    }
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  };

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;
  if (error) return <ErrorMessage message={error} onRetry={fetchRoadmap} />;

  const completedCount = roadmap?.steps?.filter((s) => s.completed).length || 0;
  const totalCount = roadmap?.steps?.length || 0;
  const totalHours = roadmap?.steps?.reduce((acc, s) => acc + (s.estimatedHours || 2), 0) || 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
              Interactive Curriculum
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">Modern Learning Roadmap</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Step-by-step master plan with milestones, concept breakdowns, and real-world coding challenges
          </p>
        </div>

        <div className="flex items-center gap-2">
          {roadmap && (
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="btn btn-secondary btn-sm gap-1.5 text-red-600 hover:bg-red-50"
            >
              <Trash2 size={14} /> Reset Roadmap
            </button>
          )}
          <button onClick={handleGenerate} disabled={generating} className="btn btn-primary gap-2">
            {generating ? (
              <><LoadingSpinner size="sm" /> Generating Roadmap...</>
            ) : roadmap ? (
              <><RefreshCw size={16} /> Regenerate Plan</>
            ) : (
              <><Sparkles size={16} /> Generate Roadmap</>
            )}
          </button>
        </div>
      </div>

      {!roadmap ? (
        <EmptyState
          icon={Map}
          title="Ready to build your roadmap?"
          description="Generate a modern, personalized programming curriculum targeting your exact skill level and weak topics."
          actionLabel="Generate Modern Roadmap"
          onAction={handleGenerate}
        />
      ) : (
        <>
          {/* Progress Overview Card */}
          <div className="card p-6 bg-gradient-to-br from-white to-gray-50 border border-gray-200/80 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Mastery Progress</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-gray-900">{roadmap.completionPercentage}%</span>
                  <span className="text-sm text-gray-500 font-medium">
                    ({completedCount} of {totalCount} Milestones Mastered)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-2xs">
                  <span className="text-gray-400 block text-[10px]">TOTAL TIME</span>
                  <span className="font-bold text-gray-800">⏱ ~{totalHours} Hours</span>
                </div>
                <div className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-2xs">
                  <span className="text-gray-400 block text-[10px]">REMAINING</span>
                  <span className="font-bold text-primary-600">{totalCount - completedCount} Steps</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 h-3 bg-gray-100 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-primary-600 to-indigo-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${roadmap.completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Timeline Milestones */}
          <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-primary-500 before:via-indigo-300 before:to-gray-200">
            {roadmap.steps.map((step, idx) => {
              const stepId = step._id || idx;
              const isExpanded = expandedSteps[stepId];
              const isCurrent = !step.completed && (idx === 0 || roadmap.steps[idx - 1]?.completed);

              return (
                <div key={stepId} className="relative">
                  {/* Timeline Node Icon */}
                  <button
                    onClick={() => handleToggleStep(step._id, step.completed)}
                    title={step.completed ? 'Mark incomplete' : 'Mark complete'}
                    className={`absolute -left-6 sm:-left-8 top-5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm z-10 ${
                      step.completed
                        ? 'bg-emerald-500 text-white ring-4 ring-emerald-100 hover:bg-emerald-600'
                        : isCurrent
                        ? 'bg-primary-600 text-white ring-4 ring-primary-100 animate-pulse'
                        : 'bg-white text-gray-400 border-2 border-gray-300 hover:border-primary-400'
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle size={18} className="stroke-[2.5]" />
                    ) : (
                      <span className="text-xs font-bold font-mono">{idx + 1}</span>
                    )}
                  </button>

                  {/* Milestone Card */}
                  <div
                    className={`card overflow-hidden transition-all duration-300 border ${
                      step.completed
                        ? 'border-emerald-200 bg-emerald-50/15'
                        : isCurrent
                        ? 'border-primary-300 shadow-md ring-1 ring-primary-100 bg-white'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    {/* Top Milestone Banner */}
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-gray-400">
                            STEP 0{idx + 1}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {step.topic}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getLevelBadge(step.level)}`}>
                            {step.level || 'Intermediate'}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500 font-mono">
                            <Clock size={12} /> {step.estimatedHours || 2}h
                          </span>
                        </div>

                        {step.completed && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <CheckCircle size={13} /> Completed
                          </span>
                        )}
                      </div>

                      {/* Milestone Title */}
                      <h3 className="text-lg font-bold text-gray-900 leading-snug">
                        {step.title || `Mastering ${step.topic}`}
                      </h3>

                      {/* Objective */}
                      <div className="mt-2.5 flex items-start gap-2 p-2.5 bg-blue-50/60 border border-blue-100/80 rounded-lg text-sm text-blue-900">
                        <Target size={16} className="text-blue-600 shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm font-medium">{step.objective}</span>
                      </div>

                      {/* Key Concepts Tags */}
                      {step.keyConcepts && step.keyConcepts.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {step.keyConcepts.map((k, i) => (
                            <span key={i} className="px-2 py-0.5 rounded text-[11px] font-mono bg-gray-100 text-gray-600">
                              #{k}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Expand / Details Toggle Button */}
                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                        <button
                          onClick={() => toggleExpand(stepId)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                        >
                          {isExpanded ? (
                            <><ChevronUp size={15} /> Hide Lesson Guide & Code Challenge</>
                          ) : (
                            <><ChevronDown size={15} /> View Lesson Guide & Practice Challenge</>
                          )}
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate('/dashboard/quiz')}
                            className="btn btn-ghost btn-sm text-xs text-gray-500 hover:text-primary-600 gap-1"
                            title="Test this topic with an AI Quiz"
                          >
                            <Brain size={13} /> Quiz
                          </button>
                          <button
                            onClick={() => handleToggleStep(step._id, step.completed)}
                            className={`btn btn-sm ${
                              step.completed
                                ? 'btn-secondary text-gray-600 text-xs'
                                : 'btn-primary text-xs'
                            }`}
                          >
                            {step.completed ? 'Mark Incomplete' : 'Mark Completed ✓'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Deep Dive Body */}
                    {isExpanded && (
                      <div className="px-5 pb-6 sm:px-6 pt-2 bg-gray-50/70 border-t border-gray-200/80 space-y-4">
                        {/* 1. In-depth Concept Explanation */}
                        {step.explanation && (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
                              <BookOpen size={14} className="text-primary-600" />
                              <span>Conceptual Breakdown</span>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed bg-white p-3.5 rounded-lg border border-gray-200">
                              {step.explanation}
                            </p>
                          </div>
                        )}

                        {/* 2. Step-by-Step Learning Checklist */}
                        {step.learningTask && (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
                              <CheckCircle size={14} className="text-indigo-600" />
                              <span>Learning Action Checklist</span>
                            </div>
                            <div className="text-sm text-gray-700 bg-white p-3.5 rounded-lg border border-gray-200">
                              {step.learningTask}
                            </div>
                          </div>
                        )}

                        {/* 3. Hands-On Practice Challenge */}
                        {step.practiceAssignment && (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
                              <Code size={14} className="text-emerald-600" />
                              <span>Hands-On Coding Challenge</span>
                            </div>
                            <div className="bg-white p-3.5 rounded-lg border border-gray-200 text-sm text-gray-800 font-medium">
                              {step.practiceAssignment}
                            </div>
                          </div>
                        )}

                        {/* 4. Starter Boilerplate Snippet */}
                        {step.starterCode && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono text-gray-400">Starter Code Template</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleCopyStarter(stepId, step.starterCode)}
                                  className="btn btn-ghost btn-sm text-xs gap-1 text-gray-500 hover:text-gray-900 py-0.5 h-7"
                                >
                                  {copiedStep === stepId ? (
                                    <><CheckCheck size={12} className="text-green-500" /> Copied</>
                                  ) : (
                                    <><Copy size={12} /> Copy Code</>
                                  )}
                                </button>
                                <button
                                  onClick={() =>
                                    navigate('/dashboard/code-review', {
                                      state: { starterCode: step.starterCode, language: 'javascript' },
                                    })
                                  }
                                  className="btn btn-secondary btn-sm text-xs gap-1 text-primary-600 py-0.5 h-7"
                                >
                                  <span>Open in Code Review</span>
                                  <ArrowRight size={12} />
                                </button>
                              </div>
                            </div>
                            <div className="bg-gray-900 rounded-lg p-3 text-xs font-mono text-gray-200 overflow-x-auto whitespace-pre">
                              {step.starterCode}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Confirm Reset Roadmap Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        danger
        title="Reset Learning Roadmap?"
        message="Are you sure you want to clear your current roadmap? You can generate a fresh modern one anytime based on your latest review progress."
        confirmLabel={resetting ? 'Resetting...' : 'Yes, Reset Roadmap'}
        onConfirm={handleReset}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
