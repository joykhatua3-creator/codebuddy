import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Code2, Trash2, Send, Radio, Sparkles, CheckCircle2, Clock, Moon, Sun, Maximize2, Minimize2 } from 'lucide-react';
import { reviewService } from '../../services';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getMonacoLanguage, getLanguageLabel } from '../../utils/helpers';
import { useTheme } from '../../context/ThemeContext';

const LANGUAGES = ['javascript', 'python', 'java', 'cpp'];
const MAX_CHARS = 10000;
const MAX_LINES = 300;

const DEFAULT_CODE = {
  javascript: `// Write your JavaScript code here\nfunction greet(name) {\n  console.log("Hello, " + name);\n}\n\ngreet("World");`,
  python: `# Write your Python code here\ndef greet(name):\n    print(f"Hello, {name}")\n\ngreet("World")`,
  java: `// Write your Java code here\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
  cpp: `// Write your C++ code here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
};

export default function CodeReviewPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [editorTheme, setEditorTheme] = useState(isDark ? 'vs-dark' : 'vs-dark'); // VS Code Dark default
  const [fontSize, setFontSize] = useState(14);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(DEFAULT_CODE.javascript);
  const [useStreaming, setUseStreaming] = useState(true);
  const [loading, setLoading] = useState(false);
  const [streamProgress, setStreamProgress] = useState(null);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const lines = code.split('\n').length;
  const chars = code.length;
  const isOverLimit = lines > MAX_LINES || chars > MAX_CHARS;
  const isEmpty = !code.trim();

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang]);
    setError('');
  };

  const handleClear = () => {
    setCode(DEFAULT_CODE[language]);
    setError('');
    setStreamProgress(null);
  };

  const handleSubmit = async () => {
    if (isEmpty || isOverLimit || loading) return;
    setLoading(true);
    setError('');
    setStreamProgress('Starting code analysis...');

    if (useStreaming) {
      try {
        await reviewService.streamReview(
          { language, code },
          {
            onProgress: (info) => {
              setStreamProgress(info.message || 'Analyzing code...');
            },
            onComplete: (data) => {
              const reviewId = data.reviewId || data._id || data.data?._id;
              if (reviewId) {
                navigate(`/dashboard/review/${reviewId}`);
              } else {
                fallbackSubmit();
              }
            },
            onError: (err) => {
              console.warn('Streaming error, falling back to standard submit:', err.message);
              fallbackSubmit();
            },
          }
        );
      } catch (err) {
        fallbackSubmit();
      }
    } else {
      fallbackSubmit();
    }
  };

  const fallbackSubmit = async () => {
    try {
      const res = await reviewService.submit({ language, code });
      const reviewId = res.data?.data?._id || res.data?._id;
      if (reviewId) {
        navigate(`/dashboard/review/${reviewId}`);
      } else {
        setError('Review generated but could not open detail. Please check Review History.');
        setLoading(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit code. Please try again.');
      setLoading(false);
      setStreamProgress(null);
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleSubmit();
    });
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">AI Code Review</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Submit your code in Monaco Editor and get instant, structured AI feedback with guided hints
        </p>
      </div>

      {/* Language selector & Stream mode */}
      <div className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <label className="label">Programming Language</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                  language === lang
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                }`}
              >
                {getLanguageLabel(lang)}
              </button>
            ))}
          </div>
        </div>

        {/* SSE Streaming Toggle */}
        <div className="flex items-center gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-gray-700">
            <input
              type="checkbox"
              checked={useStreaming}
              onChange={(e) => setUseStreaming(e.target.checked)}
              className="rounded text-primary-600 focus:ring-primary-500"
            />
            <span className="flex items-center gap-1">
              <Radio size={14} className={useStreaming ? 'text-primary-600' : 'text-gray-400'} />
              Live Stream (SSE)
            </span>
          </label>
        </div>
      </div>

      {/* Monaco Editor Card */}
      <div className={`card overflow-hidden transition-all duration-200 ${isExpanded ? 'ring-2 ring-primary-500 shadow-xl' : ''}`}>
        {/* Editor Toolbar */}
        <div className={`flex items-center justify-between px-4 py-2.5 border-b ${editorTheme === 'vs-dark' ? 'bg-gray-900 border-gray-800 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
            </div>
            <span className="text-xs font-mono font-medium">
              Monaco Editor • {getLanguageLabel(language)}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {/* Font size picker */}
            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className={`rounded px-2 py-0.5 border text-xs font-mono ${
                editorTheme === 'vs-dark'
                  ? 'bg-gray-800 border-gray-700 text-gray-200'
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
            >
              <option value={12}>12px</option>
              <option value={14}>14px</option>
              <option value={16}>16px</option>
            </select>

            {/* Monaco Theme Switcher (Dark / Light) */}
            <button
              onClick={() => setEditorTheme((p) => (p === 'vs-dark' ? 'vs-light' : 'vs-dark'))}
              title={`Switch to ${editorTheme === 'vs-dark' ? 'VS Light' : 'VS Dark'} theme`}
              className={`flex items-center gap-1 px-2.5 py-1 rounded border transition-colors ${
                editorTheme === 'vs-dark'
                  ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-yellow-400'
                  : 'bg-white border-gray-300 hover:bg-gray-100 text-gray-700'
              }`}
            >
              {editorTheme === 'vs-dark' ? <Sun size={13} /> : <Moon size={13} />}
              <span className="font-mono text-[11px]">{editorTheme === 'vs-dark' ? 'Dark' : 'Light'}</span>
            </button>

            {/* Expand / Minimize Height */}
            <button
              onClick={() => setIsExpanded((p) => !p)}
              title={isExpanded ? 'Shrink Editor' : 'Expand Editor'}
              className="p-1 rounded hover:opacity-80 transition-opacity"
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            {/* Character & Line Counters */}
            <span className={`font-mono ${lines > MAX_LINES ? 'text-red-500 font-bold' : ''}`}>
              {lines}/{MAX_LINES}L
            </span>
            <span className={`font-mono ${chars > MAX_CHARS ? 'text-red-500 font-bold' : ''}`}>
              {chars}/{MAX_CHARS}C
            </span>
          </div>
        </div>

        {/* Monaco Editor Container */}
        <div className={`w-full transition-all duration-200 ${isExpanded ? 'h-[550px]' : 'h-96'}`}>
          <Editor
            height="100%"
            language={getMonacoLanguage(language)}
            value={code}
            onChange={(val) => setCode(val || '')}
            onMount={handleEditorDidMount}
            theme={editorTheme}
            loading={
              <div className={`flex flex-col items-center justify-center h-full space-y-2 ${editorTheme === 'vs-dark' ? 'bg-gray-900 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                <LoadingSpinner size="md" />
                <span className="text-xs font-mono">Loading Monaco Editor...</span>
              </div>
            }
            options={{
              fontSize,
              fontFamily: "'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace",
              fontLigatures: true,
              minimap: { enabled: isExpanded },
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              tabSize: 2,
              wordWrap: 'on',
              automaticLayout: true,
              bracketPairColorization: { enabled: true },
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              formatOnPaste: true,
              formatOnType: true,
              padding: { top: 12, bottom: 12 },
              renderLineHighlight: 'all',
            }}
          />
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={handleClear}
              disabled={loading}
              className="btn btn-secondary btn-sm gap-1.5 text-gray-600"
            >
              <Trash2 size={14} /> Clear Code
            </button>
            <span className="text-[11px] text-gray-400 font-mono hidden sm:inline">
              Shortcut: <kbd className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-[10px]">Enter</kbd> to submit
            </span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isEmpty || isOverLimit || loading}
            className="btn btn-primary gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Reviewing...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Submit for AI Review</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Streaming / Loading Progress Banner */}
      {loading && (
        <div className="card p-4 bg-primary-50 border border-primary-200 flex items-center gap-3 animate-pulse">
          <LoadingSpinner size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary-900">
              {streamProgress || 'Gemini AI is analyzing code structure and identifying bugs...'}
            </p>
            <p className="text-xs text-primary-700 mt-0.5">
              Evaluating syntax, time/space complexity, security issues, and pedagogical hints.
            </p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="card p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

