import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  FileDown,
  Sparkles,
  Terminal,
  BookOpen,
  Layers,
  Code2,
} from 'lucide-react';

export default function LandingPage() {
  const [previewMode, setPreviewMode] = useState('optimized');

  return (
    <div className="min-h-screen bg-[#F7F4EE] text-[#141210] bg-dot-grid flex flex-col selection:bg-[#E85D3F]/20 selection:text-[#141210]">
      {/* Floating Pill Navbar */}
      <header className="sticky top-4 z-40 px-4 sm:px-6 pt-4">
        <nav className="max-w-4xl mx-auto rounded-full bg-white/85 backdrop-blur-md border border-[#E5DFD5] shadow-sm px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <span className="font-mono text-sm font-bold px-2 py-1 rounded-lg bg-[#141210] text-[#F97316] group-hover:bg-[#E85D3F] group-hover:text-white transition-colors">
              &lt;/&gt;
            </span>
            <span className="font-semibold text-sm sm:text-base tracking-tight text-[#141210]">
              CodeBuddy
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-[#57534E]">
            <a href="#features" className="hover:text-[#141210] transition-colors">
              Features
            </a>
            <a href="#roadmap-tile" className="hover:text-[#141210] transition-colors">
              Roadmap
            </a>
            <Link to="/login" className="hover:text-[#141210] transition-colors">
              Sign In
            </Link>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/login"
              className="sm:hidden text-xs font-medium text-[#57534E] hover:text-[#141210] px-2 py-1.5"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#141210] text-[#F7F4EE] hover:bg-[#2A2622] px-4 py-2 text-xs sm:text-sm font-medium transition-all shadow-sm"
            >
              <span>Start Free</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </nav>
      </header>

      {/* Asymmetric Two-Column Hero */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 pt-14 pb-20 lg:pt-20 lg:pb-28">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            {/* Left Column: Editorial Headline + Tactile CTAs */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E5DFD5] text-xs font-medium text-[#57534E] shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span>Powered by Gemini 3.8 Flash · Built for Learners</span>
              </div>

              <h1 className="font-serif text-5xl sm:text-6xl lg:text-[64px] leading-[1.04] tracking-tight text-[#141210] font-normal">
                Write cleaner code.{' '}
                <span className="italic text-[#E85D3F] block sm:inline">
                  Understand the why.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#57534E] max-w-lg leading-relaxed">
                Paste any snippet and get an editorial-grade code review, plain-English execution walkthroughs, and adaptive practice—without the jargon.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#E85D3F] hover:bg-[#d54f32] text-white px-6 py-3.5 text-sm sm:text-base font-semibold shadow-sm hover:shadow-md transition-all"
                >
                  <span>Start Free</span>
                  <ArrowRight size={17} />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/80 hover:bg-white text-[#141210] border border-[#E5DFD5] px-6 py-3.5 text-sm sm:text-base font-medium transition-all"
                >
                  Sign In
                </Link>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-[#57534E]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-[#10B981]" /> 30+ Languages
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-[#10B981]" /> 6-Part PDF Study Notes
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-[#10B981]" /> 100% Free for Students
                </span>
              </div>
            </div>

            {/* Right Column: Floating Matte-Black Interactive Code Preview Card */}
            <div className="lg:col-span-6 relative">
              <div className="rounded-2xl bg-[#141210] text-[#F8FAFC] border border-black/20 shadow-2xl overflow-hidden">
                {/* Card Window Header */}
                <div className="flex items-center justify-between gap-2 px-4 py-3 bg-[#1C1917] border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E85D3F]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#34D399]" />
                    <span className="ml-2 font-mono text-xs text-[#94A3B8]">two_sum_check.py</span>
                  </div>

                  {/* Copper-to-Mint Optimization Pill */}
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewMode((prev) => (prev === 'optimized' ? 'original' : 'optimized'))
                    }
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-gradient-to-r from-[#F97316]/20 to-[#34D399]/20 border border-[#34D399]/40 text-[#34D399] hover:brightness-110 transition-all"
                    title="Toggle between original and optimized code"
                  >
                    <span>O(n²) → O(n) Optimization</span>
                  </button>
                </div>

                {/* Interactive Code Snippet */}
                <div className="p-5 font-mono text-xs sm:text-[13px] leading-relaxed overflow-x-auto">
                  {previewMode === 'original' ? (
                    <pre className="text-slate-300">
                      <code>
                        <span className="text-slate-500">1 </span>
                        <span className="text-orange-400">def</span> has_pair(nums, target):{'\n'}
                        <span className="text-slate-500">2 </span>
                        <span className="bg-red-500/15 text-red-300 block px-1 -mx-1 rounded">
                          {'  '}for i in range(len(nums)):        # O(n²) nested scan
                        </span>
                        <span className="text-slate-500">3 </span>
                        <span className="bg-red-500/15 text-red-300 block px-1 -mx-1 rounded">
                          {'    '}for j in range(len(nums)):      # Missing i != j guard!
                        </span>
                        <span className="text-slate-500">4 </span>
                        {'      '}if nums[i] + nums[j] == target:{'\n'}
                        <span className="text-slate-500">5 </span>
                        {'        '}return True{'\n'}
                        <span className="text-slate-500">6 </span>
                        {'  '}return False
                      </code>
                    </pre>
                  ) : (
                    <pre className="text-slate-200">
                      <code>
                        <span className="text-slate-500">1 </span>
                        <span className="text-orange-400">def</span> has_pair(nums, target):{'\n'}
                        <span className="text-slate-500">2 </span>
                        <span className="bg-emerald-500/15 text-[#34D399] block px-1 -mx-1 rounded">
                          {'  '}seen = set()                     # O(1) hash lookup
                        </span>
                        <span className="text-slate-500">3 </span>
                        {'  '}for num in nums:{'\n'}
                        <span className="text-slate-500">4 </span>
                        <span className="bg-emerald-500/15 text-[#34D399] block px-1 -mx-1 rounded">
                          {'    '}if (target - num) in seen:     # Single linear pass
                        </span>
                        <span className="text-slate-500">5 </span>
                        {'      '}return True{'\n'}
                        <span className="text-slate-500">6 </span>
                        {'    '}seen.add(num){'\n'}
                        <span className="text-slate-500">7 </span>
                        {'  '}return False
                      </code>
                    </pre>
                  )}
                </div>

                {/* Floating Plain-English Explanation Callout */}
                <div className="mx-4 mb-4 p-3.5 rounded-xl bg-[#1F1D1B] border border-white/[0.08] flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-[#F97316]/15 text-[#F97316] shrink-0 mt-0.5">
                    <Sparkles size={14} />
                  </div>
                  <div className="text-xs leading-relaxed">
                    <p className="font-semibold text-white mb-0.5">
                      Plain-English Insight
                    </p>
                    <p className="text-[#94A3B8]">
                      {previewMode === 'original'
                        ? 'Your nested loop compares every pair twice and can match an element with itself (i == j).'
                        : 'Storing visited numbers in a hash set drops lookup time to O(1), turning 10,000 operations into 100.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Subtle Mini 3-Node Visual Flow Beneath */}
              <div className="mt-4 px-4 py-3 rounded-xl bg-white/80 border border-[#E5DFD5] shadow-xs flex items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#E85D3F]" />
                  <span className="font-semibold text-[#141210]">Input</span>
                </div>
                <ArrowRight size={14} className="text-[#57534E] shrink-0" />
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#F7F4EE] border border-[#E5DFD5]">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="font-semibold text-[#141210]">Hash Set</span>
                </div>
                <ArrowRight size={14} className="text-[#57534E] shrink-0" />
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <span className="font-semibold text-[#059669]">O(n) Output</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Asymmetric 3-Tile Bento Feature Grid */}
        <section id="features" className="max-w-6xl mx-auto px-6 pb-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-[#E85D3F] font-semibold">
                Study Studio
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#141210] mt-1 font-normal">
                Built like a coding notebook,{' '}
                <span className="italic">not a linter.</span>
              </h2>
            </div>
            <p className="text-sm text-[#57534E] max-w-sm">
              Every review turns your mistakes into structured notes, tailored roadmaps, and code-based drills.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Tile 1 (Wider): 6-Part Study Notes PDF */}
            <div className="lg:col-span-7 rounded-2xl bg-white border border-[#E5DFD5] p-6 sm:p-8 shadow-card flex flex-col justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E85D3F]/10 text-[#E85D3F] text-xs font-semibold">
                  <FileDown size={13} /> 1-Click PDF Export
                </div>
                <h3 className="text-xl font-bold text-[#141210]">6-Part Study Notes PDF</h3>
                <p className="text-sm text-[#57534E] leading-relaxed max-w-lg">
                  Every review is formatted into a clean, printable study handbook—complete with exact bug fixes, walkthrough steps, complexity reasoning, and function breakdowns.
                </p>
              </div>

              {/* Mini Structured Handbook Visual Preview */}
              <div className="rounded-xl bg-[#F7F4EE] border border-[#E5DFD5] p-4 grid sm:grid-cols-3 gap-2.5 text-xs">
                {[
                  { num: '01', title: 'Errors & Fixes', tag: 'Line 14' },
                  { num: '02', title: 'Walkthrough', tag: '4 Steps' },
                  { num: '03', title: 'Complexity', tag: 'O(n) Time' },
                  { num: '04', title: 'Call Flow', tag: '2 Edges' },
                  { num: '05', title: 'Functions', tag: 'Params' },
                  { num: '06', title: 'PDF Handbook', tag: 'Ready' },
                ].map((item) => (
                  <div
                    key={item.num}
                    className="p-2.5 rounded-lg bg-white border border-[#E5DFD5] flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] font-bold text-[#E85D3F]">
                        {item.num}.
                      </span>
                      <p className="font-semibold text-[#141210] truncate">{item.title}</p>
                    </div>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#F7F4EE] text-[#57534E] shrink-0">
                      {item.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tile 2: Skill Mastery Paths */}
            <div
              id="roadmap-tile"
              className="lg:col-span-5 rounded-2xl bg-white border border-[#E5DFD5] p-6 sm:p-8 shadow-card flex flex-col justify-between gap-6"
            >
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10B981]/10 text-[#059669] text-xs font-semibold">
                  <Layers size={13} /> Tailored Curriculum
                </div>
                <h3 className="text-xl font-bold text-[#141210]">Skill Mastery Paths</h3>
                <p className="text-sm text-[#57534E] leading-relaxed">
                  Pick any skill—Python, DSA, SQL, or System Design—and track your progress across checkable milestones.
                </p>
              </div>

              {/* Curved/Connected Mini Progress-Node Visual */}
              <div className="rounded-xl bg-[#141210] text-white p-4 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#94A3B8]">
                  <span>ACTIVE PATH</span>
                  <span className="text-[#34D399]">2 / 3 DONE</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="w-8 h-8 rounded-full bg-[#34D399] text-[#141210] font-bold text-xs flex items-center justify-center">
                      ✓
                    </span>
                    <span className="font-mono text-[11px] text-white">Python</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-[#34D399]/60 -mt-5 rounded-full" />
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="w-8 h-8 rounded-full bg-[#F97316] text-[#141210] font-bold text-xs flex items-center justify-center ring-4 ring-[#F97316]/25">
                      02
                    </span>
                    <span className="font-mono text-[11px] text-[#F97316] font-semibold">DSA</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-white/15 -mt-5 rounded-full" />
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="w-8 h-8 rounded-full bg-white/10 text-[#94A3B8] font-mono text-xs flex items-center justify-center border border-white/15">
                      03
                    </span>
                    <span className="font-mono text-[11px] text-[#94A3B8]">Async</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tile 3: Adaptive Code Quizzes */}
            <div className="lg:col-span-12 rounded-2xl bg-white border border-[#E5DFD5] p-6 sm:p-8 shadow-card grid lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-5 space-y-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141210] text-white text-xs font-semibold">
                  <Code2 size={13} className="text-[#F97316]" /> Practice Arena
                </div>
                <h3 className="text-xl font-bold text-[#141210]">Adaptive Code Quizzes</h3>
                <p className="text-sm text-[#57534E] leading-relaxed">
                  Test your understanding with real code-output snippets and complexity questions tailored to your target topic and difficulty.
                </p>
                <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
                  <span className="px-2.5 py-1 rounded-lg bg-[#10B981]/10 text-[#059669] border border-[#10B981]/25 font-semibold">
                    Beginner 5Q
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#E85D3F]/10 text-[#E85D3F] border border-[#E85D3F]/25 font-semibold">
                    Intermediate 10Q
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#141210]/5 text-[#141210] border border-[#E5DFD5] font-semibold">
                    Advanced 15Q
                  </span>
                </div>
              </div>

              {/* Mini Code-Snippet MCQ Preview */}
              <div className="lg:col-span-7 rounded-xl bg-[#F7F4EE] border border-[#E5DFD5] p-4 grid sm:grid-cols-2 gap-4 items-center">
                <div className="rounded-lg bg-[#141210] p-3.5 font-mono text-xs text-slate-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#94A3B8] pb-1 border-b border-white/10">
                    <Terminal size={11} className="text-[#F97316]" /> Output Prediction
                  </div>
                  <pre className="text-[#34D399] leading-relaxed">
                    <code>{`const a = [1, 2];\nconst b = a;\nb.push(3);\nconsole.log(a.length);`}</code>
                  </pre>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded-lg bg-white border border-[#E5DFD5] text-[#57534E]">
                    A. 2 (arrays copy by value)
                  </div>
                  <div className="p-2 rounded-lg bg-[#10B981]/15 border border-[#10B981] text-[#059669] font-semibold flex items-center justify-between">
                    <span>B. 3 (shared reference)</span>
                    <CheckCircle2 size={14} />
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#E5DFD5] text-[#57534E]">
                    C. TypeError
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-[#E5DFD5] bg-white/60 py-8 px-6 text-sm text-[#57534E]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen size={15} className="text-[#E85D3F]" />
            <span>© 2026 CodeBuddy · Warm Paper &amp; Ink Studio</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 font-medium">
            <a href="#features" className="hover:text-[#141210] transition-colors">
              Features
            </a>
            <Link to="/login" className="hover:text-[#141210] transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-[#141210] transition-colors">
              Get Started
            </Link>
            <a
              href="https://github.com/joykhatua3-creator/codebuddy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#141210] transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
