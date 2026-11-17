import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeFor } from '../routes/ProtectedRoute';
import AuthShell, { Field, primaryBtn } from '../components/AuthShell';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      const user = await login(form);
      navigate(location.state?.from?.pathname || homeFor(user.role), { replace: true });
    } catch (err) {
      const data = err.response?.data;
      setErrors(data?.errors || { form: data?.message || 'Could not reach the server' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Log in"
      subtitle="Pick up where your last review left off."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-medium text-[#1D2340] underline">
            Create a student account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        {errors.form && (
          <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {errors.form}
          </p>
        )}
        <Field label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={onChange} error={errors.email} />
        <Field label="Password" name="password" type="password" autoComplete="current-password" value={form.password} onChange={onChange} error={errors.password} />
        <button type="submit" disabled={submitting} className={primaryBtn}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthShell>
  );
}
