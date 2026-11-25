import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bot, Eye, EyeOff, AlertCircle, GraduationCap, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function LoginPage() {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoRole, setDemoRole] = useState(null);
  const [error, setError] = useState('');

  const isBusy = loading || demoRole !== null;

  const formatAuthError = (err) => {
    const isLocal =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    return (
      err.response?.data?.message ||
      (err.message === 'Network Error' || !err.response
        ? isLocal
          ? 'Cannot connect to local server. Please ensure backend is running (npm run dev) or set your Render URL in client/.env.'
          : 'Cannot connect to backend server. Render server might be waking up from sleep (~50s). Please wait a moment and try again.'
        : 'Login failed. Please check your credentials and try again.')
    );
  };

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const validate = () => {
    if (!form.email.trim()) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'Enter a valid email';
    if (!form.password) return 'Password is required';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return setError(err);

    setLoading(true);
    setError('');
    try {
      const user = await login(form);
      const redirect = from || (user.role === 'teacher' ? '/teacher' : '/dashboard');
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    setDemoRole(role);
    setError('');
    try {
      const user = await demoLogin(role);
      navigate(user.role === 'teacher' ? '/teacher' : '/dashboard', { replace: true });
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setDemoRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-primary-600 rounded-xl mb-3 shadow-sm">
            <Bot size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Code Review Buddy</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>

        <div className="card p-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="input"
                placeholder="you@example.com"
                autoComplete="email"
                disabled={isBusy}
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="input pr-10"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={isBusy}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={isBusy}>
              {loading ? <><LoadingSpinner size="sm" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-2 text-gray-400">Or try instant demo</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleDemoLogin('student')}
              disabled={isBusy}
              className="btn-secondary w-full"
            >
              {demoRole === 'student' ? (
                <><LoadingSpinner size="sm" /> Loading...</>
              ) : (
                <><GraduationCap size={16} /> Student</>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('teacher')}
              disabled={isBusy}
              className="btn-secondary w-full"
            >
              {demoRole === 'teacher' ? (
                <><LoadingSpinner size="sm" /> Loading...</>
              ) : (
                <><BookOpen size={16} /> Teacher</>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-primary-600 font-medium hover:underline">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
