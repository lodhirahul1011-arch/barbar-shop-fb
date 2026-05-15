import { useState } from 'react';
import { ArrowRight, Mail, Scissors } from 'lucide-react';
import { Link } from 'react-router-dom';
import API from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setResetLink('');
    setLoading(true);

    try {
      const res = await API.post('/auth/forgot-password', { email });
      setMessage(res.data.message || res.data.msg || 'Reset link generated');
      if (res.data.resetLink) setResetLink(res.data.resetLink);
    } catch (err) {
      setMessage(err?.response?.data?.message || err?.response?.data?.msg || 'Failed to generate reset link');
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

          <h1 className="text-3xl font-black leading-tight tracking-normal">Reset Password</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">Enter your email to generate a reset link.</p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Email</span>
              <span className="relative block">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                <input
                  className="input-ui pl-11"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </span>
            </label>

            <button className="btn-primary w-full" disabled={loading} type="submit">
              {loading ? 'Sending...' : 'Send reset link'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {message ? (
            <div className="mt-5 rounded-md border border-[var(--color-border)] bg-[var(--color-sidebar)] px-4 py-3 text-sm text-[var(--color-muted)]">
              {message}
              {resetLink ? (
                <a className="mt-3 block break-all text-accent underline underline-offset-4" href={resetLink}>
                  {resetLink}
                </a>
              ) : null}
            </div>
          ) : null}

          <div className="mt-6 text-sm text-[var(--color-muted)]">
            <Link className="underline underline-offset-4 transition-colors hover:text-[var(--color-ink)]" to="/login">
              Back to login
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
