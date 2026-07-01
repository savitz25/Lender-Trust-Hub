'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield } from 'lucide-react';

function AdminLoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/admin';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/admin/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push(next);
      router.refresh();
    } else {
      setError('Invalid admin secret');
    }
    setLoading(false);
  }

  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-md items-center px-4 py-16">
      <form onSubmit={handleSubmit} className="w-full rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-6 flex items-center gap-2 text-[#0F172A] dark:text-white">
          <Shield className="h-6 w-6 text-emerald-600" aria-hidden="true" />
          <h1 className="text-xl font-bold">Lender Trust Hub Admin</h1>
        </div>
        <label htmlFor="admin-password" className="text-sm font-medium text-zinc-600">
          Admin secret
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          autoComplete="current-password"
          required
        />
        {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-16 text-center text-zinc-500">Loading…</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}