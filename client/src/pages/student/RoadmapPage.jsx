import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Map, RefreshCw, CheckCircle2, Trash2, Clock, ChevronDown, ChevronUp,
  BookOpen, Code, Copy, CheckCheck, Sparkles, Brain, ArrowRight, Plus, X,
  RotateCcw, Layers, CheckSquare, Square, Target, Compass,
} from 'lucide-react';
import { roadmapService } from '../../services';
import { QUERY_KEYS } from '../../lib/queryClient';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { RouteContentSkeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { copyToClipboard, getLanguageLabel, ALL_LANGUAGES } from '../../utils/helpers';

const QUICK_SKILLS = [
  'Python Mastery',
  'Data Structures & Algorithms',
  'JavaScript & React',
  'Backend (Node.js & APIs)',
  'SQL & Databases',
  'Java & OOP',
  'C++ Problem Solving',
  'TypeScript',
];

const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const SUPPORTED_LANG_SET = new Set(ALL_LANGUAGES.map((l) => l.id));

const unescapeStarterCode = (code = '') => {
  const raw = String(code || '');
  if (!raw) return '';
  if (!raw.includes('\n') && (raw.includes('\\n') || raw.includes('\\t'))) {
    return raw.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').replace(/\\t/g, '\t');
  }
  return raw;
};

const resolveStepLanguage = (stepLang, roadmapLang, skillName = '') => {
  const candidates = [stepLang, roadmapLang]
    .map((l) => String(l || '').trim().toLowerCase())
    .filter(Boolean);
  for (const c of candidates) {
    if (SUPPORTED_LANG_SET.has(c)) return c;
  }
  const s = skillName.toLowerCase();
  if (s.includes('python')) return 'python';
  if (s.includes('typescript')) return 'typescript';
  if (s.includes('sql')) return 'sql';
  if (s.includes('c++') || s.includes('cpp')) return 'cpp';
  if (/\bjava\b/.test(s)) return 'java';
  if (s.includes('rust')) return 'rust';
  if (/\bgo\b|golang/.test(s)) return 'go';
  return 'javascript';
};

const getLevelBadgeClass = (level = 'Beginner') => {
  const l = String(level).toLowerCase();
  if (l === 'advanced') {
    return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800';
  }
  if (l === 'intermediate') {
    return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800';
  }
  return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800';
};

function RoadmapGeneratingSkeleton({ skillName, level }) {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="card p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary-700 dark:text-primary-300">
          <Sparkles size={16} className="animate-spin" />
          <span>
            Designing your tailored {level} roadmap for “{skillName || 'Selected Skill'}” with Gemini AI...
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-slate-800" />
      </div>
      {[0, 1, 2, 3].map((idx) => (
        <div
          key={idx}
          className="card p-5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-slate-800" />
            <div className="h-5 w-24 rounded-full bg-gray-200 dark:bg-slate-800" />
          </div>
          <div className="h-5 w-2/3 rounded bg-gray-200 dark:bg-slate-800" />
          <div className="h-4 w-5/6 rounded bg-gray-100 dark:bg-slate-800/70" />
        </div>
      ))}
    </div>
  );
}

