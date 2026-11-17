// Shared two-panel layout for login + register.
// Left: a small "review" that shows what the product does. Right: the form.
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-[#EEF1F6] text-[#1D2340] font-[IBM_Plex_Sans,system-ui,sans-serif]">
      <aside className="hidden lg:flex flex-col justify-center gap-8 bg-[#1D2340] px-14 text-[#E8EAF3]">
        <h1 className="font-[Bricolage_Grotesque,sans-serif] text-4xl font-bold leading-tight max-w-md">
          Get your code reviewed. Then understand why.
        </h1>
        <pre className="rounded-md bg-[#2A3158] p-5 text-sm leading-relaxed font-[JetBrains_Mono,monospace] overflow-x-auto">
{`for (let i = 0; i <= arr.length; i++) {
  total += arr[i];
}`}
        </pre>
        <p className="max-w-md rounded-md border-l-4 border-[#F2B84B] bg-[#2A3158] p-4 text-sm leading-relaxed">
          Line 1: the loop runs one step too far. <code className="font-[JetBrains_Mono,monospace]">arr[arr.length]</code> is
          undefined, so <code className="font-[JetBrains_Mono,monospace]">total</code> becomes NaN. What should the
          condition be?
        </p>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h2 className="font-[Bricolage_Grotesque,sans-serif] text-3xl font-bold">{title}</h2>
          <p className="mt-1 mb-8 text-[#5B6385]">{subtitle}</p>
          {children}
          <div className="mt-6 text-sm text-[#5B6385]">{footer}</div>
        </div>
      </main>
    </div>
  );
}

export function Field({ label, error, ...props }) {
  return (
    <label className="block mb-4">
      <span className="block mb-1 text-sm font-medium">{label}</span>
      <input
        {...props}
        aria-invalid={!!error}
        className={`w-full rounded-md border bg-white px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[#F2B84B] ${
          error ? 'border-red-600' : 'border-[#C9CEE0]'
        }`}
      />
      {error && <span className="mt-1 block text-sm text-red-700">{error}</span>}
    </label>
  );
}

export const primaryBtn =
  'w-full rounded-md bg-[#1D2340] px-4 py-2.5 font-medium text-white hover:bg-[#2A3158] focus-visible:ring-2 focus-visible:ring-[#F2B84B] disabled:opacity-60';
