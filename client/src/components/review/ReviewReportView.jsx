import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor, { DiffEditor } from '@monaco-editor/react';
import {
  Bug, Shield, BookOpen, Copy, CheckCheck, AlertTriangle, Edit2, Check, X, Code2,
  RefreshCw, ArrowRight, GitCompare, MessageSquareCheck, Sparkles, FileDown,
  CheckCircle2, ListOrdered, Clock, Cpu, GitBranch, Boxes, ChevronDown, ChevronRight,
} from 'lucide-react';
import ScoreBadge from '../ui/ScoreBadge';
import LoadingSpinner from '../ui/LoadingSpinner';
import {
  formatDate, getLanguageLabel, getLanguageBadgeClass,
  getConceptLevelClass, getSeverityClass, copyToClipboard,
  getMonacoLanguage,
} from '../../utils/helpers';
import { downloadStudyNotesPdf, normalizeReviewSections } from '../../utils/studyNotesPdf';
import { useToast } from '../ui/Toast';
import { useTheme } from '../../context/ThemeContext';

const ErrorStudyCard = ({ err, index }) => {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const isWarning = err.severity === 'WARNING';

  const handleCopyFix = async () => {
    try {
      await copyToClipboard(err.fix);
      setCopied(true);
      toast({ type: 'success', message: 'Suggested fix copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ type: 'error', message: 'Failed to copy fix' });
    }
  };

  return (
    <div
      className={`border rounded-xl overflow-hidden bg-white dark:bg-slate-900 ${
        isWarning
          ? 'border-amber-200 dark:border-amber-800/70'
          : 'border-red-200 dark:border-red-800/70'
      }`}
    >
      <div
        className={`flex items-start gap-3 p-4 border-b ${
          isWarning
            ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50'
            : 'bg-red-50/90 dark:bg-red-950/40 border-red-100 dark:border-red-900/50'
        }`}
      >
        <div
          className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
            isWarning ? 'bg-amber-100 dark:bg-amber-900/60' : 'bg-red-100 dark:bg-red-900/60'
          }`}
        >
          <Bug
            size={15}
            className={isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                isWarning
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200'
              }`}
            >
              {err.severity}
            </span>
            {err.line > 0 && (
              <span className="bg-slate-800 dark:bg-slate-700 text-slate-100 text-xs px-2 py-0.5 rounded font-mono">
                Line {err.line}
              </span>
            )}
            <h4 className="font-semibold text-gray-900 dark:text-slate-100 text-sm">
              #{index + 1} · {err.title}
            </h4>
          </div>
          <p className="text-sm text-gray-700 dark:text-slate-200 mt-1.5 leading-relaxed">
            {err.explanation}
          </p>
        </div>
      </div>

      {err.fix && (
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Exact Fix
            </span>
            <button
              type="button"
              onClick={handleCopyFix}
              className="btn btn-ghost btn-sm py-1 px-2 text-xs gap-1 text-gray-600 dark:text-slate-300"
            >
              {copied ? <CheckCheck size={13} className="text-emerald-500" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy Fix'}</span>
            </button>
          </div>
          <pre className="p-3 rounded-lg bg-slate-900 text-emerald-300 border border-slate-800 text-xs font-mono overflow-x-auto leading-relaxed">
            <code>{err.fix}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

const FunctionStudyCard = ({ fn, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-gray-50/80 dark:bg-slate-800/70 hover:bg-gray-100/70 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <span className="font-mono text-sm font-bold text-primary-700 dark:text-primary-300">
            {fn.name}({fn.parameters === 'None' ? '' : fn.parameters})
          </span>
          <span className="badge badge-gray text-[11px] font-mono">
            Returns: {fn.returns || 'None'}
          </span>
        </div>
        {open ? (
          <ChevronDown size={16} className="text-gray-400 dark:text-slate-400 shrink-0" />
        ) : (
          <ChevronRight size={16} className="text-gray-400 dark:text-slate-400 shrink-0" />
        )}
      </button>

      {open && (
        <div className="p-4 grid sm:grid-cols-3 gap-3 text-sm border-t border-gray-100 dark:border-slate-800">
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400 mb-1">
              Parameters
            </p>
            <p className="font-mono text-xs text-gray-800 dark:text-slate-200 break-words">
              {fn.parameters || 'None'}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400 mb-1">
              Return Value
            </p>
            <p className="font-mono text-xs text-gray-800 dark:text-slate-200 break-words">
              {fn.returns || 'None / void'}
            </p>
          </div>
          <div className="sm:col-span-1 p-3 rounded-lg bg-blue-50/60 dark:bg-slate-800/90 border border-blue-100 dark:border-slate-700">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300 mb-1">
              What It Does
            </p>
            <p className="text-xs text-gray-700 dark:text-slate-200 leading-relaxed">
              {fn.explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const synthesizeImprovedCode = (review) => {
  if (review?.improvedCode && review.improvedCode.trim()) return review.improvedCode;
  if (!review?.code) return '';
  const lines = review.code.split('\n');
  for (const b of review.bugs || []) {
    const idx = (b.lineNumber || 1) - 1;
    if (
      b.lineNumber > 0 &&
      idx >= 0 &&
      idx < lines.length &&
      b.solution &&
      !b.solution.trim().startsWith('//') &&
      !b.solution.trim().startsWith('#') &&
      !b.solution.includes('\n')
    ) {
      lines[idx] = b.solution;
    }
  }
  return lines.join('\n');
};

const buildCallChainPreview = (callGraph = []) => {
  if (!callGraph.length) return [];
  const first = callGraph[0];
  const chain = [first.caller, first.callee];
  const visited = new Set(chain);
  let tail = first.callee;
  let guard = 0;
  while (guard < 6) {
    guard++;
    const nextEdge = callGraph.find((e) => e.caller === tail && !visited.has(e.callee));
    if (!nextEdge) break;
    chain.push(nextEdge.callee);
    visited.add(nextEdge.callee);
    tail = nextEdge.callee;
  }
  return chain;
};

export default function ReviewReportView({
  review,
  editableTitle = false,
  onSaveTitle,
  savingTitle = false,
  onRetryGemini,
  retryingGemini = false,
  showPracticeActions = false,
}) {
  const navigate = useNavigate();
  const toast = useToast();
  const { isDark } = useTheme();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(review?.title || '');
  const [codeViewMode, setCodeViewMode] = useState('diff');
  const [renderSideBySide, setRenderSideBySide] = useState(true);
  const [copiedImproved, setCopiedImproved] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const studyData = useMemo(() => normalizeReviewSections(review), [review]);
  const { errors, howItWorks, complexity, callGraph, functionBreakdown, isGemini } = studyData;
  const callChain = useMemo(() => buildCallChainPreview(callGraph), [callGraph]);

  const improvedCode = useMemo(() => synthesizeImprovedCode(review), [review]);
  const hasDiffChanges = Boolean(review?.code && improvedCode && improvedCode !== review.code);
  const improvementNotes = useMemo(() => {
    if (review?.improvementNotes?.length > 0) return review.improvementNotes;
    return errors
      .filter((e) => e.line > 0)
      .map((e) => ({ lineNumber: e.line, explanation: `${e.title}: ${e.explanation}` }));
  }, [review?.improvementNotes, errors]);

  const handleSave = async () => {
    if (!onSaveTitle) return;
    const ok = await onSaveTitle(titleValue);
    if (ok) setEditingTitle(false);
  };

  const handleCopyImproved = async () => {
    try {
      await copyToClipboard(improvedCode || review.code);
      setCopiedImproved(true);
      toast({ type: 'success', message: 'Improved code copied to clipboard' });
      setTimeout(() => setCopiedImproved(false), 2000);
    } catch {
      toast({ type: 'error', message: 'Failed to copy code' });
    }
  };

  const handleDownloadPdf = () => {
    setExportingPdf(true);
    try {
      const filename = downloadStudyNotesPdf(review);
      toast({ type: 'success', message: `Study Notes downloaded (${filename})` });
    } catch (err) {
      toast({ type: 'error', message: err?.message || 'Failed to generate Study Notes PDF' });
    } finally {
      setExportingPdf(false);
    }
  };

  const jumpTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const sectionTabs = [
    { id: 'section-errors', label: `1. Errors (${errors.length})` },
    { id: 'section-how-it-works', label: '2. How It Works' },
    { id: 'section-complexity', label: '3. Complexity' },
    { id: 'section-call-flow', label: '4. Call Flow' },
    { id: 'section-functions', label: `5. Functions (${functionBreakdown.length})` },
    { id: 'section-code-diff', label: 'Code & Diff' },
  ];

  return (
    <div className="space-y-6">
      {/* Fallback Banner + Retry with Gemini */}
      {!isGemini && (
        <div className="card p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          <div className="flex items-start gap-2.5 text-sm text-amber-900 dark:text-amber-100">
            <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Analyzed using Static Syntax Analyzer (Fallback)</p>
              <p className="text-xs text-amber-800 dark:text-amber-200 mt-0.5">
                {review.fallbackReason || 'Gemini AI was temporarily unavailable during this review.'}
              </p>
            </div>
          </div>
          {onRetryGemini && (
            <button
              type="button"
              onClick={onRetryGemini}
              disabled={retryingGemini}
              className="btn btn-primary btn-sm shrink-0 gap-1.5"
            >
              {retryingGemini ? (
                <><LoadingSpinner size="sm" /> Retrying Gemini...</>
              ) : (
                <><RefreshCw size={14} /> Retry with Gemini AI</>
              )}
            </button>
          )}
        </div>
      )}

      {/* Teacher Mentor Feedback Card */}
      {review.teacherFeedback?.comment && (
        <div className="card p-5 border-l-4 border-l-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 dark:border-emerald-700 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-semibold text-sm">
              <MessageSquareCheck size={17} />
              <span>Teacher Mentor Feedback — {review.teacherFeedback.teacherName || 'Instructor'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
              {review.teacherFeedback.originalScore != null &&
                review.teacherFeedback.adjustedScore != null &&
                review.teacherFeedback.originalScore !== review.teacherFeedback.adjustedScore && (
                  <span className="badge badge-green">
                    Score Adjusted: {review.teacherFeedback.originalScore} → {review.teacherFeedback.adjustedScore}
                  </span>
                )}
              {review.teacherFeedback.updatedAt && (
                <span>{formatDate(review.teacherFeedback.updatedAt)}</span>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
            {review.teacherFeedback.comment}
          </p>
        </div>
      )}

      {/* Top Summary Bar */}
      <div className="card p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`badge ${getLanguageBadgeClass(review.language)} font-mono text-xs uppercase`}>
                {getLanguageLabel(review.language)}
              </span>
              {isGemini ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800">
                  <Sparkles size={12} /> Powered by Gemini AI
                </span>
              ) : (
                <span className="badge badge-yellow text-xs">Static Syntax Analyzer</span>
              )}
              <span className="text-xs text-gray-400 dark:text-slate-400">{formatDate(review.createdAt)}</span>
            </div>

            {editableTitle && editingTitle ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  className="input input-sm font-bold text-gray-900 dark:text-slate-100"
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  placeholder="Name these study notes"
                />
                <button onClick={handleSave} disabled={savingTitle} className="btn btn-primary btn-sm">
                  <Check size={14} />
                </button>
                <button
                  onClick={() => {
                    setEditingTitle(false);
                    setTitleValue(review.title || '');
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                  {review.title || `${getLanguageLabel(review.language)} Code Study Report`}
                </h2>
                {editableTitle && (
                  <button
                    onClick={() => {
                      setTitleValue(review.title || '');
                      setEditingTitle(true);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 no-print"
                    title="Edit report title"
                  >
                    <Edit2 size={14} />
                  </button>
                )}
              </div>
            )}

            <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{review.summary}</p>
          </div>

          <div className="shrink-0 flex flex-wrap items-center gap-4">
            <ScoreBadge score={review.score} size="lg" />
            <div className="flex flex-col gap-2 no-print">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={exportingPdf}
                className="btn btn-primary btn-sm gap-2 shadow-sm"
              >
                {exportingPdf ? (
                  <><LoadingSpinner size="sm" /> Preparing PDF...</>
                ) : (
                  <><FileDown size={15} /> Download Study Notes (PDF)</>
                )}
              </button>
              {!isGemini && onRetryGemini && (
                <button
                  type="button"
                  onClick={onRetryGemini}
                  disabled={retryingGemini}
                  className="btn btn-secondary btn-sm gap-1.5"
                >
                  <RefreshCw size={13} className={retryingGemini ? 'animate-spin' : ''} />
                  <span>{retryingGemini ? 'Retrying...' : 'Retry with Gemini'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Clean Study Section Quick Navigation */}
        <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex flex-wrap gap-2 no-print">
          {sectionTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => jumpTo(tab.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-primary-50 text-gray-700 hover:text-primary-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-primary-900/40 dark:hover:text-primary-300 transition-colors"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 1 — Errors & Bugs Found */}
      <section id="section-errors" className="card p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-xs font-bold uppercase tracking-wide">
              Section 1
            </span>
            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <Bug size={18} className={errors.length === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'} />
              <span>Errors &amp; Bugs Found</span>
            </h3>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              errors.length === 0
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}
          >
            {errors.length} {errors.length === 1 ? 'issue' : 'issues'}
          </span>
        </div>

        {errors.length === 0 ? (
          <div className="p-5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3">
            <CheckCircle2 size={22} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                No syntax or logic errors found!
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                Review the walkthrough and complexity breakdown below to deepen your understanding.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {errors.map((err, i) => (
              <ErrorStudyCard key={i} err={err} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* SECTION 2 — How This Code Works (Step-by-Step) */}
      <section id="section-how-it-works" className="card p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 text-xs font-bold uppercase tracking-wide">
            Section 2
          </span>
          <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <ListOrdered size={18} className="text-primary-600 dark:text-primary-400" />
            <span>How This Code Works (Step-by-Step)</span>
          </h3>
        </div>

        <ol className="relative ml-3 border-l-2 border-primary-200 dark:border-primary-800/70 space-y-4 pl-6">
          {howItWorks.map((step, idx) => (
            <li key={idx} className="relative">
              <span className="absolute -left-[35px] top-0.5 w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center shadow-xs ring-4 ring-white dark:ring-slate-900">
                {idx + 1}
              </span>
              <div className="p-3.5 rounded-xl bg-gray-50/90 dark:bg-slate-800/70 border border-gray-100 dark:border-slate-700">
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-0.5">
                  Step {idx + 1}
                </p>
                <p className="text-sm text-gray-800 dark:text-slate-100 leading-relaxed">{step}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* SECTION 3 — Time & Space Complexity */}
      <section id="section-complexity" className="card p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-xs font-bold uppercase tracking-wide">
            Section 3
          </span>
          <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <Clock size={18} className="text-indigo-600 dark:text-indigo-400" />
            <span>Time &amp; Space Complexity</span>
          </h3>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock size={14} className="text-indigo-500" /> Time Complexity
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200 font-mono text-sm font-bold">
                {complexity.time}
              </span>
            </div>
            <div className="pt-1">
              <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Why?</p>
              <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                {complexity.timeReason}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                <Cpu size={14} className="text-purple-500" /> Space Complexity
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 font-mono text-sm font-bold">
                {complexity.space}
              </span>
            </div>
            <div className="pt-1">
              <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Why?</p>
              <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                {complexity.spaceReason}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — Method / Function Call Flow */}
      <section id="section-call-flow" className="card p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 text-xs font-bold uppercase tracking-wide">
              Section 4
            </span>
            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <GitBranch size={18} className="text-teal-600 dark:text-teal-400" />
              <span>Method / Function Call Flow</span>
            </h3>
          </div>
          {callGraph.length > 0 && (
            <span className="badge badge-gray text-xs">
              {callGraph.length} call path{callGraph.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {callGraph.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400 p-4 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700">
            Single-block script or standalone function — no nested function-to-function calls detected in this snippet.
          </p>
        ) : (
          <div className="space-y-3">
            {callChain.length >= 2 && (
              <div className="p-3.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-teal-800 dark:text-teal-200 mr-1">Execution Path:</span>
                {callChain.map((node, i) => (
                  <span key={`${node}-${i}`} className="inline-flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-700 font-mono text-xs font-semibold text-gray-900 dark:text-slate-100">
                      {node}()
                    </span>
                    {i < callChain.length - 1 && (
                      <ArrowRight size={14} className="text-teal-600 dark:text-teal-400" />
                    )}
                  </span>
                ))}
              </div>
            )}

            <div className="space-y-2">
              {callGraph.map((edge, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 font-mono text-xs font-semibold text-gray-900 dark:text-slate-100">
                      {edge.caller}()
                    </span>
                    <ArrowRight size={14} className="text-primary-600 dark:text-primary-400 shrink-0" />
                    <span className="px-2.5 py-1 rounded-md bg-primary-50 dark:bg-primary-900/40 border border-primary-200 dark:border-primary-700 font-mono text-xs font-semibold text-primary-800 dark:text-primary-200">
                      {edge.callee}()
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 leading-relaxed sm:text-right">
                    {edge.purpose}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* SECTION 5 — Complete Function & Method Breakdown */}
      <section id="section-functions" className="card p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 text-xs font-bold uppercase tracking-wide">
              Section 5
            </span>
            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <Boxes size={18} className="text-violet-600 dark:text-violet-400" />
              <span>Complete Function &amp; Method Breakdown</span>
            </h3>
          </div>
          <span className="badge badge-gray text-xs">
            {functionBreakdown.length} function{functionBreakdown.length !== 1 ? 's' : ''}
          </span>
        </div>

        {functionBreakdown.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400 p-4 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700">
            No standalone functions or methods were declared in this code — it executes as top-level script statements.
          </p>
        ) : (
          <div className="space-y-3">
            {functionBreakdown.map((fn, idx) => (
              <FunctionStudyCard key={`${fn.name}-${idx}`} fn={fn} defaultOpen />
            ))}
          </div>
        )}
      </section>

      {/* SECTION 6 — Download Study Notes (PDF) Callout */}
      <section
        id="section-pdf"
        className="card p-5 bg-gradient-to-r from-primary-50/90 via-indigo-50/70 to-white dark:from-slate-900 dark:via-slate-800/90 dark:to-slate-900 border border-primary-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary-600 text-white text-[11px] font-bold uppercase tracking-wide">
              Section 6
            </span>
            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">
              Save Formatted Study Notes
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300">
            Export title, date, submitted code, errors &amp; exact fixes, step-by-step walkthrough, complexity, call flow, and function breakdown as a clean printable PDF.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={exportingPdf}
          className="btn btn-primary shrink-0 gap-2"
        >
          {exportingPdf ? (
            <><LoadingSpinner size="sm" /> Preparing PDF...</>
          ) : (
            <><FileDown size={16} /> Download Study Notes (PDF)</>
          )}
        </button>
      </section>

      {/* Before vs. Improved Code Diff / Submitted Code */}
      {review.code && (
        <div id="section-code-diff" className="card overflow-hidden no-print">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-gray-900 border-b border-gray-800 text-gray-300">
            <div className="flex items-center gap-2">
              {codeViewMode === 'diff' ? (
                <GitCompare size={16} className="text-emerald-400" />
              ) : (
                <Code2 size={16} className="text-primary-400" />
              )}
              <span className="text-xs font-mono font-medium text-white">
                {codeViewMode === 'diff' ? 'Before vs. Improved Code' : 'Submitted Code'}
              </span>
              <span className="text-xs text-gray-400 font-mono">({getLanguageLabel(review.language)})</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex rounded-md bg-gray-800 p-0.5 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => setCodeViewMode('diff')}
                  className={`px-2 py-1 rounded ${codeViewMode === 'diff' ? 'bg-primary-600 text-white' : 'text-gray-300 hover:text-white'}`}
                >
                  Diff View
                </button>
                <button
                  type="button"
                  onClick={() => setCodeViewMode('original')}
                  className={`px-2 py-1 rounded ${codeViewMode === 'original' ? 'bg-primary-600 text-white' : 'text-gray-300 hover:text-white'}`}
                >
                  Original Only
                </button>
              </div>

              {codeViewMode === 'diff' && (
                <button
                  type="button"
                  onClick={() => setRenderSideBySide((p) => !p)}
                  className="btn btn-ghost btn-sm text-gray-300 hover:text-white text-[11px] font-mono px-2 py-1"
                >
                  {renderSideBySide ? 'Inline' : 'Side-by-Side'}
                </button>
              )}

              <button
                type="button"
                onClick={handleCopyImproved}
                className="btn btn-ghost btn-sm text-emerald-400 hover:text-emerald-300 gap-1 text-xs"
              >
                {copiedImproved ? <CheckCheck size={13} /> : <Copy size={13} />}
                <span>{copiedImproved ? 'Copied' : 'Copy Improved Code'}</span>
              </button>
            </div>
          </div>

          <div className="h-72">
            {codeViewMode === 'diff' ? (
              <DiffEditor
                height="100%"
                language={getMonacoLanguage(review.language)}
                original={review.code}
                modified={improvedCode || review.code}
                theme={isDark ? 'vs-dark' : 'vs-dark'}
                options={{
                  readOnly: true,
                  renderSideBySide,
                  fontSize: 12.5,
                  fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 8, bottom: 8 },
                }}
              />
            ) : (
              <Editor
                height="100%"
                language={getMonacoLanguage(review.language)}
                value={review.code}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  fontSize: 13,
                  fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  automaticLayout: true,
                  domReadOnly: true,
                  padding: { top: 10, bottom: 10 },
                }}
              />
            )}
          </div>

          {codeViewMode === 'diff' && (
            <div className="p-4 bg-gray-50 dark:bg-slate-800/80 border-t border-gray-200 dark:border-slate-700 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                {hasDiffChanges ? 'Line-Level Improvement Explanations' : 'Comparison Status'}
              </p>
              {improvementNotes.length > 0 ? (
                <ul className="space-y-1.5">
                  {improvementNotes.map((note, idx) => (
                    <li key={idx} className="text-xs text-gray-700 dark:text-slate-200 flex items-start gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-mono shrink-0">
                        Line {note.lineNumber}
                      </span>
                      <span className="leading-relaxed">{note.explanation}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {hasDiffChanges
                    ? 'Compare highlighted additions (green) and removals (red) in the diff above.'
                    : 'No structural line changes needed—your code already matches the suggested baseline.'}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tagged Concepts + Practice This Topic */}
      {review.concepts?.length > 0 && (
        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold text-sm">
            <BookOpen size={16} />
            <span>Practiced Concepts</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {review.concepts.map((c, i) => {
              const lvl = c.level || c.status || 'ok';
              const needsPractice = lvl === 'weak' || lvl === 'ok' || review.score < 75;
              return (
                <div key={i} className="inline-flex items-center gap-1.5 flex-wrap">
                  <span className={`badge text-xs px-2.5 py-1 ${getConceptLevelClass(lvl)}`}>
                    {c.name} • {lvl}
                  </span>
                  {showPracticeActions && needsPractice && (
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/quiz?topic=${encodeURIComponent(c.name)}`)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/40 dark:text-primary-300 dark:hover:bg-primary-900/60 transition-colors border border-primary-200 dark:border-primary-700 no-print"
                    >
                      Practice This Topic <ArrowRight size={11} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Security Analysis */}
      {(review.security?.length > 0 || review.securityIssues?.length > 0) && (
        <div className="card p-5 border-l-4 border-l-amber-500 space-y-3">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold">
            <Shield size={18} />
            <span>Security Considerations ({(review.security || review.securityIssues).length})</span>
          </div>
          <div className="space-y-2">
            {(review.security || review.securityIssues).map((item, idx) => (
              <div key={idx} className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-lg text-sm text-amber-900 dark:text-amber-100 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{item.title || item.issue || 'Security Note'}</span>
                  {item.severity && (
                    <span className={`badge text-[10px] uppercase ${getSeverityClass(item.severity)}`}>
                      {item.severity}
                    </span>
                  )}
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  {item.recommendation || item.description || item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
