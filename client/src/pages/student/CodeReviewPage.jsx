import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Code2, Trash2, Send, AlertCircle, CheckCircle } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
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
  };

  const handleSubmit = async () => {
    if (isEmpty || isOverLimit || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await reviewService.submit({ language, code });
      navigate(`/dashboard/review/${res.data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit code. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">AI Code Review</h2>
        <p className="text-sm text-gray-500 mt-0.5">Submit your code and get instant AI-powered feedback</p>
      </div>

      {/* Language selector */}
      <div className="card p-4">
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
              Chars: {chars.toLocaleString()}/{MAX_CHARS.toLocaleString()}
            </span>
          </div>
        </div>

        <Editor
          height="420px"
          language={getMonacoLanguage(language)}
          value={code}
          onChange={(val) => { setCode(val || ''); setError(''); }}
          theme="vs-light"
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            wordWrap: 'on',
            padding: { top: 12 },
            suggestOnTriggerCharacters: true,
            tabSize: 2,
          }}
        />
      </div>

      {/* Warnings */}
      {isOverLimit && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          {lines > MAX_LINES
            ? `Code exceeds ${MAX_LINES} lines limit (currently ${lines} lines)`
            : `Code exceeds ${MAX_CHARS.toLocaleString()} character limit`}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} className="shrink-0" />{error}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center">
        <button onClick={handleClear} className="btn btn-secondary gap-2" disabled={loading}>
          <Trash2 size={16} /> Clear Code
        </button>
        <button
          onClick={handleSubmit}
          disabled={isEmpty || isOverLimit || loading}
          className="btn btn-primary btn-lg gap-2"
        >
          {loading ? (
            <><LoadingSpinner size="sm" /> Analyzing with AI...</>
          ) : (
            <><Send size={16} /> Submit for Review</>
          )}
        </button>
      </div>

      {/* Loading overlay message */}
      {loading && (
        <div className="card p-6 text-center space-y-3">
          <LoadingSpinner size="lg" className="mx-auto" />
          <p className="font-medium text-gray-700">AI is reviewing your code...</p>
          <p className="text-sm text-gray-500">This usually takes 10–20 seconds. Please wait.</p>
        </div>
      )}
    </div>
  );
}
