/**
 * Phase 5 — priority GA4 event helpers for Lender Trust Hub research product.
 * No PII. Consent-aware when possible; falls back to gtag when present.
 */

import {
  LENDER_MEASUREMENT_BASELINE_DATE,
  LENDER_MEASUREMENT_BASELINE_LABEL,
} from '@/lib/analytics/measurement-baseline';

type GtagWindow = Window & {
  gtag?: (...args: unknown[]) => void;
  __LTH_MEASUREMENT_BASELINE?: string;
  __LTH_MEASUREMENT_LABEL?: string;
};

function hasConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const c = localStorage.getItem('analytics_consent');
    if (c == null) return true; // page_view already fires; allow research events unless revoked
    return ['granted', 'true', '1'].includes(c.toLowerCase());
  } catch {
    return true;
  }
}

export function trackLenderEvent(
  name: string,
  params?: Record<string, string | number | boolean | undefined>
): void {
  if (typeof window === 'undefined') return;
  const w = window as GtagWindow;
  if (!hasConsent()) return;

  const safe: Record<string, string | number | boolean> = {
    hub: 'lender',
    baseline: LENDER_MEASUREMENT_BASELINE_DATE,
    baseline_label: LENDER_MEASUREMENT_BASELINE_LABEL,
  };
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        safe[k] = v;
      }
    }
  }

  try {
    if (typeof w.gtag === 'function') {
      w.gtag('event', name, safe);
    }
    if (process.env.NODE_ENV === 'development') {
      console.debug('[LTH Phase5]', name, safe);
    }
  } catch {
    /* non-fatal */
  }
}

export function trackNmlsVerificationLookup(params?: {
  source?: string;
  path?: string;
}): void {
  trackLenderEvent('nmls_verification_lookup', {
    source: params?.source ?? 'outbound',
    page_path: params?.path ?? (typeof window !== 'undefined' ? window.location.pathname : ''),
  });
  trackLenderEvent('outbound_nmls_consumer_access', {
    source: params?.source ?? 'outbound',
  });
}

export function trackCalculatorComplete(params: {
  calc_id: string;
  calc_name?: string;
}): void {
  trackLenderEvent('calculator_complete', {
    calc_id: params.calc_id,
    calc_name: params.calc_name ?? params.calc_id,
  });
}

export function trackLenderCompareSession(params: {
  count: number;
}): void {
  if (params.count < 2) return;
  trackLenderEvent('lender_compare_session', { lender_count: params.count });
}

export function trackMyLendingSave(params?: { slug?: string }): void {
  trackLenderEvent('my_lending_save', { lender_slug: params?.slug ?? '' });
}

export function trackMyLendingReturn(): void {
  trackLenderEvent('my_lending_return', {});
}

export function trackLenderProfileView(params: {
  slug: string;
  nmls_verified?: boolean;
}): void {
  // once per slug per session
  if (typeof window === 'undefined') return;
  try {
    const key = `lth_profile_view_${params.slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {
    /* ignore */
  }
  trackLenderEvent('lender_profile_view', {
    lender_slug: params.slug,
    nmls_verified: Boolean(params.nmls_verified),
  });
}

export function trackResearchPathClick(params: {
  kind: string;
  from?: string;
  to?: string;
}): void {
  trackLenderEvent('research_path_click', {
    path_kind: params.kind,
    from_path: params.from ?? '',
    to_path: params.to ?? '',
  });
}

export function trackOutboundSpecialistHub(params: {
  hub: 'insurance' | 'move' | 'ask';
  href?: string;
}): void {
  trackLenderEvent('outbound_specialist_hub', {
    target_hub: params.hub,
    href: params.href ?? '',
  });
}

/** Stage A′ — contextual inter-hub continuation (non-PII). */
export function trackJourneyHandoff(params: {
  from_hub: string;
  to_hub: string;
  priority?: string;
  journey?: string;
  intent?: string;
  state?: string;
  county?: string;
  source_path?: string;
}): void {
  trackLenderEvent('journey_handoff_click', {
    from_hub: params.from_hub,
    to_hub: params.to_hub,
    handoff_priority: params.priority ?? 'primary',
    journey: params.journey ?? '',
    intent: params.intent ?? '',
    state: params.state ?? '',
    county: params.county ?? '',
    source_path:
      params.source_path ??
      (typeof window !== 'undefined' ? window.location.pathname : ''),
  });
  trackLenderEvent('cross_hub_continuation', {
    from_hub: params.from_hub,
    to_hub: params.to_hub,
    landing_style: 'contextual',
  });
}

export function trackJourneyLanding(params: {
  src?: string;
  journey?: string;
  intent?: string;
  state?: string;
  county?: string;
  landed_on: 'county' | 'state' | 'hub' | 'tool' | 'other';
}): void {
  trackLenderEvent('journey_context_landing', {
    src_hub: params.src ?? '',
    journey: params.journey ?? '',
    intent: params.intent ?? '',
    state: params.state ?? '',
    county: params.county ?? '',
    landed_on: params.landed_on,
  });
}

export function trackOutboundPrimarySource(params: {
  host?: string;
  kind?: string;
}): void {
  trackLenderEvent('outbound_primary_source', {
    source_host: params.host ?? '',
    source_kind: params.kind ?? 'primary',
  });
}
