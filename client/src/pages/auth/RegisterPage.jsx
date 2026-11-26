import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, GraduationCap, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import OAuthButtons from '../../components/auth/OAuthButtons';
import AuroraBackdrop from '../../components/ui/AuroraBackdrop';
import BrandLogo from '../../components/ui/BrandLogo';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'student' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const validate = () => {
    if (!form.name.trim() || form.name.trim().length < 2) return 'Full name must be at least 2 characters';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return 'Enter a valid email address';
    if (!form.password || form.password.length < 6) return 'Password must be at least 6 characters';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
      return 'Password must include uppercase, lowercase, and a number';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return setError(err);

    setLoading(true);
    setError('');
    try {
      const { confirmPassword, ...payload } = form;
      const user = await register(payload);
      navigate(user.role === 'teacher' ? '/teacher' : '/dashboard', { replace: true });
    } catch (err) {
      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const msg =
        err.response?.data?.message ||
        (err.message === 'Network Error' || !err.response
          ? isLocal
            ? 'Cannot connect to local server. Please ensure backend is running (npm run dev) or set your Render URL in client/.env.'
            : 'Cannot connect to backend server. Render server might be waking up from sleep (~50s). Please wait a moment and try again.'
          : 'Registration failed. Please try again.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return null;
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const colors = ['', 'bg-rose-500', 'bg-amber-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-emerald-400'];
    return { score, label: labels[score], color: colors[score] };
  };

  const strength = passwordStrength();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center py-8 px-4 overflow-x-hidden">
      <AuroraBackdrop />

      <div className="w-full max-w-md mx-auto">
        <div className="flex flex-col items-center mb-6">
          <BrandLogo variant="full" to="/" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-3">Create your account</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Start learning with AI code reviews</p>
        </div>

        <div className="liquid-glass p-5 sm:p-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-400/30 rounded-xl text-rose-700 dark:text-rose-200 text-sm mb-4">
              <AlertCircle size={16} className="shrink-0" /><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Role selector */}
            <div>
              <label className="label">I am a</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { value: 'student', label: 'Student', icon: GraduationCap },
                  { value: 'teacher', label: 'Teacher', icon: BookOpen },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, role: value }))}
                    className={`flex items-center justify-center gap-2 p-2.5 min-h-[44px] rounded-xl border text-sm font-medium transition-all ${
                      form.role === value
                        ? 'border-cyan-400 bg-cyan-500/15 text-cyan-800 dark:text-cyan-200 shadow-xs'
                        : 'border-slate-200/80 dark:border-white/15 bg-white/60 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:border-cyan-400/40'
                    }`}
                  >
                    <Icon size={16} />{label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Full Name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange}
                className="input min-h-[44px]" placeholder="John Doe" disabled={loading} />
            </div>

            <div>
              <label className="label">Email Address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                className="input min-h-[44px]" placeholder="you@example.com" disabled={loading} />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} name="password" value={form.password}
                  onChange={handleChange} className="input min-h-[44px] pr-10" placeholder="Min. 6 characters" disabled={loading} />
                <button type="button" onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1" tabIndex={-1}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Password strength */}
              {strength && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex gap-0.5 flex-1">
                    {[1,2,3,4,5].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength.score ? strength.color : 'bg-slate-200 dark:bg-white/10'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{strength.label}</span>
                </div>
              )}
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input type="password" name="confirmPassword" value={form.confirmPassword}
                onChange={handleChange} className="input min-h-[44px]" placeholder="Re-enter password" disabled={loading} />
            </div>

            <button type="submit" className="btn btn-primary rounded-full w-full min-h-[44px]" disabled={loading}>
              {loading ? <><LoadingSpinner size="sm" /> Creating account...</> : 'Create Account'}
            </button>
          </form>

          <OAuthButtons role={form.role} disabled={loading} />
        </div>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
