import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Lock, Mail, Scissors, User } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const routeForRole = (role) => {
  if (role === 'owner') return '/owner';
  if (role === 'admin') return '/admin';
  return '/dashboard';
};

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signup } = useAuth();
  const nextPath = new URLSearchParams(location.search).get('next');
  const safeNextPath = nextPath && nextPath.startsWith('/') ? nextPath : '';
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const profile = await signup({ ...form, fullName: form.name });
      navigate(safeNextPath || routeForRole(profile.role), { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.msg || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-paper)] px-4 py-8 text-[var(--color-ink)]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <section className="w-full max-w-2xl rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-xl shadow-black/10 sm:p-8">
          <Link to="/" className="mb-8 flex w-fit items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-white">
              <Scissors className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-black">BARBERFLOW</span>
          </Link>

          <h1 className="text-3xl font-black leading-tight tracking-normal">Create Account</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Start with a customer account, or create an owner account for shop management.
          </p>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Full name</span>
              <span className="relative block">
                <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                <input
                  className="input-ui pl-11"
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="Your name"
                  required
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Email</span>
              <span className="relative block">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                <input
                  className="input-ui pl-11"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Password</span>
              <span className="relative block">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                <input
                  className="input-ui pl-11 pr-12"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  placeholder="At least 6 characters"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 rounded-md p-2 text-[var(--color-muted)] transition-colors hover:bg-black/5 hover:text-[var(--color-ink)] dark:hover:bg-white/10"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            <div>
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Account type</span>
              <div className="grid grid-cols-2 gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-sidebar)] p-1">
                {[
                  ['customer', 'Customer'],
                  ['owner', 'Owner'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`rounded-md px-4 py-3 text-sm font-black uppercase tracking-widest transition-colors ${
                      form.role === value
                        ? 'bg-accent text-white shadow-lg shadow-accent/20'
                        : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                    }`}
                    onClick={() => updateField('role', value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {error ? (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            ) : null}

            <button className="btn-primary w-full" disabled={loading} type="submit">
              {loading ? 'Creating account...' : 'Create account'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 text-sm text-[var(--color-muted)]">
            Already have an account?{' '}
            <Link className="underline underline-offset-4 transition-colors hover:text-[var(--color-ink)]" to={safeNextPath ? `/login?next=${encodeURIComponent(safeNextPath)}` : '/login'}>
              Sign in
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
