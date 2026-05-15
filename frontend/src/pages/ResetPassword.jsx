import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Lock, Scissors } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import API from '../services/api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    if (!password || password.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }

    if (password !== confirm) {
      setMessage('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await API.post('/auth/reset-password', { token, password });
      setMessage('Password updated successfully. Redirecting to login...');
      window.setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setMessage(err?.response?.data?.message || err?.response?.data?.msg || 'Reset failed. Link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-paper)] px-4 py-8 text-[var(--color-ink)]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-lg items-center justify-center">
        <section className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-xl shadow-black/10 sm:p-8">
          <Link to="/" className="mb-8 flex w-fit items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-white">
              <Scissors className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-black">BARBERFLOW</span>
          </Link>

          <h1 className="text-3xl font-black leading-tight tracking-normal">New Password</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">Create a fresh password for your account.</p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Password</span>
              <span className="relative block">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                <input
                  className="input-ui pl-11 pr-12"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
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

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Confirm password</span>
              <input
                className="input-ui"
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder="Confirm password"
                required
              />
            </label>

            {message ? (
              <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-sidebar)] px-4 py-3 text-sm text-[var(--color-muted)]">
                {message}
              </div>
            ) : null}

            <button className="btn-primary w-full" disabled={loading || !token} type="submit">
              {loading ? 'Updating...' : 'Update password'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 text-sm text-[var(--color-muted)]">
            Back to{' '}
            <Link className="underline underline-offset-4 transition-colors hover:text-[var(--color-ink)]" to="/login">
              login
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
