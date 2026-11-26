import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor, { DiffEditor } from '@monaco-editor/react';
import {
  Bug, Shield, Zap, BookOpen, Eye, EyeOff,
  Copy, CheckCheck, AlertTriangle, Edit2, Check, X, Code2,
  RefreshCw, ArrowRight, GitCompare, MessageSquareCheck, Sparkles,
} from 'lucide-react';
import ScoreBadge from '../ui/ScoreBadge';
import LoadingSpinner from '../ui/LoadingSpinner';
import {
  formatDate, getLanguageLabel, getLanguageBadgeClass,
  getConceptLevelClass, getSeverityClass, copyToClipboard,
  getMonacoLanguage,
} from '../../utils/helpers';
import { useToast } from '../ui/Toast';
import { useTheme } from '../../context/ThemeContext';

const BugCard = ({ bug, language = 'javascript' }) => {
  const [showSolution, setShowSolution] = useState(false);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const handleCopy = async () => {
    try {
      await copyToClipboard(bug.solution);
      setCopied(true);
      toast({ type: 'success', message: 'Solution copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ type: 'error', message: 'Failed to copy to clipboard' });
    }
  };

  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
      <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/40 border-b border-red-100 dark:border-red-900/50">
        <div className="p-1.5 bg-red-100 dark:bg-red-900/50 rounded-lg shrink-0 mt-0.5">
          <Bug size={14} className="text-red-600 dark:text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 dark:text-slate-100 text-sm">{bug.title}</span>
            {bug.lineNumber > 0 && (
              <span className="bg-gray-800 text-gray-100 text-xs px-2 py-0.5 rounded font-mono">
                Line {bug.lineNumber}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">{bug.description}</p>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">Why it happens</p>
          <p className="text-sm text-gray-700 dark:text-slate-200">{bug.whyItHappens}</p>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/60 rounded-lg">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">💡 Guided Hint</p>
          <p className="text-sm text-blue-800 dark:text-blue-200">{bug.hint}</p>
        </div>
        <div>
          <button
            onClick={() => setShowSolution((p) => !p)}
            className="btn btn-secondary btn-sm gap-1.5"
          >
            {showSolution ? <><EyeOff size={14} /> Hide Solution</> : <><Eye size={14} /> Reveal Solution</>}
          </button>
          {showSolution && (
            <div className="mt-3 border border-gray-800 rounded-lg overflow-hidden bg-gray-900 shadow-sm">
              <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 border-b border-gray-700">
                <span className="text-xs text-green-400 font-mono font-medium">Suggested Fix</span>
                <button onClick={handleCopy} className="btn btn-ghost btn-sm text-gray-400 hover:text-white p-1">
                  {copied ? <CheckCheck size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
              </div>
              <div className="h-44">
                <Editor
                  height="100%"
                  language={getMonacoLanguage(language)}
                  value={bug.solution}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    fontSize: 12,
                    fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    wordWrap: 'on',
                    padding: { top: 8, bottom: 8 },
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
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
  const [codeViewMode, setCodeViewMode] = useState('diff'); // 'diff' | 'original'
  const [renderSideBySide, setRenderSideBySide] = useState(true);
  const [copiedImproved, setCopiedImproved] = useState(false);

  const improvedCode = useMemo(() => synthesizeImprovedCode(review), [review]);
  const hasDiffChanges = Boolean(review?.code && improvedCode && improvedCode !== review.code);
  const improvementNotes = useMemo(() => {
    if (review?.improvementNotes?.length > 0) return review.improvementNotes;
    return (review?.bugs || [])
      .filter((b) => b.lineNumber > 0)
      .map((b) => ({ lineNumber: b.lineNumber, explanation: `${b.title}: ${b.hint}` }));
  }, [review]);

  const hasCriticalErrors =
    review.score < 50 ||
    review.bugs?.some((b) =>
      /syntax error|unclosed|unterminated|unexpected closing|missing colon|division by zero|mismatch|misspelled|without where/i.test(
        b.title || ''
      )
    );

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

  return (
    <div className="space-y-6">
      {/* Fallback Banner + Retry with Gemini */}
      {review.isFallback && (
        <div className="card p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-sm text-amber-900 dark:text-amber-100">
            <Sparkles size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Analyzed using Static Syntax Analyzer</p>
              <p className="text-xs text-amber-800 dark:text-amber-200 mt-0.5">
                {review.fallbackReason || 'Gemini AI was temporarily unavailable during this review.'}
              </p>
            </div>
          </div>
          {onRetryGemini && (
            <button
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

      {/* Critical Errors Banner */}
      {hasCriticalErrors && (
        <div className="card p-4 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800/60 text-red-800 dark:text-red-200 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-red-900 dark:text-red-100">Code Errors Detected — Needs Fix</p>
            <p className="mt-0.5 text-red-700 dark:text-red-200">
              Your submitted {getLanguageLabel(review.language)} code contains syntax or critical errors. Review the error details and hints below to fix them.
            </p>
          </div>
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

      {/* Header card with Score & Editable Title */}
      <div className="card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`badge ${getLanguageBadgeClass(review.language)} font-mono text-xs uppercase`}>
              {getLanguageLabel(review.language)}
            </span>
            <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
            {review.isFallback && (
              <span className="badge badge-yellow text-[11px]">Static Syntax Analyzer</span>
            )}
          </div>

          {editableTitle && editingTitle ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                className="input input-sm font-bold text-gray-900 dark:text-slate-100"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                placeholder="Name this review"
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
            <div className="flex items-center gap-2 mt-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">{review.title || 'Code Review Report'}</h2>
              {editableTitle && (
                <button
                  onClick={() => {
                    setTitleValue(review.title || '');
                    setEditingTitle(true);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                >
                  <Edit2 size={14} />
                </button>
              )}
            </div>
          )}

          <p className="text-sm text-gray-600 dark:text-slate-300 mt-2">{review.summary}</p>
        </div>

        <div className="shrink-0 flex items-center gap-4">
          <ScoreBadge score={review.score} size="lg" />
        </div>
      </div>

      {/* Complexity and Concepts */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold text-sm">
            <Zap size={16} />
            <span>Complexity Analysis</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-transparent dark:border-slate-700">
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Time Complexity</p>
              <p className="text-base font-bold text-gray-900 dark:text-slate-100 font-mono mt-0.5">
                {review.complexity?.time || 'O(1)'}
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-transparent dark:border-slate-700">
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Space Complexity</p>
              <p className="text-base font-bold text-gray-900 dark:text-slate-100 font-mono mt-0.5">
                {review.complexity?.space || 'O(1)'}
              </p>
            </div>
          </div>
          {review.complexity?.explanation && (
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">{review.complexity.explanation}</p>
          )}
        </div>

        {/* Concept tags + Practice This Topic */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold text-sm">
            <BookOpen size={16} />
            <span>Tagged Concepts</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {review.concepts?.length > 0 ? (
              review.concepts.map((c, i) => {
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
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/40 dark:text-primary-300 dark:hover:bg-primary-900/60 transition-colors border border-primary-200 dark:border-primary-700"
                      >
                        Practice This Topic <ArrowRight size={11} />
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <span className="text-xs text-gray-400">No specific concepts tagged</span>
            )}
          </div>
        </div>
      </div>

      {/* Code Quality Breakdown */}
      {review.codeQuality && (
        <div className="card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Code Quality Breakdown</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { key: 'readability', label: 'Readability' },
              { key: 'namingConventions', label: 'Naming' },
              { key: 'codeStructure', label: 'Structure' },
              { key: 'bestPractices', label: 'Best Practices' },
            ].map(({ key, label }) => {
              const metric = review.codeQuality?.[key];
              if (!metric) return null;
              return (
                <div key={key} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600 dark:text-slate-300">{label}</span>
                    <span className="text-xs font-bold text-primary-600 dark:text-primary-400">{metric.score ?? 0}/10</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{metric.comment}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Before vs. Improved Code Diff / Submitted Code */}
      {review.code && (
        <div className="card overflow-hidden">
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

      {/* Bugs & Guided Hints */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
          <Bug size={18} className="text-red-500" />
          <span>Identified Bugs & Pedagogical Hints ({review.bugs?.length || 0})</span>
        </h3>

        {review.bugs?.length === 0 ? (
          <div className="card p-6 text-center text-gray-500 dark:text-slate-400 text-sm">
            🎉 No bugs found! Excellent work.
          </div>
        ) : (
          review.bugs?.map((bug, i) => <BugCard key={i} bug={bug} language={review.language} />)
        )}
      </div>

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
