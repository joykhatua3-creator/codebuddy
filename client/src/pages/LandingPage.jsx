import { Link } from 'react-router-dom';
import { Bot, Code2, Map, Brain, ArrowRight, Zap, Shield } from 'lucide-react';

const features = [
  { icon: Code2, title: 'AI Code Review', desc: 'Get instant, detailed analysis of your code with bug detection, hints, and guided solutions.' },
  { icon: Map, title: 'Personalized Roadmap', desc: 'AI generates a learning plan based on your unique weak spots to accelerate improvement.' },
  { icon: Brain, title: 'Smart Quizzes', desc: 'Practice with AI-generated MCQ quizzes targeting your weakest programming concepts.' },
];

const stats = [
  { label: '100% Free', icon: Zap },
  { label: 'AI Powered', icon: Brain },
  { label: 'Multi-Language', icon: Code2 },
  { label: 'Secure & Private', icon: Shield },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary-600 rounded-lg"><Bot size={18} className="text-white" /></div>
          <span className="font-bold text-gray-900">Code Review Buddy</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 bg-gradient-to-br from-primary-50 via-white to-blue-50">
        <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 text-xs font-medium px-3 py-1 rounded-full mb-6">
          <Zap size={12} /> Powered by Google Gemini AI
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 max-w-3xl leading-tight">
          Get <span className="text-primary-600">AI-Powered</span> Code Reviews.{' '}
          <span className="text-primary-600">Learn Faster.</span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-xl">
          Submit your code, get instant feedback, track your weaknesses, and follow a personalized learning roadmap — all powered by AI.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Link to="/register" className="btn btn-primary btn-lg gap-2">
            Start Learning Free <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="btn btn-secondary btn-lg">
            Sign In
          </Link>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap justify-center gap-6 mt-12">
          {stats.map(({ label, icon: Icon }) => (
            <div key={label} className="flex items-center gap-2 text-sm text-gray-600">
              <Icon size={16} className="text-primary-500" />
              <span className="font-medium">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">Everything you need to level up</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6 hover:shadow-card-hover transition-shadow">
                <div className="p-2.5 bg-primary-50 rounded-lg w-fit mb-4">
                  <Icon size={22} className="text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-14 bg-primary-600 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Ready to improve your coding skills?</h2>
        <p className="text-primary-100 mb-6 text-sm">Join students getting AI-powered feedback on their code today.</p>
        <Link to="/register" className="btn bg-white text-primary-700 hover:bg-primary-50 btn-lg">
          Create Free Account
        </Link>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-400 border-t border-gray-100">
        © 2026 Code Review Buddy · Built with MERN + Google Gemini AI
      </footer>
    </div>
  );
}
