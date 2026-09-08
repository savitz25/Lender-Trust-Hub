'use client';

import { useEffect } from 'react';
import { trackLenderEvent } from '@/lib/analytics/ga-events';
import { lenderResultCountBucket, type LenderSearchAnalytics } from '@/lib/specialist-search/analytics';

export function SearchAnalytics({ dimensions, resultCount }: { dimensions: LenderSearchAnalytics; resultCount: number }) {
  useEffect(() => {
    trackLenderEvent('specialist_search_interpreted', dimensions);
    trackLenderEvent(resultCount ? 'specialist_search_results' : 'specialist_search_zero_results', { ...dimensions, resultCountBucket: lenderResultCountBucket(resultCount) });

    const results = document.querySelector('.intel-ask-result');
    const onClick = (event: Event) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-specialist-event]') : null;
      const name = target?.dataset.specialistEvent;
      if (name === 'refine' || name === 'profile_open') {
        trackLenderEvent(`specialist_search_${name}`, dimensions);
      }
    };
    const onToggle = (event: Event) => {
      const details = event.target instanceof HTMLDetailsElement ? event.target : null;
      if (details?.open && details.dataset.specialistEvent === 'trace_open') {
        trackLenderEvent('specialist_search_trace_open', dimensions);
      }
    };
    results?.addEventListener('click', onClick);
    results?.addEventListener('toggle', onToggle, true);
    return () => {
      results?.removeEventListener('click', onClick);
      results?.removeEventListener('toggle', onToggle, true);
    };
  }, [dimensions, resultCount]);
  return null;
}
