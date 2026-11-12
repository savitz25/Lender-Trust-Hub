'use client';

import { useEffect } from 'react';
import { trackLenderEvent } from '@/lib/analytics/ga-events';
import { captureTrustEvent } from '@/lib/analytics/trusthub';
import { TRUSTHUB_EVENTS } from '@/lib/analytics/trusthub-events';
import { lenderResultCountBucket, type LenderSearchAnalytics } from '@/lib/specialist-search/analytics';

export function SearchAnalytics({
  dimensions,
  resultCount,
  success,
  capabilityState,
}: {
  dimensions: LenderSearchAnalytics;
  resultCount: number;
  success: boolean;
  capabilityState?: string;
}) {
  useEffect(() => {
    trackLenderEvent('specialist_search_interpreted', dimensions);
    trackLenderEvent(resultCount ? 'specialist_search_results' : 'specialist_search_zero_results', { ...dimensions, resultCountBucket: lenderResultCountBucket(resultCount) });
    captureTrustEvent(TRUSTHUB_EVENTS.SEARCH_RESULTS_RETURNED, {
      surface: 'ask',
      result_count: resultCount,
      success,
      state: dimensions.state,
      capability_state: capabilityState,
    });

    const results = document.querySelector('.intel-ask-result');
    const onClick = (event: Event) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-specialist-event]') : null;
      const name = target?.dataset.specialistEvent;
      if (name === 'refine' || name === 'profile_open') {
        trackLenderEvent(`specialist_search_${name}`, dimensions);
      }
      if (name === 'profile_open') {
        captureTrustEvent(
          TRUSTHUB_EVENTS.SEARCH_RESULT_OPENED,
          { surface: 'ask', state: dimensions.state, success: true },
          { sendBeforeUnload: true },
        );
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
  }, [capabilityState, dimensions, resultCount, success]);
  return null;
}
