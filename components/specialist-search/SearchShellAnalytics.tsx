'use client';

import { useEffect } from 'react';
import { trackLenderEvent } from '@/lib/analytics/ga-events';
import { captureTrustEvent } from '@/lib/analytics/trusthub';
import { TRUSTHUB_EVENTS } from '@/lib/analytics/trusthub-events';

export function SearchShellAnalytics() {
  useEffect(() => {
    const form = document.getElementById('lender-specialist-search');
    const root = form?.closest('.intel-ask-panel') ?? document;
    const submit = () => {
      trackLenderEvent('specialist_search_submit', { hub: 'lender' });
      captureTrustEvent(
        TRUSTHUB_EVENTS.SEARCH_SUBMITTED,
        { surface: 'ask_form', success: true },
        { sendBeforeUnload: true },
      );
    };
    const onClick = (event: Event) => {
      const target = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!target?.closest('.intel-ask-examples')) return;
      const href = target.getAttribute('href') || '';
      if (!href.startsWith('/ask?')) return;
      captureTrustEvent(
        TRUSTHUB_EVENTS.SEARCH_SUBMITTED,
        { surface: 'ask_example', success: true },
        { sendBeforeUnload: true },
      );
    };
    form?.addEventListener('submit', submit);
    root.addEventListener('click', onClick);
    return () => {
      form?.removeEventListener('submit', submit);
      root.removeEventListener('click', onClick);
    };
  }, []);
  return null;
}
