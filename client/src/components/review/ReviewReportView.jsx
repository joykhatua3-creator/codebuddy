import { useState, useMemo } from 'react';
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
      className={`border rounded-xl overflow-hidden bg-white dark:bg-[#111116] ${
        isWarning
          ? 'border-amber-300/70 dark:border-amber-500/30'
          : 'border-red-300/70 dark:border-red-500/30'
      }`}
    >
      <div
        className={`flex items-start gap-3 p-4 border-b ${
          isWarning
            ? 'bg-amber-50/80 dark:bg-amber-500/10 border-amber-200/70 dark:border-amber-500/20'
            : 'bg-red-50/80 dark:bg-red-500/10 border-red-200/70 dark:border-red-500/20'
        }`}
      >
        <div
          className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
            isWarning ? 'bg-amber-100 dark:bg-amber-500/20' : 'bg-red-100 dark:bg-red-500/20'
          }`}
        >
          <Bug
            size={15}
            className={isWarning ? 'text-amber-700 dark:text-amber-300' : 'text-red-600 dark:text-red-400'}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                isWarning
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300'
              }`}
            >
              {err.severity}
            </span>
            {err.line > 0 && (
              <span className="bg-[#141210] dark:bg-white/10 text-white text-xs px-2 py-0.5 rounded font-mono">
                Line {err.line}
              </span>
            )}
            <h4 className="font-semibold text-[#141210] dark:text-[#F8FAFC] text-sm">
              #{index + 1} · {err.title}
            </h4>
          </div>
          <p className="text-sm text-[#57534E] dark:text-[#94A3B8] mt-1.5 leading-relaxed">
            {err.explanation}
          </p>
        </div>
      </div>

      {err.fix && (
        <div className="p-4 bg-[#F7F4EE]/70 dark:bg-[#0D0D11]/70 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#059669] dark:text-[#34D399]">
              Exact Fix
            </span>
            <button
              type="button"
              onClick={handleCopyFix}
              className="btn btn-ghost btn-sm py-1 px-2 text-xs gap-1"
            >
              {copied ? <CheckCheck size={13} className="text-[#10B981]" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy Fix'}</span>
            </button>
          </div>
          <pre className="p-3 rounded-xl bg-[#141210] dark:bg-[#0D0D11] text-[#34D399] border border-black/10 dark:border-white/[0.08] text-xs font-mono overflow-x-auto leading-relaxed">
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
    <div className="border border-[#E5DFD5] dark:border-white/[0.08] rounded-xl bg-white dark:bg-[#111116] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-[#F7F4EE]/70 dark:bg-white/[0.03] hover:bg-[#F7F4EE] dark:hover:bg-white/[0.05] transition-colors"
      >
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <span className="font-mono text-sm font-bold text-[#E85D3F] dark:text-[#F97316]">
            {fn.name}({fn.parameters === 'None' ? '' : fn.parameters})
          </span>
          <span className="badge badge-gray text-[11px] font-mono">
            Returns: {fn.returns || 'None'}
          </span>
        </div>
        {open ? (
          <ChevronDown size={16} className="text-[#57534E] dark:text-[#94A3B8] shrink-0" />
        ) : (
          <ChevronRight size={16} className="text-[#57534E] dark:text-[#94A3B8] shrink-0" />
        )}
      </button>

      {open && (
        <div className="p-4 grid sm:grid-cols-3 gap-3 text-sm border-t border-[#E5DFD5] dark:border-white/[0.08]">
          <div className="p-3 rounded-xl bg-[#F7F4EE] dark:bg-[#16161D] border border-[#E5DFD5] dark:border-white/[0.06]">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#57534E] dark:text-[#94A3B8] mb-1">
              Parameters
            </p>
            <p className="font-mono text-xs text-[#141210] dark:text-[#F8FAFC] break-words">
              {fn.parameters || 'None'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-[#F7F4EE] dark:bg-[#16161D] border border-[#E5DFD5] dark:border-white/[0.06]">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#57534E] dark:text-[#94A3B8] mb-1">
              Return Value
            </p>
            <p className="font-mono text-xs text-[#141210] dark:text-[#F8FAFC] break-words">
              {fn.returns || 'None / void'}
            </p>
          </div>
          <div className="sm:col-span-1 p-3 rounded-xl bg-[#E85D3F]/5 dark:bg-orange-500/10 border border-[#E85D3F]/20 dark:border-orange-500/20">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#E85D3F] dark:text-orange-400 mb-1">
              What It Does
            </p>
            <p className="text-xs text-[#141210] dark:text-[#E2E8F0] leading-relaxed">
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

  const primaryPracticeTopic =
    review?.concepts?.find((c) => c.level === 'weak' || c.level === 'ok')?.name ||
    review?.concepts?.[0]?.name ||
    `${getLanguageLabel(review.language)} Fundamentals`;

  const scoreVal = Number(review?.score ?? 0);
  const scoreRingClass =
    scoreVal >= 80
      ? 'border-[#10B981] bg-[#10B981]/10 text-[#059669] dark:border-[#34D399] dark:bg-[#34D399]/15 dark:text-[#34D399]'
      : scoreVal >= 60
      ? 'border-[#E85D3F] bg-[#E85D3F]/10 text-[#E85D3F] dark:border-[#F97316] dark:bg-[#F97316]/15 dark:text-[#F97316]'
      : 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400';

  return (
    <div className="space-y-6">
      {/* Fallback Banner + Retry with Gemini */}
      {!isGemini && (
        <div className="card p-4 bg-amber-50/90 dark:bg-amber-500/10 border border-amber-300/70 dark:border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
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
        <div className="card p-5 border-l-4 border-l-[#10B981] bg-[#10B981]/5 dark:bg-[#34D399]/10 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-[#059669] dark:text-[#34D399] font-semibold text-sm">
              <MessageSquareCheck size={17} />
              <span>Teacher Mentor Feedback — {review.teacherFeedback.teacherName || 'Instructor'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#059669] dark:text-[#34D399]">
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
          <p className="text-sm text-[#141210] dark:text-[#F8FAFC] leading-relaxed whitespace-pre-wrap">
            {review.teacherFeedback.comment}
          </p>
        </div>
      )}

      {/* CLEAN BENTO HEADER */}
      <div className="card p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`badge ${getLanguageBadgeClass(review.language)} font-mono text-xs uppercase`}>
                {getLanguageLabel(review.language)} Study Report
              </span>
              {isGemini ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-[#10B981]/10 text-[#059669] border border-[#10B981]/25 dark:bg-[#34D399]/15 dark:text-[#34D399] dark:border-[#34D399]/30">
                  <Sparkles size={12} /> Gemini 3.8 Flash
                </span>
              ) : (
                <span className="badge badge-yellow text-xs font-mono">Static Syntax Analyzer</span>
              )}
              <span className="text-xs text-[#57534E] dark:text-[#94A3B8]">{formatDate(review.createdAt)}</span>
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
                <h2 className="text-xl sm:text-2xl font-bold text-[#141210] dark:text-[#F8FAFC]">
                  {review.title || `${getLanguageLabel(review.language)} Study Report`}
                </h2>
                {editableTitle && (
                  <button
                    onClick={() => {
                      setTitleValue(review.title || '');
                      setEditingTitle(true);
                    }}
                    className="text-[#57534E] hover:text-[#141210] dark:text-[#94A3B8] dark:hover:text-white no-print"
                    title="Edit report title"
                  >
                    <Edit2 size={14} />
                  </button>
                )}
              </div>
            )}

            <p className="text-sm text-[#57534E] dark:text-[#94A3B8] leading-relaxed">{review.summary}</p>
          </div>

          <div className="shrink-0 flex flex-wrap items-center gap-4">
            {/* Emerald Circular Score Pill */}
            <div className={`w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center shrink-0 ${scoreRingClass}`}>
              <span className="text-xl font-bold font-mono leading-none tabular-nums">
                {scoreVal}
                <span className="text-xs opacity-70">/100</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider mt-1">Score</span>
            </div>

            <div className="flex flex-col gap-2 no-print">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={exportingPdf}
                className="btn bg-[#141210] text-white hover:bg-[#2a2622] dark:bg-white dark:text-[#0D0D11] dark:hover:bg-slate-200 font-semibold px-4 py-2.5 text-xs sm:text-sm gap-2 shadow-sm"
              >
                {exportingPdf ? (
                  <><LoadingSpinner size="sm" /> Preparing PDF...</>
                ) : (
                  <><FileDown size={15} /> Export PDF Notes</>
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
      </div>

      {/* TWO-COLUMN BENTO GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (Code Diff, Errors, 3-Card Walkthrough, Function Breakdown) */}
        <div className="xl:col-span-7 space-y-6">
          {/* Before vs. After Code Diff Card */}
          {review.code && (
            <div id="section-code-diff" className="card overflow-hidden no-print">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-[#141210] dark:bg-[#111116] border-b border-white/[0.08] text-slate-300">
                <div className="flex items-center gap-2">
                  {codeViewMode === 'diff' ? (
                    <GitCompare size={16} className="text-[#34D399]" />
                  ) : (
                    <Code2 size={16} className="text-[#F97316]" />
                  )}
                  <span className="text-xs font-mono font-semibold text-white">
                    {codeViewMode === 'diff' ? 'Before vs. After Code Diff' : 'Submitted Code'}
                  </span>
                  <span className="text-xs text-[#94A3B8] font-mono">
                    ({getLanguageLabel(review.language)})
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="inline-flex rounded-lg bg-white/5 p-0.5 text-[11px] font-mono border border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setCodeViewMode('diff')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        codeViewMode === 'diff'
                          ? 'bg-[#F97316] text-[#0D0D11] font-semibold'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Diff View
                    </button>
                    <button
                      type="button"
                      onClick={() => setCodeViewMode('original')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        codeViewMode === 'original'
                          ? 'bg-[#F97316] text-[#0D0D11] font-semibold'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Original
                    </button>
                  </div>

                  {codeViewMode === 'diff' && (
                    <button
                      type="button"
                      onClick={() => setRenderSideBySide((p) => !p)}
                      className="text-slate-300 hover:text-white text-[11px] font-mono px-2 py-1 rounded hover:bg-white/10"
                    >
                      {renderSideBySide ? 'Inline' : 'Side-by-Side'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCopyImproved}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#34D399] hover:text-emerald-300 px-2 py-1 rounded hover:bg-white/5"
                  >
                    {copiedImproved ? <CheckCheck size={13} /> : <Copy size={13} />}
                    <span>{copiedImproved ? 'Copied' : 'Copy Improved Code'}</span>
                  </button>
                </div>
              </div>

              <div className="h-80">
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
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      padding: { top: 10, bottom: 10 },
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
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
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
                <div className="p-4 bg-[#F7F4EE]/70 dark:bg-[#111116] border-t border-[#E5DFD5] dark:border-white/[0.08] space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#57534E] dark:text-[#94A3B8]">
                    {hasDiffChanges ? 'Line-Level Improvement Notes' : 'Comparison Status'}
                  </p>
                  {improvementNotes.length > 0 ? (
                    <ul className="space-y-1.5">
                      {improvementNotes.map((note, idx) => (
                        <li key={idx} className="text-xs text-[#141210] dark:text-[#E2E8F0] flex items-start gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-[#10B981]/15 text-[#059669] dark:bg-[#34D399]/15 dark:text-[#34D399] font-mono shrink-0">
                            Line {note.lineNumber}
                          </span>
                          <span className="leading-relaxed">{note.explanation}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-[#57534E] dark:text-[#94A3B8]">
                      {hasDiffChanges
                        ? 'Compare highlighted additions (green) and removals (red) in the diff above.'
                        : 'No structural line changes needed—your code already matches the suggested baseline.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Horizontal Step-by-Step Walkthrough (01., 02., 03. Copper-Numbered Cards) */}
          <section id="section-how-it-works" className="card p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-[#141210] dark:text-[#F8FAFC] flex items-center gap-2">
                <ListOrdered size={18} className="text-[#E85D3F] dark:text-[#F97316]" />
                <span>Step-by-Step Walkthrough</span>
              </h3>
              <span className="badge badge-gray font-mono text-xs">{howItWorks.length} steps</span>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              {howItWorks.map((step, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#F7F4EE]/80 dark:bg-[#111116] border border-[#E5DFD5] dark:border-white/[0.08] space-y-2 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-lg font-bold text-[#E85D3F] dark:text-[#F97316]">
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E85D3F]/60 dark:bg-[#F97316]/60" />
                  </div>
                  <p className="text-xs sm:text-sm text-[#141210] dark:text-[#E2E8F0] leading-relaxed">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Errors & Bugs Found */}
          <section id="section-errors" className="card p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base font-bold text-[#141210] dark:text-[#F8FAFC] flex items-center gap-2">
                <Bug
                  size={18}
                  className={errors.length === 0 ? 'text-[#10B981] dark:text-[#34D399]' : 'text-red-500'}
                />
                <span>Errors &amp; Bugs Found</span>
              </h3>
              <span className={errors.length === 0 ? 'badge-green' : 'badge-red'}>
                {errors.length} {errors.length === 1 ? 'issue' : 'issues'}
              </span>
            </div>

            {errors.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#10B981]/10 dark:bg-[#34D399]/10 border border-[#10B981]/25 dark:border-[#34D399]/25 flex items-center gap-3">
                <CheckCircle2 size={20} className="text-[#10B981] dark:text-[#34D399] shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#141210] dark:text-[#F8FAFC]">
                    No syntax or logic errors found!
                  </p>
                  <p className="text-xs text-[#57534E] dark:text-[#94A3B8] mt-0.5">
                    Your logic is clean. Review complexity and call flow on the right to optimize further.
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

          {/* Complete Function & Method Breakdown */}
          <section id="section-functions" className="card p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base font-bold text-[#141210] dark:text-[#F8FAFC] flex items-center gap-2">
                <Boxes size={18} className="text-[#E85D3F] dark:text-[#F97316]" />
                <span>Complete Function Breakdown</span>
              </h3>
              <span className="badge badge-gray font-mono text-xs">
                {functionBreakdown.length} function{functionBreakdown.length !== 1 ? 's' : ''}
              </span>
            </div>

            {functionBreakdown.length === 0 ? (
              <p className="text-sm text-[#57534E] dark:text-[#94A3B8] p-4 rounded-xl bg-[#F7F4EE] dark:bg-[#111116] border border-[#E5DFD5] dark:border-white/[0.06]">
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
        </div>

        {/* RIGHT COLUMN (Time & Space Complexity, Method Call Flow, Practice CTA) */}
        <div className="xl:col-span-5 space-y-6">
          {/* Side-by-Side Time (Mint) & Space (Copper) Complexity Cards */}
          <section id="section-complexity" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-5 space-y-3 border-t-2 border-t-[#10B981] dark:border-t-[#34D399]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#57534E] dark:text-[#94A3B8] flex items-center gap-1.5">
                  <Clock size={14} className="text-[#10B981] dark:text-[#34D399]" /> Time
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#10B981]/10 text-[#059669] dark:bg-[#34D399]/15 dark:text-[#34D399] font-mono text-sm font-bold">
                  {complexity.time}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#57534E] dark:text-[#94A3B8] leading-relaxed">
                {complexity.timeReason}
              </p>
            </div>

            <div className="card p-5 space-y-3 border-t-2 border-t-[#E85D3F] dark:border-t-[#F97316]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#57534E] dark:text-[#94A3B8] flex items-center gap-1.5">
                  <Cpu size={14} className="text-[#E85D3F] dark:text-[#F97316]" /> Space
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#E85D3F]/10 text-[#E85D3F] dark:bg-[#F97316]/15 dark:text-[#F97316] font-mono text-sm font-bold">
                  {complexity.space}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#57534E] dark:text-[#94A3B8] leading-relaxed">
                {complexity.spaceReason}
              </p>
            </div>
          </section>

          {/* Visual Node-Based Method Call Flow Diagram */}
          <section id="section-call-flow" className="card p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-[#141210] dark:text-[#F8FAFC] flex items-center gap-2">
                <GitBranch size={18} className="text-[#10B981] dark:text-[#34D399]" />
                <span>Method Call Flow</span>
              </h3>
              {callGraph.length > 0 && (
                <span className="badge badge-gray font-mono text-xs">
                  {callGraph.length} path{callGraph.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {callGraph.length === 0 ? (
              <p className="text-xs sm:text-sm text-[#57534E] dark:text-[#94A3B8] p-4 rounded-xl bg-[#F7F4EE] dark:bg-[#111116] border border-[#E5DFD5] dark:border-white/[0.06]">
                Single-block script or standalone function — no nested function-to-function calls detected.
              </p>
            ) : (
              <div className="space-y-4">
                {/* Visual Connected Node Flow with Glowing Connector Dots */}
                {callChain.length >= 2 && (
                  <div className="p-4 rounded-xl bg-[#141210] dark:bg-[#0D0D11] border border-white/[0.08] flex items-center gap-2 flex-wrap">
                    {callChain.map((node, i) => (
                      <span key={`${node}-${i}`} className="inline-flex items-center gap-2">
                        <span className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#1C1C26] border border-white/[0.1] font-mono text-xs font-semibold text-white">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              i === 0
                                ? 'bg-[#F97316] shadow-[0_0_8px_#F97316]'
                                : 'bg-[#34D399] shadow-[0_0_8px_#34D399]'
                            }`}
                          />
                          {node}()
                        </span>
                        {i < callChain.length - 1 && (
                          <ArrowRight size={14} className="text-[#94A3B8] shrink-0" />
                        )}
                      </span>
                    ))}
                  </div>
                )}

                <div className="space-y-2.5">
                  {callGraph.map((edge, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#F7F4EE]/80 dark:bg-[#111116] border border-[#E5DFD5] dark:border-white/[0.08] space-y-1.5"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-white dark:bg-[#16161D] border border-[#E5DFD5] dark:border-white/[0.08] font-mono text-xs font-semibold text-[#141210] dark:text-white">
                          {edge.caller}()
                        </span>
                        <ArrowRight size={13} className="text-[#E85D3F] dark:text-[#F97316] shrink-0" />
                        <span className="px-2 py-0.5 rounded bg-[#10B981]/10 dark:bg-[#34D399]/15 border border-[#10B981]/25 dark:border-[#34D399]/30 font-mono text-xs font-semibold text-[#059669] dark:text-[#34D399]">
                          {edge.callee}()
                        </span>
                      </div>
                      <p className="text-xs text-[#57534E] dark:text-[#94A3B8] leading-relaxed">
                        {edge.purpose}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Practice This Topic CTA Card + Concepts */}
          <section className="card p-5 space-y-4 border border-[#E85D3F]/25 dark:border-[#F97316]/30 bg-gradient-to-br from-[#E85D3F]/5 to-transparent dark:from-[#F97316]/10 dark:to-transparent no-print">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[#E85D3F] dark:text-[#F97316] font-bold text-sm">
                <BookOpen size={16} />
                <span>Practice This Topic</span>
              </div>
              <p className="text-xs text-[#57534E] dark:text-[#94A3B8] leading-relaxed">
                Reinforce what you learned with a targeted quiz on{' '}
                <strong className="text-[#141210] dark:text-white">{primaryPracticeTopic}</strong>.
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
                className="btn btn-primary w-full py-2.5 font-semibold gap-2 shadow-sm"
              >
                <span>Practice {primaryPracticeTopic}</span>
                <ArrowRight size={15} />
              </button>
            )}
          </section>

          {/* Security Analysis */}
          {(review.security?.length > 0 || review.securityIssues?.length > 0) && (
            <div className="card p-5 border-l-4 border-l-amber-500 space-y-3">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold text-sm">
                <Shield size={17} />
                <span>Security Considerations ({(review.security || review.securityIssues).length})</span>
              </div>
              <div className="space-y-2">
                {(review.security || review.securityIssues).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-amber-50/70 dark:bg-amber-500/10 rounded-xl text-xs text-amber-950 dark:text-amber-100 space-y-1 border border-amber-200/70 dark:border-amber-500/20"
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
