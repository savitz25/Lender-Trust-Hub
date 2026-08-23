'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackLenderEvent } from '@/lib/analytics/ga-events';
import { parseLenderAskHandoff, serializeLenderAskHandoff } from '@/lib/search-handoff/parse';
import { resolveLenderAskHandoff } from '@/lib/search-handoff/resolve';
import {
  analyticsFromLenderAsk,
  persistLenderAskHandoff,
} from '@/lib/search-handoff/session';

export function AskSearchContextBanner() {
  const params = useSearchParams();
  const pathname = usePathname();
  const ctx = parseLenderAskHandoff(params);
  const ctxKey = ctx ? serializeLenderAskHandoff(ctx) : '';

  useEffect(() => {
    if (!ctx) return;
    persistLenderAskHandoff(ctx);
    const dest = resolveLenderAskHandoff(ctx);
    const handoff_type =
      pathname.startsWith('/lenders/') && pathname.split('/').length > 2 ? 'entity' : 'view_more';
    trackLenderEvent(
      'ask_search_handoff',
      analyticsFromLenderAsk(ctx, { handoff_type, match_precision: dest.matchClass })
    );
  }, [ctx, ctxKey, pathname]);

  if (!ctx) return null;
  const dest = resolveLenderAskHandoff(ctx);

  return (
    <div
      className="border-b border-sky-200/80 bg-sky-50/70"
      data-ask-handoff="1"
      data-match-class={dest.matchClass || dest.status}
      data-entity={ctx.entityType || ''}
      role="status"
    >
      <div className="container mx-auto px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-900/80">
          From AskTrustHub
        </p>
        <p className="mt-1 text-sm font-semibold text-[#0A2540]">{dest.bannerTitle}</p>
        <p className="mt-1 text-sm leading-relaxed text-zinc-700">{dest.bannerBody}</p>
      </div>
    </div>
  );
}
