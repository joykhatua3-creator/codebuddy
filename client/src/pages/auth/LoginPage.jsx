import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, GraduationCap, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import OAuthButtons from '../../components/auth/OAuthButtons';
import AuroraBackdrop from '../../components/ui/AuroraBackdrop';
import BrandLogo from '../../components/ui/BrandLogo';

export default function LoginPage() {
  const { login, demoLogin, completeOAuthLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const from = location.state?.from?.pathname;

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoRole, setDemoRole] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const oauthToken = searchParams.get('oauthToken');
    const oauthError = searchParams.get('oauthError');
    if (oauthError) {
      setError('OAuth sign-in could not be completed. Please try again.');
      setSearchParams({}, { replace: true });
      return;
    }
    if (oauthToken) {
      setLoading(true);
      setSearchParams({}, { replace: true });
      completeOAuthLogin(oauthToken)
        .then((user) => {
          navigate(user.role === 'teacher' ? '/teacher' : '/dashboard', { replace: true });
        })
        .catch(() => {
          setError('Failed to verify OAuth session. Please try signing in again.');
          setLoading(false);
        });
    }
  }, [searchParams, setSearchParams, completeOAuthLogin, navigate]);

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
    <div className="relative min-h-screen flex flex-col items-center justify-center py-8 px-4 overflow-x-hidden">
      <AuroraBackdrop />

      <div className="w-full max-w-md mx-auto">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <BrandLogo variant="full" to="/" />
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">Sign in to your account</p>
        </div>

        <div className="liquid-glass p-5 sm:p-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-400/30 rounded-xl text-rose-700 dark:text-rose-200 text-sm mb-4">
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
                className="input min-h-[44px]"
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
                  className="input min-h-[44px] pr-10"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={isBusy}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary rounded-full w-full min-h-[44px]" disabled={isBusy}>
              {loading ? <><LoadingSpinner size="sm" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <OAuthButtons role="student" disabled={isBusy} />

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200/80 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-3 py-0.5 rounded-full bg-white/80 dark:bg-[#0B1120]/90 text-slate-500 dark:text-slate-400 border border-white/80 dark:border-white/10">
                Or try instant demo
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleDemoLogin('student')}
              disabled={isBusy}
              className="btn-secondary rounded-full w-full min-h-[44px]"
            >
              {demoRole === 'student' ? (
                <><LoadingSpinner size="sm" /> Loading...</>
              ) : (
                <><GraduationCap size={16} /> Student Demo</>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('teacher')}
              disabled={isBusy}
              className="btn-secondary rounded-full w-full min-h-[44px]"
            >
              {demoRole === 'teacher' ? (
                <><LoadingSpinner size="sm" /> Loading...</>
              ) : (
                <><BookOpen size={16} /> Teacher Demo</>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-5">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
