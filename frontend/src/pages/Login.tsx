import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, Eye, EyeOff, Lock, Mail, Scissors } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

const routeForRole = (role?: UserRole) => {
  if (role === UserRole.ADMIN) return '/admin';
  if (role === UserRole.OWNER) return '/owner';
  return '/dashboard';
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nextPath = new URLSearchParams(location.search).get('next');
  const safeNextPath = nextPath && nextPath.startsWith('/') ? nextPath : '';

  useEffect(() => {
    if (user && profile) navigate(safeNextPath || routeForRole(profile.role), { replace: true });
  }, [user, profile, navigate, safeNextPath]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const nextProfile = await login(form);
      navigate(safeNextPath || routeForRole(nextProfile.role), { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.msg || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-paper)] px-4 py-8 text-[var(--color-ink)]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[1fr_440px]">
          <section className="hidden min-h-[560px] flex-col justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-sidebar)] p-10 lg:flex">
            <Link to="/" className="flex w-fit items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-accent text-white">
                <Scissors className="h-5 w-5" />
              </span>
              <span className="font-display text-xl font-black tracking-normal">BARBERFLOW</span>
            </Link>

            <div>
              <p className="mb-4 text-xs font-black uppercase tracking-[0.28em] text-accent">Secure access</p>
              <h1 className="max-w-xl text-5xl font-black leading-none tracking-normal">
                Manage bookings, shops and customer flow.
              </h1>
              <p className="mt-6 max-w-md text-sm leading-6 text-[var(--color-muted)]">
                Sign in with your BarberFlow account to continue to your dashboard.
              </p>
            </div>
          </section>

          <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-xl shadow-black/10 sm:p-8">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-white">
                <Scissors className="h-5 w-5" />
              </span>
              <span className="font-display text-lg font-black">BARBERFLOW</span>
            </div>

            <h2 className="text-2xl font-black tracking-normal">Sign In</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">Use your email and password to continue.</p>

            <form className="mt-8 space-y-4" onSubmit={onSubmit}>
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Email</span>
                <span className="relative block">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                  <input
                    className="input-ui pl-11"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
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
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Password"
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

              {error ? (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              ) : null}

              <button className="btn-primary w-full" disabled={loading} type="submit">
                {loading ? 'Signing in...' : 'Sign in'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-sm text-[var(--color-muted)]">
              <Link className="transition-colors hover:text-[var(--color-ink)]" to="/forgot-password">
                Forgot password?
              </Link>
              <Link className="transition-colors hover:text-[var(--color-ink)]" to={safeNextPath ? `/signup?next=${encodeURIComponent(safeNextPath)}` : '/signup'}>
                Create account
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
