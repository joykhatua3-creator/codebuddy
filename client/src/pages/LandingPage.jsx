import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  FileDown,
  Sparkles,
  Terminal,
  Layers,
  Code2,
  Menu,
  X,
} from 'lucide-react';
import AuroraBackdrop from '../components/ui/AuroraBackdrop';

export default function LandingPage() {
  const [previewMode, setPreviewMode] = useState('optimized');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen text-slate-900 flex flex-col overflow-x-hidden selection:bg-cyan-400/25 selection:text-slate-900">
      {/* Always-Light Fixed Pastel Aurora Backdrop */}
      <AuroraBackdrop forceLight />

      {/* Outer Sticky Header Wrapper — Strictly Transparent (NO opaque bar behind pill) */}
      <header className="sticky top-0 z-40 px-3 sm:px-6 pt-3 sm:pt-4 bg-transparent border-none shadow-none">
        <nav className="max-w-4xl mx-auto rounded-full bg-white/75 backdrop-blur-2xl border border-white/85 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] px-3.5 sm:px-6 py-2 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-sm">
              &lt;/&gt;
            </span>
            <span className="font-bold text-sm sm:text-base tracking-tight bg-gradient-to-r from-slate-900 to-indigo-700 bg-clip-text text-transparent">
              CodeBuddy
            </span>
          </Link>

          {/* Desktop Center Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">
              Features
            </a>
            <a href="#roadmap-tile" className="hover:text-slate-900 transition-colors">
              Roadmap
            </a>
            <Link to="/login" className="hover:text-slate-900 transition-colors">
              Sign In
            </Link>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold shadow-[0_6px_18px_-4px_rgba(14,165,233,0.45),inset_0_1px_0_0_rgba(255,255,255,0.4)] transition-all whitespace-nowrap"
            >
              <span>Start Free</span>
              <ArrowRight size={14} />
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((p) => !p)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/80 border border-slate-200/80 text-slate-700 hover:bg-white transition-colors"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden max-w-4xl mx-auto mt-2 rounded-2xl bg-white/90 backdrop-blur-2xl border border-white/90 shadow-lg p-3 space-y-1">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center min-h-[44px] px-4 rounded-xl text-sm font-medium text-slate-800 hover:bg-cyan-500/10"
            >
              Features
            </a>
            <a
              href="#roadmap-tile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center min-h-[44px] px-4 rounded-xl text-sm font-medium text-slate-800 hover:bg-cyan-500/10"
            >
              Roadmap
            </a>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center min-h-[44px] px-4 rounded-xl text-sm font-medium text-slate-800 hover:bg-cyan-500/10"
            >
              Sign In
            </Link>
          </div>
        )}
      </header>

      {/* Two-Column Hero */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14 lg:pt-18 lg:pb-22">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column */}
            <div className="space-y-5 min-w-0">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-xl border border-white/90 shadow-xs text-xs font-medium text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />
                <span>Powered by Gemini 3.8 Flash</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                Write cleaner code.{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent block sm:inline">
                  Understand the why.
                </span>
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-lg leading-relaxed">
                Submit any snippet for instant AI code reviews, plain-English walkthroughs, and adaptive practice quizzes inside a calm liquid-glass workspace.
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white px-7 py-3.5 min-h-[44px] text-sm sm:text-base font-semibold shadow-[0_10px_26px_-6px_rgba(14,165,233,0.5),inset_0_1px_0_0_rgba(255,255,255,0.4)] transition-all"
                >
                  <span>Start Free</span>
                  <ArrowRight size={17} />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white/80 backdrop-blur-xl border border-white/90 hover:border-cyan-400/60 text-slate-800 px-7 py-3.5 min-h-[44px] text-sm sm:text-base font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.85),0_4px_14px_rgba(15,23,42,0.06)] hover:shadow-[0_0_20px_rgba(56,189,248,0.2)] transition-all"
                >
                  Sign In
                </Link>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-500" /> 30+ Languages
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-cyan-500" /> 6-Part PDF Notes
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-indigo-500" /> Free for Students
                </span>
              </div>
            </div>

            {/* Right Column: Sculpted Translucent Glass Window */}
            <div className="space-y-4 min-w-0">
              <div className="p-2.5 sm:p-3 rounded-3xl bg-white/65 backdrop-blur-2xl border border-white/85 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.14),inset_0_1px_0_0_rgba(255,255,255,0.85)]">
                <div className="rounded-2xl bg-[#0B1120] text-slate-100 border border-white/10 overflow-hidden shadow-lg">
                  {/* Window Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 sm:px-4 py-2.5 bg-white/[0.04] border-b border-white/10">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                      <span className="ml-1.5 font-mono text-[11px] sm:text-xs text-slate-400 truncate">
                        find_duplicates.py
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setPreviewMode((prev) => (prev === 'optimized' ? 'original' : 'optimized'))
                      }
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold bg-emerald-400/15 border border-emerald-400/40 text-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.2)] hover:bg-emerald-400/25 transition-all shrink-0"
                      title="Toggle between original and optimized code"
                    >
                      <span>O(n²) → O(n) Optimized</span>
                    </button>
                  </div>

                  {/* Code Snippet (Scrolls Internally) */}
                  <div className="p-3.5 sm:p-5 font-mono text-[11px] sm:text-[13px] leading-relaxed overflow-x-auto max-w-full">
                    {previewMode === 'original' ? (
                      <pre className="text-slate-300">
                        <code>
                          <span className="text-slate-500">1 </span>
                          <span className="text-cyan-400">def</span> find_duplicates(items):{'\n'}
                          <span className="text-slate-500">2 </span>
                          {'  '}dups = []{'\n'}
                          <span className="text-slate-500">3 </span>
                          <span className="bg-rose-500/15 text-rose-300 block px-1 -mx-1 rounded">
                            {'  '}for i in range(len(items)):         # O(n²) nested loop
                          </span>
                          <span className="text-slate-500">4 </span>
                          <span className="bg-rose-500/15 text-rose-300 block px-1 -mx-1 rounded">
                            {'    '}for j in range(len(items)):       # Missing i != j check
                          </span>
                          <span className="text-slate-500">5 </span>
                          {'      '}if items[i] == items[j]: dups.append(items[i]){'\n'}
                          <span className="text-slate-500">6 </span>
                          {'  '}return dups
                        </code>
                      </pre>
                    ) : (
                      <pre className="text-slate-200">
                        <code>
                          <span className="text-slate-500">1 </span>
                          <span className="text-cyan-400">def</span> find_duplicates(items):{'\n'}
                          <span className="text-slate-500">2 </span>
                          <span className="bg-emerald-500/15 text-emerald-300 block px-1 -mx-1 rounded">
                            {'  '}seen, dups = set(), set()         # O(1) hash lookup
                          </span>
                          <span className="text-slate-500">3 </span>
                          {'  '}for item in items:{'\n'}
                          <span className="text-slate-500">4 </span>
                          <span className="bg-emerald-500/15 text-emerald-300 block px-1 -mx-1 rounded">
                            {'    '}if item in seen: dups.add(item) # Single linear pass
                          </span>
                          <span className="text-slate-500">5 </span>
                          {'    '}seen.add(item){'\n'}
                          <span className="text-slate-500">6 </span>
                          {'  '}return list(dups)
                        </code>
                      </pre>
                    )}
                  </div>
                </div>

                {/* Floating Glass Explanation */}
                <div className="mt-3 p-3.5 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/95 flex items-start gap-3 shadow-xs">
                  <div className="p-1.5 rounded-xl bg-gradient-to-br from-cyan-500/15 to-indigo-500/15 text-indigo-600 shrink-0 mt-0.5">
                    <Sparkles size={15} />
                  </div>
                  <div className="text-xs leading-relaxed">
                    <p className="font-semibold text-slate-900">Plain-English Review</p>
                    <p className="text-slate-600 mt-0.5">
                      {previewMode === 'original'
                        ? 'Every element compares against itself (i == j) and rescans the entire list in O(n²) time.'
                        : 'Tracking seen items in a hash set checks membership in O(1), cutting runtime to linear O(n).'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Call-Flow Pill Nodes */}
              <div className="px-3 sm:px-4 py-2.5 rounded-full bg-white/75 backdrop-blur-xl border border-white/85 shadow-xs flex items-center justify-between gap-1.5 text-[11px] sm:text-xs font-mono overflow-x-auto no-scrollbar">
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  Input
                </span>
                <ArrowRight size={13} className="text-slate-400 shrink-0" />
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-400/30 font-semibold text-indigo-700 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  Hash Set
                </span>
                <ArrowRight size={13} className="text-slate-400 shrink-0" />
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 font-semibold text-emerald-700 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  O(n) Output
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Equal-Height 3-Tile Liquid Glass Bento Grid */}
        <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="inline-block font-mono text-xs uppercase tracking-widest text-indigo-600 font-semibold">
              Liquid Glass Learning Suite
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
              Three tools. One lucid workflow.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {/* Tile 1: 6-Part Study Notes PDF */}
            <div className="rounded-2xl bg-white/70 backdrop-blur-2xl border border-white/85 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.08),inset_0_1px_0_0_rgba(255,255,255,0.75)] p-5 sm:p-6 flex flex-col justify-between gap-5">
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-700 text-xs font-semibold">
                  <FileDown size={13} /> 1-Click PDF Export
                </div>
                <h3 className="text-lg font-bold text-slate-900">6-Part Study Notes PDF</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Every review turns into a clean printable handbook with errors, walkthrough steps, complexity, call flow, and function breakdowns.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/80 border border-white/95 grid grid-cols-2 gap-2 text-xs">
                {[
                  ['01', 'Errors & Fixes'],
                  ['02', 'Walkthrough'],
                  ['03', 'Big-O Analysis'],
                  ['04', 'Call Flow'],
                ].map(([num, title]) => (
                  <div key={num} className="p-2 rounded-lg bg-slate-50/90 border border-slate-200/70">
                    <span className="font-mono text-[10px] font-bold text-cyan-600">{num}.</span>
                    <p className="font-semibold text-slate-800 truncate">{title}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tile 2: Skill Mastery Paths */}
            <div
              id="roadmap-tile"
              className="rounded-2xl bg-white/70 backdrop-blur-2xl border border-white/85 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.08),inset_0_1px_0_0_rgba(255,255,255,0.75)] p-5 sm:p-6 flex flex-col justify-between gap-5"
            >
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-700 text-xs font-semibold">
                  <Layers size={13} /> Tailored Curriculum
                </div>
                <h3 className="text-lg font-bold text-slate-900">Skill Mastery Paths</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Generate a structured roadmap for Python, DSA, React, or SQL with checkable milestones and hands-on coding tasks.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0B1120] text-white space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>ROADMAP</span>
                  <span className="text-emerald-400">2 / 3 DONE</span>
                </div>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="px-2 py-1 rounded-full bg-emerald-400/20 text-emerald-300 font-mono text-[11px] font-semibold">
                    ✓ Python
                  </span>
                  <span className="h-px flex-1 bg-white/20" />
                  <span className="px-2 py-1 rounded-full bg-cyan-400/20 border border-cyan-400/40 text-cyan-200 font-mono text-[11px] font-semibold">
                    DSA
                  </span>
                  <span className="h-px flex-1 bg-white/20" />
                  <span className="px-2 py-1 rounded-full bg-white/10 text-slate-400 font-mono text-[11px]">
                    Async
                  </span>
                </div>
              </div>
            </div>

            {/* Tile 3: Adaptive Code Quizzes */}
            <div className="rounded-2xl bg-white/70 backdrop-blur-2xl border border-white/85 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.08),inset_0_1px_0_0_rgba(255,255,255,0.75)] p-5 sm:p-6 flex flex-col justify-between gap-5">
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-700 text-xs font-semibold">
                  <Code2 size={13} /> Practice Arena
                </div>
                <h3 className="text-lg font-bold text-slate-900">Adaptive Code Quizzes</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Drill output prediction and Big-O trade-offs scaled from 5 Beginner questions up to 15 Advanced challenges.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/80 border border-white/95 space-y-2 text-xs">
                <div className="p-2 rounded-lg bg-[#0B1120] font-mono text-[11px] text-emerald-300 flex items-center gap-1.5 overflow-x-auto">
                  <Terminal size={12} className="text-cyan-400 shrink-0" />
                  <span>print(0.1 + 0.2 == 0.3)</span>
                </div>
                <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 font-semibold">
                    Beginner 5Q
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-700 font-semibold">
                    Intermediate 10Q
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 font-semibold">
                    Advanced 15Q
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-white/80 bg-white/50 backdrop-blur-xl py-7 px-4 sm:px-6 text-sm text-slate-600">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="font-medium">© 2026 CodeBuddy · AI Code Review &amp; Learning Platform</p>
          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-6 font-medium">
            <a href="#features" className="hover:text-slate-900 transition-colors py-1">
              Features
            </a>
            <Link to="/login" className="hover:text-slate-900 transition-colors py-1">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-slate-900 transition-colors py-1">
              Get Started
            </Link>
            <a
              href="https://github.com/joykhatua3-creator/codebuddy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 transition-colors py-1"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
