import { useState } from 'react';

const SEVERITY = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-amber-100 text-amber-900',
  low: 'bg-slate-200 text-slate-700',
};

// Hint -> explanation -> fix, revealed one step at a time so the student tries first
function BugCard({ bug, onJump }) {
  const [step, setStep] = useState(0); // 0 hint only, 1 + explanation, 2 + fix

  return (
    <li className="rounded-md border border-[#C9CEE0] bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${SEVERITY[bug.severity]}`}>{bug.severity}</span>
        <h3 className="font-medium">{bug.title}</h3>
        {bug.line > 0 && (
          <button onClick={() => onJump(bug.line)} className="ml-auto text-sm underline">
            Go to line {bug.line}
          </button>
        )}
      </div>

      <p className="mt-2"><span className="font-medium">Hint:</span> {bug.hint}</p>

      {step >= 1 && <p className="mt-2"><span className="font-medium">What's wrong:</span> {bug.explanation}</p>}
      {step >= 2 && (
        <p className="mt-2 whitespace-pre-wrap rounded-md bg-[#EEF1F6] p-3 font-[JetBrains_Mono,monospace] text-sm">
          {bug.fix}
        </p>
      )}

      {step < 2 && (
        <button
          onClick={() => setStep(step + 1)}
          className="mt-3 rounded-md border border-[#C9CEE0] px-3 py-1 text-sm hover:bg-[#EEF1F6]"
        >
          {step === 0 ? 'Show what is wrong' : 'Show the fix'}
        </button>
      )}
    </li>
  );
}

const List = ({ title, items }) =>
  items?.length ? (
    <section className="mt-6">
      <h2 className="mb-2 font-[Bricolage_Grotesque,sans-serif] text-lg font-bold">{title}</h2>
      <ul className="list-disc space-y-1 pl-5">
        {items.map((t, i) => <li key={i}>{t}</li>)}
      </ul>
    </section>
  ) : null;

export default function ReviewResult({ result, onJump }) {
  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#1D2340] text-xl font-bold text-white">
          {result.score}
        </div>
        <p className="leading-relaxed">{result.summary}</p>
      </div>

      {result.complexity && <p className="mt-3 text-sm text-[#5B6385]">Complexity: {result.complexity}</p>}

      <section className="mt-6">
        <h2 className="mb-2 font-[Bricolage_Grotesque,sans-serif] text-lg font-bold">
          {result.bugs.length ? `Bugs found (${result.bugs.length})` : 'No bugs found'}
        </h2>
        <ul className="space-y-3">
          {result.bugs.map((b, i) => <BugCard key={i} bug={b} onJump={onJump} />)}
        </ul>
      </section>

      <List title="Done well" items={result.positives} />
      <List title="Suggestions" items={result.suggestions} />

      {result.weakTopics?.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 font-[Bricolage_Grotesque,sans-serif] text-lg font-bold">Topics to practise</h2>
          <div className="flex flex-wrap gap-2">
            {result.weakTopics.map((t) => (
              <span key={t} className="rounded-full bg-[#F2B84B] px-3 py-1 text-sm font-medium text-[#1D2340]">{t}</span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
