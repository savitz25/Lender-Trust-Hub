'use client';

import { useEffect } from 'react';
import { trackLenderEvent } from '@/lib/analytics/ga-events';

type Props = {
  kind: 'hmda-county' | 'loan-estimate-analyzer' | 'lender-evidence';
  state?: string;
  county?: string;
  embedSrc?: string;
  hasData: boolean;
  extra?: Record<string, string | number | boolean | undefined>;
};

/**
 * Soft analytics for embeds: impression on mount; click-through via capture on CTA.
 */
export function EmbedAnalytics({
  kind,
  state,
  county,
  embedSrc,
  hasData,
  extra,
}: Props) {
  useEffect(() => {
    trackLenderEvent('embed_impression', {
      embed_kind: kind,
      state: state ?? '',
      county: county ?? '',
      embed_src: embedSrc ?? '',
      has_data: hasData,
      ...extra,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per mount identity
  }, [kind, state, county, embedSrc, hasData]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      const a = t?.closest?.('a[data-embed-cta]') as HTMLAnchorElement | null;
      if (!a) return;
      trackLenderEvent('embed_click_through', {
        embed_kind: kind,
        cta: a.getAttribute('data-embed-cta') ?? 'unknown',
        state: state ?? '',
        county: county ?? '',
        embed_src: embedSrc ?? a.getAttribute('data-embed-src') ?? '',
      });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [kind, state, county, embedSrc]);

  return null;
}