export default function RoadmapPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [selectedRoadmapId, setSelectedRoadmapId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [showBuilderOverride, setShowBuilderOverride] = useState(null);

  const [selectedSkill, setSelectedSkill] = useState('Python Mastery');
  const [selectedLevel, setSelectedLevel] = useState('Beginner');
  const [expandedByRoadmap, setExpandedByRoadmap] = useState({});
  const [copiedStep, setCopiedStep] = useState(null);

  const { data: roadmapPayload, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.roadmap,
    queryFn: async () => {
      try {
        const res = await roadmapService.get();
        const active = res.data?.data || null;
        const list = res.data?.roadmaps || (active ? [active] : []);
        return { active, roadmaps: list };
      } catch (err) {
        if (err.response?.status === 404) {
          return { active: null, roadmaps: [] };
        }
        throw err;
      }
    },
  });

  const roadmaps = useMemo(() => roadmapPayload?.roadmaps || [], [roadmapPayload]);
  const roadmap = useMemo(() => {
    if (selectedRoadmapId) {
      const matched = roadmaps.find((r) => r._id === selectedRoadmapId);
      if (matched) return matched;
    }
    return roadmapPayload?.active || roadmaps[0] || null;
  }, [roadmaps, roadmapPayload, selectedRoadmapId]);

  const showSkillBuilder = showBuilderOverride ?? !roadmap;
  const setShowSkillBuilder = (next) => {
    setShowBuilderOverride((prev) => {
      const current = prev ?? !roadmap;
      return typeof next === 'function' ? next(current) : next;
    });
  };

  const firstPendingIndex = useMemo(
    () => (roadmap?.steps?.length ? roadmap.steps.findIndex((s) => !s.completed) : -1),
    [roadmap]
  );

  const defaultExpandedStepId = useMemo(() => {
    if (!roadmap?.steps?.length) return null;
    const idx = firstPendingIndex >= 0 ? firstPendingIndex : 0;
    return roadmap.steps[idx]._id || idx;
  }, [roadmap, firstPendingIndex]);

  const handleGenerateSkillRoadmap = async ({
    skillName = selectedSkill,
    level = selectedLevel,
    roadmapId = undefined,
    regenerate = false,
  } = {}) => {
    const cleanSkill = String(skillName || '').trim();
    if (!cleanSkill) {
      toast({ type: 'error', message: 'Please choose a skill chip or enter a custom skill.' });
      return;
    }

    setGenerating(true);
    try {
      const res = await roadmapService.generate({
        skillName: cleanSkill,
        level,
        ...(roadmapId ? { roadmapId } : {}),
        ...(regenerate ? { regenerate: true } : {}),
      });
      const created = res.data?.data || null;
      const list = res.data?.roadmaps || (created ? [created] : []);
      queryClient.setQueryData(QUERY_KEYS.roadmap, { active: created, roadmaps: list });
      setSelectedRoadmapId(created?._id || null);
      setShowBuilderOverride(false);
      if (created?._id) {
        setExpandedByRoadmap((prev) => {
          const next = { ...prev };
          delete next[created._id];
          return next;
        });
      }
      toast({
        type: 'success',
        message: `${created?.skillName || cleanSkill} (${created?.level || level}) roadmap ready!`,
      });
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Failed to generate roadmap' });
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectSavedRoadmap = (item) => {
    if (!item || item._id === roadmap?._id) return;
    setSelectedRoadmapId(item._id);
    setShowBuilderOverride(false);
  };

  const handleResetProgress = async () => {
    if (!roadmap?._id) return;
    setResetting(true);
    try {
      const res = await roadmapService.resetProgress(roadmap._id);
      const updated = res.data?.data;
      if (updated) {
        queryClient.setQueryData(QUERY_KEYS.roadmap, (old) => ({
          active: updated,
          roadmaps: (old?.roadmaps || []).map((r) => (r._id === updated._id ? updated : r)),
        }));
        setExpandedByRoadmap((prev) => {
          const next = { ...prev };
          delete next[updated._id];
          return next;
        });
      }
      setResetModalOpen(false);
      toast({ type: 'success', message: 'Milestone progress reset to 0%' });
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Failed to reset progress' });
    } finally {
      setResetting(false);
    }
  };

  const handleDeleteRoadmap = async (idToDelete, e) => {
    if (e) e.stopPropagation();
    if (!idToDelete) return;
    setDeletingId(idToDelete);
    try {
      const res = await roadmapService.delete(idToDelete);
      const nextActive = res.data?.data || null;
      const list = res.data?.roadmaps || [];
      queryClient.setQueryData(QUERY_KEYS.roadmap, { active: nextActive, roadmaps: list });
      if (roadmap?._id === idToDelete) {
        setSelectedRoadmapId(nextActive?._id || null);
        if (!nextActive) setShowBuilderOverride(true);
      }
      toast({ type: 'success', message: 'Saved roadmap removed' });
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Failed to delete roadmap' });
    } finally {
      setDeletingId(null);
    }
  };

  const applyStepUpdateResponse = (updatedRoadmap) => {
    if (!updatedRoadmap) return;
    queryClient.setQueryData(QUERY_KEYS.roadmap, (old) => ({
      active: updatedRoadmap,
      roadmaps: (old?.roadmaps || []).map((r) => (r._id === updatedRoadmap._id ? updatedRoadmap : r)),
    }));
  };

  const handleToggleStep = async (stepId, currentState) => {
    try {
      const res = await roadmapService.updateStep(stepId, {
        roadmapId: roadmap?._id,
        completed: !currentState,
      });
      if (res.data?.data?.roadmap) {
        applyStepUpdateResponse(res.data.data.roadmap);
      }
      toast({
        type: 'success',
        message: !currentState ? 'Milestone completed!' : 'Milestone marked in progress',
      });
    } catch {
      toast({ type: 'error', message: 'Failed to update milestone' });
    }
  };

  const handleToggleSubTask = async (stepId, subTaskId, currentCompleted) => {
    try {
      const res = await roadmapService.updateStep(stepId, {
        roadmapId: roadmap?._id,
        subTaskId,
        subTaskCompleted: !currentCompleted,
      });
      if (res.data?.data?.roadmap) {
        applyStepUpdateResponse(res.data.data.roadmap);
      }
    } catch {
      toast({ type: 'error', message: 'Failed to update sub-task' });
    }
  };

  const toggleExpand = (stepId) => {
    if (!roadmap?._id) return;
    setExpandedByRoadmap((prev) => {
      const currentMap =
        prev[roadmap._id] ||
        (defaultExpandedStepId !== null ? { [defaultExpandedStepId]: true } : {});
      return {
        ...prev,
        [roadmap._id]: {
          ...currentMap,
          [stepId]: !currentMap[stepId],
        },
      };
    });
  };

  const handleCopyStarter = async (stepId, code) => {
    try {
      await copyToClipboard(code);
      setCopiedStep(stepId);
      toast({ type: 'success', message: 'Starter code copied to clipboard!' });
      setTimeout(() => setCopiedStep(null), 2000);
    } catch {
      toast({ type: 'error', message: 'Failed to copy starter code' });
    }
  };

  if (isLoading && !roadmapPayload) {
    return (
      <div className="w-full max-w-[1440px] mx-auto">
        <RouteContentSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message={error.response?.data?.message || 'Failed to load roadmap'}
        onRetry={() => refetch()}
      />
    );
  }

  const completedCount = roadmap?.steps?.filter((s) => s.completed).length || 0;
  const totalCount = roadmap?.steps?.length || 0;
  const totalHours =
    roadmap?.totalHours || roadmap?.steps?.reduce((acc, s) => acc + (s.estimatedHours || 2), 0) || 0;

  return (
    <div className="space-y-5 w-full max-w-[1440px] mx-auto overflow-x-hidden">
      {/* Top Page Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
            <Compass size={12} /> Personalized Learning Paths
          </span>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mt-1">Learning Roadmap</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            Choose any skill and experience level to generate an interactive, milestone-based study path
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowSkillBuilder((p) => !p)}
          className="btn btn-primary btn-sm sm:btn gap-1.5 shrink-0"
        >
          {showSkillBuilder && roadmap ? <X size={16} /> : <Plus size={16} />}
          <span>{showSkillBuilder && roadmap ? 'Close Skill Selector' : 'New Skill Roadmap'}</span>
        </button>
      </div>

      {/* Saved Skill Roadmaps Switcher */}
      {roadmaps.length > 0 && (
        <div className="card p-3.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
            <Layers size={13} className="text-primary-600 dark:text-primary-400" />
            <span>Your Saved Skill Roadmaps ({roadmaps.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {roadmaps.map((item) => {
              const isActive = item._id === roadmap?._id;
              return (
                <div
                  key={item._id}
                  onClick={() => handleSelectSavedRoadmap(item)}
                  className={`group inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 border-cyan-400 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-200 dark:border-cyan-400/50 shadow-2xs'
                      : 'bg-white/75 border-slate-200/80 text-slate-700 hover:border-cyan-400/50 dark:bg-white/[0.06] dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/[0.12]'
                  }`}
                >
                  <span className="font-semibold truncate max-w-[180px]">{item.skillName || 'Skill Path'}</span>
                  <span className="text-[11px] opacity-75">· {item.level || 'Beginner'}</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/85 dark:bg-[#0B1120]/80 text-slate-800 dark:text-cyan-100 font-mono text-[11px] tabular-nums">
                    {item.completionPercentage || 0}%
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteRoadmap(item._id, e)}
                    disabled={deletingId === item._id}
                    title="Delete this roadmap"
                    className="p-0.5 rounded text-gray-400 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Skill & Level Selector Card ("Choose a Skill to Master") */}
      {(showSkillBuilder || !roadmap) && (
        <div className="card p-5 sm:p-6 bg-white dark:bg-slate-900 border border-primary-200/80 dark:border-slate-700 space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles size={18} className="text-primary-600 dark:text-primary-400" />
                <span>Choose a Skill to Master</span>
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                Pick a popular track below or type any custom topic, then pick your current experience level
              </p>
            </div>
          </div>

          {/* Quick Skill Chips */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Quick Skill Chips
            </p>
            <div className="flex overflow-x-auto flex-nowrap sm:flex-wrap gap-2 pb-1 sm:pb-0 no-scrollbar">
              {QUICK_SKILLS.map((skill) => {
                const active = selectedSkill.trim().toLowerCase() === skill.toLowerCase();
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => setSelectedSkill(skill)}
                    className={`px-3 py-1.5 min-h-[36px] shrink-0 rounded-full text-xs font-medium border transition-colors ${
                      active
                        ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 border-cyan-400/50 text-white shadow-2xs'
                        : 'bg-white/70 border-white/80 text-slate-700 hover:border-cyan-400/60 dark:bg-white/[0.06] dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/[0.12]'
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Skill Input + Experience Level Toggle */}
          <div className="grid md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 block">
                Skill or Custom Topic
              </label>
              <input
                type="text"
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                placeholder='e.g. "System Design", "Rust", "Dynamic Programming"'
                maxLength={100}
                className="input bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-100"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 block">
                Experience Level
              </label>
              <div className="grid grid-cols-3 rounded-lg bg-gray-100 dark:bg-slate-800 p-1 border border-gray-200 dark:border-slate-700">
                {EXPERIENCE_LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSelectedLevel(lvl)}
                    className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-all ${
                      selectedLevel === lvl
                        ? 'bg-white dark:bg-slate-700 text-primary-700 dark:text-white shadow-2xs'
                        : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Powered by Google Gemini AI (<code className="px-1.5 py-0.5 rounded bg-white/70 dark:bg-white/10 font-mono text-[11px] text-slate-800 dark:text-cyan-200">gemini-3.8-flash</code>) with tailored challenges &amp; checkpoints
            </span>
            <button
              type="button"
              onClick={() =>
                handleGenerateSkillRoadmap({
                  skillName: selectedSkill,
                  level: selectedLevel,
                })
              }
              disabled={generating || !selectedSkill.trim()}
              className="btn btn-primary gap-2"
            >
              {generating ? (
                <><LoadingSpinner size="sm" /> Generating Skill Roadmap...</>
              ) : (
                <><Sparkles size={16} /> Generate Skill Roadmap</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton while Gemini Generates */}
      {generating ? (
        <RoadmapGeneratingSkeleton skillName={selectedSkill} level={selectedLevel} />
      ) : roadmap ? (
        <>
          {/* Hero Mastery Header Card */}
          <div className="card p-6 bg-gradient-to-br from-white via-gray-50/70 to-indigo-50/40 dark:from-slate-800/95 dark:via-slate-900 dark:to-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 shadow-sm space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getLevelBadgeClass(roadmap.level)}`}>
                    {roadmap.level || 'Beginner'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-200 border border-gray-200 dark:border-slate-700">
                    {getLanguageLabel(roadmap.language || 'javascript')}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-slate-400 font-mono">
                    ~{totalHours} Hours Total
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-slate-100">
                  {roadmap.skillName || 'Learning Roadmap'}
                </h3>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  Mastery Progress
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleGenerateSkillRoadmap({
                      skillName: roadmap.skillName || selectedSkill,
                      level: roadmap.level || selectedLevel,
                      roadmapId: roadmap._id,
                      regenerate: true,
                    })
                  }
                  disabled={generating}
                  className="btn btn-secondary btn-sm gap-1.5"
                >
                  <RefreshCw size={14} /> Regenerate Plan
                </button>
                <button
                  type="button"
                  onClick={() => setResetModalOpen(true)}
                  className="btn btn-secondary btn-sm gap-1.5 text-amber-700 dark:text-amber-300"
                >
                  <RotateCcw size={14} /> Reset Progress
                </button>
              </div>
            </div>

            {/* Numeric Mastery Summary + Gradient Progress Bar */}
            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <div className="flex items-baseline gap-2.5 tabular-nums">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-slate-100">
                    {roadmap.completionPercentage ?? 0}%
                  </span>
                  <span className="text-sm font-medium text-gray-600 dark:text-slate-300">
                    {completedCount} / {totalCount} Milestones Completed
                  </span>
                </div>
                <span className="text-xs font-mono text-primary-700 dark:text-primary-300 tabular-nums">
                  {Math.max(0, totalCount - completedCount)} Remaining
                </span>
              </div>

              <div className="h-3 bg-gray-200/80 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-primary-600 via-indigo-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${roadmap.completionPercentage ?? 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Visual Connected Milestone Timeline */}
          <div className="relative pl-7 sm:pl-9 space-y-6 before:content-[''] before:absolute before:left-3.5 sm:before:left-4 before:top-5 before:bottom-5 before:w-0.5 before:bg-gradient-to-b before:from-emerald-400 before:via-primary-500 before:to-gray-200 dark:before:to-slate-700">
            {roadmap.steps.map((step, idx) => {
              const stepId = step._id || idx;
              const roadmapExpanded = expandedByRoadmap[roadmap._id];
              const isExpanded = roadmapExpanded
                ? Boolean(roadmapExpanded[stepId])
                : stepId === defaultExpandedStepId;
              const isCurrent = !step.completed && idx === firstPendingIndex;
              const paddedNum = String(idx + 1).padStart(2, '0');
              const stepLang = resolveStepLanguage(step.language, roadmap.language, roadmap.skillName);
              const subTasks = Array.isArray(step.subTasks) ? step.subTasks : [];
              const doneSubCount = subTasks.filter((t) => t.completed).length;

              return (
                <div key={stepId} className="relative">
                  {/* Status Node on Stepper */}
                  <button
                    type="button"
                    onClick={() => handleToggleStep(step._id, step.completed)}
                    title={step.completed ? 'Mark milestone incomplete' : 'Mark milestone complete'}
                    className={`absolute -left-7 sm:-left-9 top-5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm z-10 font-mono text-xs font-bold ${
                      step.completed
                        ? 'bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-900/50 hover:bg-emerald-600'
                        : isCurrent
                        ? 'bg-primary-600 text-white ring-4 ring-primary-200 dark:ring-primary-900/70 shadow-primary-500/40 shadow-md'
                        : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-300 border-2 border-gray-300 dark:border-slate-600 hover:border-primary-400'
                    }`}
                  >
                    {step.completed ? <CheckCircle2 size={17} /> : paddedNum}
                  </button>

                  {/* Milestone Card */}
                  <div
                    className={`card overflow-hidden transition-all duration-200 border ${
                      step.completed
                        ? 'border-emerald-200 bg-emerald-50/25 dark:border-emerald-800/60 dark:bg-emerald-950/20'
                        : isCurrent
                        ? 'border-primary-400 ring-1 ring-primary-200 bg-white dark:border-primary-500/70 dark:ring-primary-900/50 dark:bg-slate-900 shadow-md'
                        : 'border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <div className="p-5 sm:p-6 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-gray-400 dark:text-slate-400">
                            MILESTONE {paddedNum}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-200">
                              Up Next
                            </span>
                          )}
                          {step.completed && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                              <CheckCircle2 size={12} /> Completed
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getLevelBadgeClass(step.level || roadmap.level)}`}>
                            {step.level || roadmap.level || 'Beginner'}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-mono text-gray-500 dark:text-slate-400">
                            <Clock size={12} /> ~{step.estimatedHours || 2}h
                          </span>
                        </div>

                        {subTasks.length > 0 && (
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300 tabular-nums">
                            {doneSubCount}/{subTasks.length} tasks
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                          {step.title || `Mastering ${step.topic}`}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-slate-300 mt-1 leading-relaxed flex items-start gap-2">
                          <Target size={15} className="text-primary-500 shrink-0 mt-0.5" />
                          <span>{step.objective}</span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => toggleExpand(stepId)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                        >
                          {isExpanded ? (
                            <><ChevronUp size={15} /> Hide Lesson &amp; Tasks</>
                          ) : (
                            <><ChevronDown size={15} /> View Lesson &amp; Tasks</>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStep(step._id, step.completed)}
                          className={`btn btn-sm text-xs gap-1.5 ${
                            step.completed
                              ? 'btn-secondary text-emerald-700 dark:text-emerald-300'
                              : 'btn-primary'
                          }`}
                        >
                          <CheckCircle2 size={14} />
                          <span>{step.completed ? 'Completed' : 'Mark Milestone Complete'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Rich Expandable Milestone Drawer */}
                    {isExpanded && (
                      <div className="px-5 pb-6 sm:px-6 pt-4 bg-gray-50/80 dark:bg-slate-800/90 border-t border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 space-y-5">
                        {/* What You'll Learn (3-4 crisp plain-English concept bullets) */}
                        <div className="space-y-2">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                            <BookOpen size={14} className="text-primary-600 dark:text-primary-400" />
                            <span>What You&apos;ll Learn</span>
                          </h5>
                          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 space-y-2.5">
                            {step.explanation && (
                              <p className="text-sm text-gray-700 dark:text-slate-200 leading-relaxed">
                                {step.explanation}
                              </p>
                            )}
                            {step.keyConcepts?.length > 0 && (
                              <ul className="space-y-1.5 pt-1">
                                {step.keyConcepts.map((bullet, i) => (
                                  <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-gray-700 dark:text-slate-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                                    <span>{bullet}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>

                        {/* Interactive Sub-Task Checklist */}
                        {subTasks.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                              <CheckSquare size={14} className="text-indigo-600 dark:text-indigo-400" />
                              <span>Interactive Sub-Task Checklist</span>
                            </h5>
                            <div className="space-y-2">
                              {subTasks.map((st, sIdx) => (
                                <label
                                  key={st._id || sIdx}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleToggleSubTask(step._id, st._id, st.completed);
                                  }}
                                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                    st.completed
                                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-200'
                                      : 'bg-white border-gray-200 text-gray-800 hover:border-primary-300 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:hover:border-primary-600'
                                  }`}
                                >
                                  {st.completed ? (
                                    <CheckSquare size={17} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  ) : (
                                    <Square size={17} className="text-gray-400 dark:text-slate-400 shrink-0" />
                                  )}
                                  <span className={`text-sm ${st.completed ? 'line-through opacity-80' : 'font-medium'}`}>
                                    {st.title}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Hands-On Practice Challenge & Starter Code */}
                        {(step.practiceAssignment || step.starterCode) && (() => {
                          const cleanStarterCode = unescapeStarterCode(step.starterCode);
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                                  <Code size={14} className="text-emerald-600 dark:text-emerald-400" />
                                  <span>Hands-On Practice Challenge</span>
                                </h5>
                                {cleanStarterCode && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopyStarter(stepId, cleanStarterCode)}
                                    className="btn btn-ghost btn-sm py-0.5 h-7 text-xs gap-1 text-gray-600 dark:text-slate-300"
                                  >
                                    {copiedStep === stepId ? (
                                      <><CheckCheck size={12} className="text-emerald-500" /> Copied</>
                                    ) : (
                                      <><Copy size={12} /> Copy Starter</>
                                    )}
                                  </button>
                                )}
                              </div>
                              {step.practiceAssignment && (
                                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-sm text-gray-800 dark:text-slate-100 font-medium">
                                  {step.practiceAssignment}
                                </div>
                              )}
                              {cleanStarterCode && (
                                <pre className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                                  <code>{cleanStarterCode}</code>
                                </pre>
                              )}
                            </div>
                          );
                        })()}

                        {/* Hands-On Practice Action Buttons */}
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              navigate('/dashboard/code-review', {
                                state: {
                                  starterCode: unescapeStarterCode(step.starterCode) || `# ${step.title}\n`,
                                  language: stepLang,
                                  assignmentTitle: step.title,
                                  challengePrompt: step.practiceAssignment || step.objective,
                                },
                              })
                            }
                            className="btn btn-primary btn-sm gap-1.5"
                          >
                            <span>Solve Coding Challenge</span>
                            <ArrowRight size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/dashboard/quiz?topic=${encodeURIComponent(step.title || step.topic)}`)
                            }
                            className="btn btn-secondary btn-sm gap-1.5"
                          >
                            <Brain size={14} />
                            <span>Practice Quiz</span>
                            <ArrowRight size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStep(step._id, step.completed)}
                            className="btn btn-secondary btn-sm gap-1.5 ml-auto"
                          >
                            <CheckCircle2 size={14} className={step.completed ? 'text-emerald-500' : ''} />
                            <span>{step.completed ? 'Mark Incomplete' : 'Mark Milestone Complete'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="card p-8 text-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
          <Map size={32} className="mx-auto text-primary-600 dark:text-primary-400 mb-2" />
          <p className="text-sm font-medium text-gray-700 dark:text-slate-200">
            Select a skill above and click <strong>Generate Skill Roadmap</strong> to begin!
          </p>
        </div>
      )}

      {/* Confirm Reset Progress Modal */}
      <ConfirmModal
        isOpen={resetModalOpen}
        danger
        title="Reset Roadmap Progress?"
        message="This will mark all milestones and sub-tasks in this roadmap back to 0% without deleting the saved skill plan."
        confirmLabel={resetting ? 'Resetting...' : 'Yes, Reset Progress'}
        onConfirm={handleResetProgress}
        onCancel={() => setResetModalOpen(false)}
      />
    </div>
  );
}
