import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Code2, Trash2, Send, Radio, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { reviewService } from '../../services';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getMonacoLanguage, getLanguageLabel } from '../../utils/helpers';

const LANGUAGES = ['javascript', 'python', 'java', 'cpp'];
const MAX_CHARS = 10000;
const MAX_LINES = 300;

const DEFAULT_CODE = {
  javascript: `// Write your JavaScript code here\nfunction greet(name) {\n  console.log("Hello, " + name)\n}\n\ngreet("World")`,
  python: `# Write your Python code here\ndef greet(name):\n    print(f"Hello, {name}")\n\ngreet("World")`,
  java: `// Write your Java code here\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
  cpp: `// Write your C++ code here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
};

export default function CodeReviewPage() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(DEFAULT_CODE.javascript);
  const [useStreaming, setUseStreaming] = useState(true);
  const [loading, setLoading] = useState(false);
  const [streamProgress, setStreamProgress] = useState(null);
  const [error, setError] = useState('');

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
              navigate(`/dashboard/review/${data.reviewId}`);
            },
            onError: (err) => {
              setError(err.message || 'Streaming failed. Trying fallback...');
              // Fallback to standard HTTP submission
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
      navigate(`/dashboard/review/${res.data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit code. Please try again.');
      setLoading(false);
      setStreamProgress(null);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">AI Code Review</h2>
        <p className="text-sm text-gray-500 mt-0.5">Submit your code and get instant, structured AI feedback with guided hints</p>
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

      {/* Editor */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <span className="text-xs text-gray-500 font-mono ml-2">
              {getLanguageLabel(language)}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400 font-mono">
            <span className={lines > MAX_LINES ? 'text-red-500 font-semibold' : ''}>
              Lines: {lines}/{MAX_LINES}
            </span>
            <span className={chars > MAX_CHARS ? 'text-red-500 font-semibold' : ''}>
              Chars: {chars}/{MAX_CHARS}
            </span>
          </div>
        </div>

        <div className="h-96">
          <Editor
            height="100%"
            language={getMonacoLanguage(language)}
            value={code}
            onChange={(val) => setCode(val || '')}
            theme="vs-light"
            options={{
              fontSize: 13,
              fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              tabSize: 2,
              wordWrap: 'on',
            }}
          />
        </div>

        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
          <button
            onClick={handleClear}
            disabled={loading}
            className="btn btn-secondary btn-sm gap-1.5 text-gray-600"
          >
            <Trash2 size={14} /> Clear Code
          </button>
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
