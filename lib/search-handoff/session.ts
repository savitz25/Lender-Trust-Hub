import type { LenderAskSearchContext } from './allowlist';
import { parseLenderAskHandoff, serializeLenderAskHandoff } from './parse';

export const LENDER_ASK_SESSION_KEY = 'lth:ask-search-handoff';

export function persistLenderAskHandoff(ctx: LenderAskSearchContext | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!ctx) {
      window.sessionStorage.removeItem(LENDER_ASK_SESSION_KEY);
      return;
    }
    window.sessionStorage.setItem(LENDER_ASK_SESSION_KEY, serializeLenderAskHandoff(ctx));
  } catch {
    /* private mode */
  }
}

export function readLenderAskHandoff(): LenderAskSearchContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(LENDER_ASK_SESSION_KEY);
    return raw ? parseLenderAskHandoff(raw) : null;
  } catch {
    return null;
  }
}

export function analyticsFromLenderAsk(
  ctx: LenderAskSearchContext,
  extra?: { handoff_type?: 'entity' | 'view_more'; match_precision?: string }
) {
  return {
    source: 'ask' as const,
    handoff_type: extra?.handoff_type,
    entity_type: ctx.entityType,
    category: ctx.category,
    state: ctx.state,
    county: ctx.county,
    city: ctx.city,
    zip: ctx.zip,
    match_precision: extra?.match_precision,
  };
}
