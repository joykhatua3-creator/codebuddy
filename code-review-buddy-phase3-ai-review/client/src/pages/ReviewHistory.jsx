import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listReviews } from '../services/reviewService';

export default function ReviewHistory() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    listReviews(page).then(setData).catch(() => setError('Could not load your reviews'));
  }, [page]);

  if (error) return <p role="alert" className="text-red-800">{error}</p>;
  if (!data) return <p className="text-[#5B6385]">Loading…</p>;

  return (
    <div>
      <div className="mb-4 flex items-center">
        <h1 className="font-[Bricolage_Grotesque,sans-serif] text-2xl font-bold">My reviews</h1>
        <Link to="/reviews/new" className="ml-auto rounded-md bg-[#1D2340] px-4 py-2 text-sm font-medium text-white">
          New review
        </Link>
      </div>

      {data.reviews.length === 0 ? (
        <p className="rounded-md border border-dashed border-[#C9CEE0] p-8 text-center text-[#5B6385]">
          No reviews yet. <Link to="/reviews/new" className="underline">Submit your first piece of code.</Link>
        </p>
      ) : (
        <ul className="space-y-3">
          {data.reviews.map((r) => (
            <li key={r._id}>
              <Link to={`/reviews/${r._id}`} className="flex items-center gap-4 rounded-md border border-[#C9CEE0] bg-white p-4 hover:border-[#1D2340]">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1D2340] font-bold text-white">
                  {r.result.score}
                </span>
                <div className="min-w-0">
                  <p className="truncate">{r.result.summary}</p>
                  <p className="text-sm text-[#5B6385]">
                    {r.language} · {r.result.bugs.length} bug{r.result.bugs.length === 1 ? '' : 's'} ·{' '}
                    {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {data.pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-md border border-[#C9CEE0] px-3 py-1 disabled:opacity-40">Previous</button>
          <span>Page {data.page} of {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="rounded-md border border-[#C9CEE0] px-3 py-1 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
