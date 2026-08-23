'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { parseLenderAskHandoff } from '@/lib/search-handoff/parse';
import { resolveLenderAskHandoff } from '@/lib/search-handoff/resolve';
import { readLenderAskHandoff } from '@/lib/search-handoff/session';

function sanitizeFrom(from: string | null): string | null {
  if (!from) return null;
  try {
    const decoded = decodeURIComponent(from);
    if (decoded.includes('://') || decoded.startsWith('//')) return null;
    if (!decoded.startsWith('/')) return null;
    if (decoded.startsWith('/local-lenders') || decoded.startsWith('/from-ask')) return decoded;
    return null;
  } catch {
    return null;
  }
}

export function AskProfileBackLink() {
  const searchParams = useSearchParams();
  const [href, setHref] = useState<string | null>(null);
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const fromUrl = parseLenderAskHandoff(searchParams);
    const fromSession = fromUrl ? null : readLenderAskHandoff();
    const ctx = fromUrl || fromSession;
    if (ctx) {
      const dest = resolveLenderAskHandoff(ctx);
      setHref(dest.href);
      setLabel(dest.backLabel);
      return;
    }
    const from = sanitizeFrom(searchParams.get('from'));
    if (from) {
      setHref(from);
      setLabel('Back to results');
    }
  }, [searchParams]);

  if (!href || !label) return null;

  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-[#0A2540]"
      data-ask-handoff-back="1"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {label.startsWith('Back') ? label : `← ${label}`}
    </Link>
  );
}
