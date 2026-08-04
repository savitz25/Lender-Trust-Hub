'use client';

import { useState } from 'react';
import { X, Mail, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMyLending } from '@/components/my-lending/my-lending-provider';
import {
  LendingFacebookSignInButton,
  LendingGoogleSignInButton,
} from '@/components/my-lending/social-sign-in-buttons';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export function AuthModal() {
  const { authOpen, closeAuth, redirectPath, authContext } = useMyLending();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'magic' | 'password'>('magic');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (!authOpen) return null;

  const contextCopy =
    authContext === 'lender'
      ? 'Sign in to save this lender to My Lending and sync across devices.'
      : 'Sign in to open Lending HQ and sync your saved research.';

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, next: redirectPath }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || 'Could not send sign-in link');
        return;
      }
      setSent(true);
      setInfo('Check your email for a sign-in link.');
    } catch {
      setError('Could not send sign-in link');
    } finally {
      setSending(false);
    }
  }

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    setInfo(null);
    try {
      const supabase = createBrowserSupabaseClient();
      if (!supabase) {
        setError('Sign-in is not configured');
        return;
      }
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) {
        setError(authError.message);
        return;
      }
      setInfo('Signed in');
      closeAuth();
      if (redirectPath && redirectPath !== window.location.pathname) {
        window.location.assign(redirectPath);
      } else {
        window.location.reload();
      }
    } catch {
      setError('Sign-in failed');
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={closeAuth}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={closeAuth}
          className="absolute right-3 top-3 rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
          aria-label="Close sign-in"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
          My Lending
        </p>
        <h2 id="auth-modal-title" className="mt-1 text-xl font-semibold text-[#0A2540]">
          Sign in to Lending HQ
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{contextCopy}</p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Optional — every tool on Lender Trust Hub works without an account. Sign-in only syncs
          saved work across devices. We never sell your data or sell leads.
        </p>

        {/* Move parity order: 1) Magic link (default) 2) Google 3) Facebook */}
        <div className="mb-3 mt-5 flex gap-2 text-xs font-medium">
          <button
            type="button"
            className={cn(
              'rounded-full px-3 py-1',
              mode === 'magic' ? 'bg-[#059669] text-white' : 'bg-zinc-100 text-zinc-600'
            )}
            onClick={() => setMode('magic')}
          >
            Magic link
          </button>
          <button
            type="button"
            className={cn(
              'rounded-full px-3 py-1',
              mode === 'password' ? 'bg-[#059669] text-white' : 'bg-zinc-100 text-zinc-600'
            )}
            onClick={() => setMode('password')}
          >
            Password
          </button>
        </div>

        {mode === 'magic' ? (
          <form onSubmit={sendMagicLink} className="space-y-3">
            <label className="block text-sm font-medium text-zinc-800" htmlFor="ml-email">
              Email
            </label>
            <Input
              id="ml-email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
            />
            <Button
              type="submit"
              disabled={sending || sent}
              className="h-11 w-full gap-2"
              variant="trust"
            >
              <Mail className="h-4 w-4" />
              {sent ? 'Link sent — check email' : sending ? 'Sending…' : 'Email me a sign-in link'}
            </Button>
          </form>
        ) : (
          <form onSubmit={signInWithPassword} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="ml-email-pw">
                Email
              </label>
              <Input
                id="ml-email-pw"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="ml-password">
                Password
              </label>
              <Input
                id="ml-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
              />
            </div>
            <Button type="submit" disabled={sending} className="h-11 w-full" variant="trust">
              {sending ? 'Signing in…' : 'Sign in with password'}
            </Button>
            <p className="text-xs text-zinc-500">
              Password accounts are optional. Prefer magic link if you have not set a password yet.
            </p>
          </form>
        )}

        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        {info ? (
          <p className="mt-3 text-sm text-emerald-800" role="status">
            {info}
          </p>
        ) : null}

        <div className="my-4 flex items-center gap-3 text-xs text-zinc-400">
          <div className="h-px flex-1 bg-zinc-200" />
          or continue with
          <div className="h-px flex-1 bg-zinc-200" />
        </div>

        <div className="grid gap-2.5">
          <LendingGoogleSignInButton
            href={`/api/auth/google?next=${encodeURIComponent(redirectPath)}`}
            disabled={sending}
          />
          <LendingFacebookSignInButton
            href={`/api/auth/facebook?next=${encodeURIComponent(redirectPath)}`}
            disabled={sending}
          />
        </div>

        <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-zinc-500">
          <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden />
          One Ask Trust Hub account across Move, Insurance, and Lending. Magic link by default —
          or optional password. Also Google and Facebook. Sign out anytime from HQ.
        </p>
      </div>
    </div>
  );
}
