import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { deleteReview, getReview } from '../services/reviewService';
import ReviewResult from '../components/ReviewResult';

export default function ReviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [error, setError] = useState('');
  const editorRef = useRef(null);

  useEffect(() => {
    getReview(id).then(setReview).catch((e) => setError(e.response?.data?.message || 'Could not load review'));
  }, [id]);

  const onMount = (editor, monaco) => {
    editorRef.current = editor;
    // Highlight every line that has a bug
    editor.createDecorationsCollection(
      review.result.bugs
        .filter((b) => b.line > 0)
        .map((b) => ({
          range: new monaco.Range(b.line, 1, b.line, 1),
          options: { isWholeLine: true, className: 'bug-line' },
        }))
    );
  };

  const jump = (line) => {
    editorRef.current?.revealLineInCenter(line);
    editorRef.current?.setPosition({ lineNumber: line, column: 1 });
    editorRef.current?.focus();
  };

  const remove = async () => {
    if (!window.confirm('Delete this review?')) return;
    await deleteReview(id);
    navigate('/dashboard');
  };

  if (error) return <p role="alert" className="text-red-800">{error} <Link to="/dashboard" className="underline">Back</Link></p>;
  if (!review) return <p className="text-[#5B6385]">Loading review…</p>;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <h1 className="font-[Bricolage_Grotesque,sans-serif] text-2xl font-bold">Review</h1>
        <span className="rounded bg-[#DDE1EE] px-2 py-0.5 text-sm">{review.language}</span>
        <span className="text-sm text-[#5B6385]">{new Date(review.createdAt).toLocaleString()}</span>
        <button onClick={remove} className="ml-auto text-sm text-red-800 underline">Delete</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-md border border-[#C9CEE0] self-start">
          <Editor
            height="480px"
            language={review.language}
            value={review.code}
            theme="vs-dark"
            onMount={onMount}
            options={{ readOnly: true, minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false }}
          />
        </div>
        <ReviewResult result={review.result} onJump={jump} />
      </div>
    </div>
  );
}
