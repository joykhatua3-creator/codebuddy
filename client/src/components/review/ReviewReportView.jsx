import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor, { DiffEditor } from '@monaco-editor/react';
import {
  Bug, Shield, BookOpen, Copy, CheckCheck, AlertTriangle, Edit2, Check, X, Code2,
  RefreshCw, ArrowRight, GitCompare, MessageSquareCheck, Sparkles, FileDown,
  CheckCircle2, ListOrdered, Clock, Cpu, GitBranch, Boxes, ChevronDown, ChevronRight,
} from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';
import {
  formatDate, getLanguageLabel, getLanguageBadgeClass,
  getConceptLevelClass, getSeverityClass, copyToClipboard,
  getMonacoLanguage,
} from '../../utils/helpers';
import { downloadStudyNotesPdf, normalizeReviewSections } from '../../utils/studyNotesPdf';
import { useToast } from '../ui/Toast';
import { useTheme } from '../../context/ThemeContext';

const unescapeCodeText = (str) => {
  if (typeof str !== 'string' || !str) return '';
  if (!str.includes('\n') && (str.includes('\\n') || str.includes('\\t'))) {
    return str.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').replace(/\\t/g, '\t');
  }
  return str;
};

const getCleanFallbackReason = (rawReason = '') => {
  if (
    !rawReason ||
    /\[GoogleGenerativeAI|404|generativelanguage|https?:\/\/|models\/|Error\s*:/i.test(rawReason)
  ) {
    return 'AI review was temporarily unavailable for this snapshot — click Retry with Gemini AI.';
  }
  return rawReason;
};

const ErrorStudyCard = ({ err, index }) => {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const isWarning = err.severity === 'WARNING';
  const cleanFix = useMemo(() => unescapeCodeText(err.fix), [err.fix]);

  const handleCopyFix = async () => {
    try {
      await copyToClipboard(cleanFix);
      setCopied(true);
      toast({ type: 'success', message: 'Suggested fix copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ type: 'error', message: 'Failed to copy fix' });
    }
  };

  return (
    <div
      className={`border rounded-xl overflow-hidden bg-white/75 dark:bg-white/[0.04] backdrop-blur-xl ${
        isWarning
          ? 'border-amber-300/70 dark:border-amber-400/30'
          : 'border-rose-300/70 dark:border-rose-400/30'
      }`}
    >
      <div
        className={`flex items-start gap-3 p-3.5 border-b ${
          isWarning
            ? 'bg-amber-500/10 border-amber-300/40 dark:border-amber-400/20'
            : 'bg-rose-500/10 border-rose-300/40 dark:border-rose-400/20'
        }`}
      >
        <div
          className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
            isWarning ? 'bg-amber-500/20' : 'bg-rose-500/20'
          }`}
        >
          <Bug
            size={15}
            className={isWarning ? 'text-amber-700 dark:text-amber-300' : 'text-rose-600 dark:text-rose-400'}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                isWarning
                  ? 'bg-amber-500/20 text-amber-800 dark:text-amber-200'
                  : 'bg-rose-500/20 text-rose-800 dark:text-rose-200'
              }`}
            >
              {err.severity}
            </span>
            {err.line > 0 && (
              <span className="bg-slate-900 dark:bg-white/10 text-white text-xs px-2 py-0.5 rounded-full font-mono">
                Line {err.line}
              </span>
            )}
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
              #{index + 1} · {err.title}
            </h4>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            {err.explanation}
          </p>
        </div>
      </div>

      {cleanFix && (
        <div className="p-3.5 bg-white/50 dark:bg-[#070B14]/60 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Exact Fix
            </span>
            <button
              type="button"
              onClick={handleCopyFix}
              className="btn btn-ghost btn-sm py-1 px-2 text-xs gap-1"
            >
              {copied ? <CheckCheck size={13} className="text-emerald-500" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy Fix'}</span>
            </button>
          </div>
          <pre className="p-3 rounded-xl bg-[#0B1120] text-emerald-300 border border-white/10 text-xs font-mono overflow-x-auto leading-relaxed">
            <code>{cleanFix}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

const FunctionStudyCard = ({ fn, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/75 dark:border-white/15 rounded-xl bg-white/60 dark:bg-white/[0.04] backdrop-blur-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left bg-white/60 dark:bg-white/[0.04] hover:bg-white/80 dark:hover:bg-white/[0.08] transition-colors"
      >
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <span className="font-mono text-sm font-bold text-cyan-700 dark:text-cyan-300 truncate">
            {fn.name}({fn.parameters === 'None' ? '' : fn.parameters})
          </span>
          <span className="badge badge-gray text-[11px] font-mono">
            Returns: {fn.returns || 'None'}
          </span>
        </div>
        {open ? (
          <ChevronDown size={16} className="text-slate-500 dark:text-slate-400 shrink-0" />
        ) : (
          <ChevronRight size={16} className="text-slate-500 dark:text-slate-400 shrink-0" />
        )}
      </button>

      {open && (
        <div className="p-3.5 space-y-2.5 text-sm border-t border-white/70 dark:border-white/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="px-3 py-2 rounded-lg bg-white/75 dark:bg-[#0B1120]/60 border border-white/80 dark:border-white/10 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 shrink-0">
                Params
              </span>
              <span className="font-mono text-xs text-slate-900 dark:text-slate-100 truncate">
                {fn.parameters || 'None'}
              </span>
            </div>
            <div className="px-3 py-2 rounded-lg bg-white/75 dark:bg-[#0B1120]/60 border border-white/80 dark:border-white/10 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 shrink-0">
                Returns
              </span>
              <span className="font-mono text-xs text-slate-900 dark:text-slate-100 truncate">
                {fn.returns || 'None / void'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-400/25">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300 mb-1">
              What It Does
            </p>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
              {fn.explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const synthesizeImprovedCode = (review) => {
  if (review?.improvedCode && review.improvedCode.trim()) {
    return unescapeCodeText(review.improvedCode);
  }
  const cleanOriginal = unescapeCodeText(review?.code || '');
  if (!cleanOriginal) return '';
  const lines = cleanOriginal.split('\n');
  for (const b of review.bugs || []) {
    const idx = (b.lineNumber || 1) - 1;
    const sol = unescapeCodeText(b.solution || '');
    if (
      b.lineNumber > 0 &&
      idx >= 0 &&
      idx < lines.length &&
      sol &&
      !sol.trim().startsWith('//') &&
      !sol.trim().startsWith('#') &&
      !sol.includes('\n')
    ) {
      lines[idx] = sol;
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
  const [renderSideBySide, setRenderSideBySide] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [copiedImproved, setCopiedImproved] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setRenderSideBySide(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const studyData = useMemo(() => normalizeReviewSections(review), [review]);
  const { errors, howItWorks, complexity, callGraph, functionBreakdown, isGemini } = studyData;
  const callChain = useMemo(() => buildCallChainPreview(callGraph), [callGraph]);

  const originalCode = useMemo(() => unescapeCodeText(review?.code || ''), [review?.code]);
  const improvedCode = useMemo(() => synthesizeImprovedCode(review), [review]);
  const diffLineCount = Math.max(
    originalCode ? originalCode.split('\n').length : 1,
    improvedCode ? improvedCode.split('\n').length : 1
  );
  const diffEditorHeight = Math.min(460, Math.max(160, diffLineCount * 22 + 48));
  const cleanFallbackReason = useMemo(
    () => getCleanFallbackReason(review?.fallbackReason),
    [review?.fallbackReason]
  );
  const hasDiffChanges = Boolean(originalCode && improvedCode && improvedCode !== originalCode);
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
      await copyToClipboard(improvedCode || originalCode);
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

  const primaryPracticeTopic =
    review?.concepts?.find((c) => c.level === 'weak' || c.level === 'ok')?.name ||
    review?.concepts?.[0]?.name ||
    `${getLanguageLabel(review.language)} Fundamentals`;

  const scoreVal = Number(review?.score ?? 0);
  const scoreRingClass =
    scoreVal >= 80
      ? 'border-emerald-400 bg-emerald-400/15 text-emerald-700 dark:text-emerald-300 shadow-[0_0_24px_rgba(52,211,153,0.28)]'
      : scoreVal >= 60
      ? 'border-cyan-400 bg-cyan-400/15 text-cyan-700 dark:text-cyan-300 shadow-[0_0_24px_rgba(56,189,248,0.25)]'
      : 'border-rose-400 bg-rose-400/15 text-rose-700 dark:text-rose-300 shadow-[0_0_24px_rgba(244,63,94,0.25)]';

  const monacoTheme = isDark ? 'vs-dark' : 'light';

  const sectionTabs = [
    ...(originalCode ? [{ id: 'section-code-diff', label: 'Code Diff' }] : []),
    { id: 'section-errors', label: `Errors (${errors.length})` },
    { id: 'section-complexity', label: 'Complexity' },
    { id: 'section-how-it-works', label: `Walkthrough (${howItWorks.length})` },
    { id: 'section-functions', label: `Functions (${functionBreakdown.length})` },
    { id: 'section-call-flow', label: 'Call Flow' },
  ];

  return (
    <div className="space-y-4 overflow-x-hidden">
      {/* Fallback Banner + Retry with Gemini */}
      {!isGemini && (
        <div className="liquid-glass p-4 bg-amber-500/10 border-amber-400/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          <div className="flex items-start gap-2.5 text-sm text-amber-900 dark:text-amber-100">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Analyzed using Static Syntax Analyzer (Fallback)</p>
              <p className="text-xs text-amber-800 dark:text-amber-200 mt-0.5">
                {cleanFallbackReason}
              </p>
            </div>
          </div>
          {onRetryGemini && (
            <button
              type="button"
              onClick={onRetryGemini}
              disabled={retryingGemini}
              className="btn btn-primary btn-sm rounded-full shrink-0 gap-1.5"
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
        <div className="liquid-glass p-4 sm:p-5 border-l-4 border-l-emerald-400 bg-emerald-500/10 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
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
          <p className="text-sm text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
            {review.teacherFeedback.comment}
          </p>
        </div>
      )}

      {/* CLEAN LUCID GLASS HEADER */}
      <div className="liquid-glass p-4 sm:p-5 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`badge ${getLanguageBadgeClass(review.language)} font-mono text-xs uppercase`}>
                {getLanguageLabel(review.language)} Study Report
              </span>
              {isGemini ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-500/15 text-emerald-700 border border-emerald-400/30 dark:text-emerald-300">
                  <Sparkles size={12} /> Gemini 3.8 Flash
                </span>
              ) : (
                <span className="badge badge-yellow text-xs font-mono">Static Syntax Analyzer</span>
              )}
              <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(review.createdAt)}</span>
            </div>

            {editableTitle && editingTitle ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  className="input input-sm font-bold"
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
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                  {review.title || `${getLanguageLabel(review.language)} Study Report`}
                </h2>
                {editableTitle && (
                  <button
                    onClick={() => {
                      setTitleValue(review.title || '');
                      setEditingTitle(true);
                    }}
                    className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white no-print shrink-0"
                    title="Edit report title"
                  >
                    <Edit2 size={14} />
                  </button>
                )}
              </div>
            )}

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{review.summary}</p>
          </div>

          <div className="shrink-0 flex flex-wrap items-center gap-3">
            {/* Glowing Emerald Circular Score Ring */}
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 flex flex-col items-center justify-center shrink-0 backdrop-blur-xl ${scoreRingClass}`}>
              <span className="text-lg sm:text-xl font-bold font-mono leading-none tabular-nums">
                {scoreVal}
                <span className="text-[10px] sm:text-xs opacity-75">/100</span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider mt-0.5">Score</span>
            </div>

            <div className="flex flex-wrap sm:flex-col gap-2 no-print">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={exportingPdf}
                className="liquid-pill px-4 py-2 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white"
              >
                {exportingPdf ? (
                  <><LoadingSpinner size="sm" /> Preparing PDF...</>
                ) : (
                  <><FileDown size={15} className="text-cyan-600 dark:text-cyan-300" /> Export PDF Notes</>
                )}
              </button>
              {!isGemini && onRetryGemini && (
                <button
                  type="button"
                  onClick={onRetryGemini}
                  disabled={retryingGemini}
                  className="btn btn-secondary btn-sm rounded-full gap-1.5"
                >
                  <RefreshCw size={13} className={retryingGemini ? 'animate-spin' : ''} />
                  <span>{retryingGemini ? 'Retrying...' : 'Retry with Gemini'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Horizontal Scrollable Section Jump Tabs */}
        <div className="pt-2.5 border-t border-white/70 dark:border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 no-print">
          {sectionTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => jumpTo(tab.id)}
              className="liquid-pill px-3 py-1 text-xs font-medium whitespace-nowrap shrink-0 text-slate-700 dark:text-slate-200"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TOP FULL-WIDTH GLASS DIFF CARD (col-span-full) */}
      {originalCode && (
        <div id="section-code-diff" className="w-full liquid-glass overflow-hidden no-print">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-white/70 dark:bg-[#0B1120]/80 border-b border-white/70 dark:border-white/10">
            <div className="flex items-center gap-2">
              {codeViewMode === 'diff' ? (
                <GitCompare size={16} className="text-emerald-600 dark:text-emerald-300" />
              ) : (
                <Code2 size={16} className="text-cyan-600 dark:text-cyan-300" />
              )}
              <span className="text-xs font-mono font-semibold text-slate-900 dark:text-white">
                {codeViewMode === 'diff' ? 'Before vs. After Code Diff' : 'Submitted Code'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                ({getLanguageLabel(review.language)})
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex rounded-full bg-white/80 dark:bg-white/[0.06] p-0.5 text-[11px] font-mono border border-white/80 dark:border-white/15">
                <button
                  type="button"
                  onClick={() => setCodeViewMode('diff')}
                  className={`px-3 py-1 rounded-full transition-colors ${
                    codeViewMode === 'diff'
                      ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Diff View
                </button>
                <button
                  type="button"
                  onClick={() => setCodeViewMode('original')}
                  className={`px-3 py-1 rounded-full transition-colors ${
                    codeViewMode === 'original'
                      ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Original
                </button>
              </div>

              {codeViewMode === 'diff' && (
                <button
                  type="button"
                  onClick={() => setRenderSideBySide((p) => !p)}
                  className="liquid-pill px-3 py-1 text-[11px] font-mono text-slate-700 dark:text-slate-200"
                >
                  {renderSideBySide ? 'Inline' : 'Side-by-Side'}
                </button>
              )}

              <button
                type="button"
                onClick={handleCopyImproved}
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:opacity-80 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30"
              >
                {copiedImproved ? <CheckCheck size={13} /> : <Copy size={13} />}
                <span>{copiedImproved ? 'Copied' : 'Copy Improved Code'}</span>
              </button>
            </div>
          </div>

          <div style={{ height: `${diffEditorHeight}px` }}>
            {codeViewMode === 'diff' ? (
              <DiffEditor
                height="100%"
                language={getMonacoLanguage(review.language)}
                original={originalCode}
                modified={improvedCode || originalCode}
                theme={monacoTheme}
                options={{
                  readOnly: true,
                  renderSideBySide,
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  minimap: { enabled: false },
                  overviewRulerLanes: 0,
                  renderOverviewRuler: false,
                  hideCursorInOverviewRuler: true,
                  overviewRulerBorder: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 10, bottom: 10 },
                }}
              />
            ) : (
              <Editor
                height="100%"
                language={getMonacoLanguage(review.language)}
                value={originalCode}
                theme={monacoTheme}
                options={{
                  readOnly: true,
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  minimap: { enabled: false },
                  overviewRulerLanes: 0,
                  hideCursorInOverviewRuler: true,
                  overviewRulerBorder: false,
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
            <div className="p-3.5 sm:p-4 bg-white/60 dark:bg-[#0B1120]/70 border-t border-white/70 dark:border-white/10 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {hasDiffChanges ? 'Line-Level Improvement Notes' : 'Comparison Status'}
              </p>
              {improvementNotes.length > 0 ? (
                <ul className="space-y-1.5">
                  {improvementNotes.map((note, idx) => (
                    <li key={idx} className="text-xs text-slate-800 dark:text-slate-200 flex items-start gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30 font-mono shrink-0">
                        Line {note.lineNumber}
                      </span>
                      <span className="leading-relaxed">{note.explanation}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {hasDiffChanges
                    ? 'Compare highlighted additions (green) and removals (red) in the diff above.'
                    : 'No structural line changes needed—your code already matches the suggested baseline.'}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ROW 1: Errors & Bugs (Left) + Complexity Analysis (Right: Cyan Time & Violet Space Glass Tiles) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <section id="section-errors" className="liquid-glass p-4 sm:p-5 space-y-3 h-full flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bug
                  size={18}
                  className={errors.length === 0 ? 'text-emerald-500' : 'text-rose-500'}
                />
                <span>Errors &amp; Bugs Found</span>
              </h3>
              <span className={errors.length === 0 ? 'badge-green' : 'badge-red'}>
                {errors.length} {errors.length === 1 ? 'issue' : 'issues'}
              </span>
            </div>

            {errors.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    No syntax or logic errors found!
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Your logic is clean. Review complexity and call flow to optimize further.
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
          </div>
        </section>

        {/* Complexity Analysis: Luminous Cyan Time & Violet Space Glass Tiles */}
        <section id="section-complexity" className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
          <div className="liquid-glass p-4 sm:p-5 space-y-2.5 border-t-2 border-t-cyan-400 h-full">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock size={14} className="text-cyan-500 dark:text-cyan-300" /> Time
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/35 text-cyan-700 dark:text-cyan-200 font-mono text-sm font-bold shadow-[0_0_16px_rgba(56,189,248,0.18)]">
                {complexity.time}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {complexity.timeReason}
            </p>
          </div>

          <div className="liquid-glass p-4 sm:p-5 space-y-2.5 border-t-2 border-t-violet-400 h-full">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Cpu size={14} className="text-violet-500 dark:text-violet-300" /> Space
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-violet-500/15 border border-violet-400/35 text-violet-700 dark:text-violet-200 font-mono text-sm font-bold shadow-[0_0_16px_rgba(129,140,248,0.18)]">
                {complexity.space}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {complexity.spaceReason}
            </p>
          </div>
        </section>
      </div>

      {/* ROW 2: Full-Width Step-by-Step Walkthrough (Compact Sleek Glass Rows) */}
      <section id="section-how-it-works" className="liquid-glass p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ListOrdered size={18} className="text-cyan-500 dark:text-cyan-300" />
            <span>Step-by-Step Walkthrough</span>
          </h3>
          <span className="badge badge-gray font-mono text-xs">{howItWorks.length} steps</span>
        </div>

        <div className="space-y-2">
          {howItWorks.map((step, idx) => (
            <div
              key={idx}
              className="px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-white/[0.04] border border-white/80 dark:border-white/10 flex items-start gap-3"
            >
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-700 dark:text-cyan-200 shrink-0 mt-0.5">
                Step {idx + 1}
              </span>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                {step}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ROW 3: Function Breakdown (Left 7 cols) + Method Call Flow & Practice CTA (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <section id="section-functions" className="lg:col-span-7 liquid-glass p-4 sm:p-5 space-y-3 flex flex-col">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Boxes size={18} className="text-indigo-500 dark:text-indigo-300" />
              <span>Complete Function Breakdown</span>
            </h3>
            <span className="badge badge-gray font-mono text-xs">
              {functionBreakdown.length} function{functionBreakdown.length !== 1 ? 's' : ''}
            </span>
          </div>

          {functionBreakdown.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400 p-4 rounded-xl bg-white/60 dark:bg-white/[0.04] border border-white/75 dark:border-white/10">
              No standalone functions or methods were declared—this snippet executes as top-level statements.
            </p>
          ) : (
            <div className="space-y-3">
              {functionBreakdown.map((fn, idx) => (
                <FunctionStudyCard key={`${fn.name}-${idx}`} fn={fn} defaultOpen />
              ))}
            </div>
          )}
        </section>

        <div className="lg:col-span-5 space-y-4">
          <section id="section-call-flow" className="liquid-glass p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GitBranch size={18} className="text-emerald-500 dark:text-emerald-300" />
                <span>Method Call Flow</span>
              </h3>
              {callGraph.length > 0 && (
                <span className="badge badge-gray font-mono text-xs">
                  {callGraph.length} path{callGraph.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {callGraph.length === 0 ? (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 p-3.5 rounded-xl bg-white/60 dark:bg-white/[0.04] border border-white/75 dark:border-white/10">
                Single-block script or standalone function — no nested function-to-function calls detected.
              </p>
            ) : (
              <div className="space-y-3">
                {callChain.length >= 2 && (
                  <div className="p-3.5 rounded-xl bg-[#0B1120] border border-white/10 flex items-center gap-2 flex-wrap">
                    {callChain.map((node, i) => (
                      <span key={`${node}-${i}`} className="inline-flex items-center gap-2">
                        <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/15 font-mono text-xs font-semibold text-white">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              i === 0
                                ? 'bg-cyan-400 shadow-[0_0_8px_#38BDF8]'
                                : 'bg-emerald-400 shadow-[0_0_8px_#34D399]'
                            }`}
                          />
                          {node}()
                        </span>
                        {i < callChain.length - 1 && (
                          <ArrowRight size={14} className="text-slate-400 shrink-0" />
                        )}
                      </span>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  {callGraph.map((edge, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white/60 dark:bg-white/[0.04] border border-white/75 dark:border-white/10 space-y-1"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/85 dark:bg-white/[0.08] border border-white/90 dark:border-white/15 font-mono text-xs font-semibold text-slate-900 dark:text-white">
                          {edge.caller}()
                        </span>
                        <ArrowRight size={13} className="text-cyan-500 shrink-0" />
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          {edge.callee}()
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {edge.purpose}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Practice This Topic CTA Card + Concepts */}
          <section className="liquid-glass p-4 sm:p-5 space-y-3 border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 no-print">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300 font-bold text-sm">
                <BookOpen size={16} />
                <span>Practice This Topic</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Reinforce what you learned with a targeted quiz on{' '}
                <strong className="text-slate-900 dark:text-white">{primaryPracticeTopic}</strong>.
              </p>
            </div>

            {review.concepts?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {review.concepts.map((c, i) => {
                  const lvl = c.level || c.status || 'ok';
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        showPracticeActions &&
                        navigate(`/dashboard/quiz?topic=${encodeURIComponent(c.name)}`)
                      }
                      className={`badge text-xs px-2.5 py-1 ${getConceptLevelClass(lvl)} ${
                        showPracticeActions ? 'hover:opacity-85 cursor-pointer' : 'cursor-default'
                      }`}
                    >
                      {c.name} · {lvl}
                    </button>
                  );
                })}
              </div>
            )}

            {showPracticeActions && (
              <button
                type="button"
                onClick={() => navigate(`/dashboard/quiz?topic=${encodeURIComponent(primaryPracticeTopic)}`)}
                className="btn btn-primary rounded-full w-full py-2.5 font-semibold gap-2"
              >
                <span>Practice {primaryPracticeTopic}</span>
                <ArrowRight size={15} />
              </button>
            )}
          </section>

          {/* Security Analysis */}
          {(review.security?.length > 0 || review.securityIssues?.length > 0) && (
            <div className="liquid-glass p-4 sm:p-5 border-l-4 border-l-amber-400 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold text-sm">
                <Shield size={17} />
                <span>Security Considerations ({(review.security || review.securityIssues).length})</span>
              </div>
              <div className="space-y-2">
                {(review.security || review.securityIssues).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-amber-500/10 rounded-xl text-xs text-amber-950 dark:text-amber-100 space-y-1 border border-amber-400/25"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{item.title || item.issue || 'Security Note'}</span>
                      {item.severity && (
                        <span className={`badge text-[10px] uppercase ${getSeverityClass(item.severity)}`}>
                          {item.severity}
                        </span>
                      )}
                    </div>
                    <p className="text-amber-800 dark:text-amber-200">
                      {item.recommendation || item.description || item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
