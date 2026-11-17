import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeFor } from '../routes/ProtectedRoute';
import AuthShell, { Field, primaryBtn } from '../components/AuthShell';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      const user = await register(form);
      navigate(homeFor(user.role), { replace: true });
    } catch (err) {
      const data = err.response?.data;
      setErrors(data?.errors || { form: data?.message || 'Could not reach the server' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Submit code, get feedback, track what you keep getting wrong."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-[#1D2340] underline">
            Log in
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
        <Field label="Name" name="name" autoComplete="name" value={form.name} onChange={onChange} error={errors.name} />
        <Field label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={onChange} error={errors.email} />
        <Field label="Password (8+ characters, with a letter and a number)" name="password" type="password" autoComplete="new-password" value={form.password} onChange={onChange} error={errors.password} />
        <button type="submit" disabled={submitting} className={primaryBtn}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}
