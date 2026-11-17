import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { createReview } from '../services/reviewService';

const LANGUAGES = [
  ['javascript', 'JavaScript'],
  ['typescript', 'TypeScript'],
  ['python', 'Python'],
  ['java', 'Java'],
  ['c', 'C'],
  ['cpp', 'C++'],
  ['csharp', 'C#'],
  ['go', 'Go'],
];

const STARTER = `// Paste or write your code here\n`;

export default function NewReview() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(STARTER);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      const review = await createReview({ language, code });
      navigate(`/reviews/${review._id}`);
    } catch (err) {
      const data = err.response?.data;
      setError(data?.errors?.code || data?.errors?.language || data?.message || 'Could not reach the server');
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="font-[Bricolage_Grotesque,sans-serif] text-2xl font-bold">New review</h1>
      <p className="mb-4 mt-1 text-[#5B6385]">Paste your code. You'll get hints first, and full answers only when you ask.</p>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium" htmlFor="lang">Language</label>
        <select
          id="lang"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-md border border-[#C9CEE0] bg-white px-3 py-1.5"
        >
          {LANGUAGES.map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
        <span className="ml-auto text-sm text-[#5B6385]">{code.length.toLocaleString()} / 10,000 characters</span>
      </div>

      <div className="overflow-hidden rounded-md border border-[#C9CEE0]">
        <Editor
          height="420px"
          language={language}
          value={code}
          onChange={(v) => setCode(v ?? '')}
          theme="vs-dark"
          options={{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false, tabSize: 2 }}
        />
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}

      <button
        onClick={submit}
        disabled={loading}
        className="mt-4 rounded-md bg-[#1D2340] px-5 py-2.5 font-medium text-white hover:bg-[#2A3158] focus-visible:ring-2 focus-visible:ring-[#F2B84B] disabled:opacity-60"
      >
        {loading ? 'Reviewing your code… this takes up to 30 seconds' : 'Review my code'}
      </button>
    </div>
  );
}
