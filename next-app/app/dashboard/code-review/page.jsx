'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Code2, Trash2, Send, AlertCircle } from 'lucide-react';
import { reviewService } from '@/lib/clientApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getMonacoLanguage, getLanguageLabel } from '@/lib/helpers';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

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
  const router = useRouter();
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(DEFAULT_CODE.javascript);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lines = code ? code.split('\n').length : 0;
  const chars = code ? code.length : 0;
  const isOverLimit = lines > MAX_LINES || chars > MAX_CHARS;
  const isEmpty = !code || !code.trim();

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
      router.push(`/dashboard/history/${res.data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit code. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-gray-900">AI Code Review</h2>
        <p className="text-sm text-gray-500 mt-0.5">Submit your code and get instant AI-powered feedback with hints</p>
      </div>

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
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on',
            }}
          />
        </div>

        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClear}
            disabled={loading}
            className="btn btn-secondary btn-sm gap-1 text-gray-600"
          >
            <Trash2 size={14} /> Reset Code
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading || isEmpty || isOverLimit}
            className="btn btn-primary btn-md gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" /> Analyzing Code...
              </>
            ) : (
              <>
                <Send size={15} /> Review My Code
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
