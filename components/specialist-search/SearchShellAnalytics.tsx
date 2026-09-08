'use client';

import { useEffect } from 'react';
import { trackLenderEvent } from '@/lib/analytics/ga-events';

export function SearchShellAnalytics() {
  useEffect(() => {
    const form = document.getElementById('lender-specialist-search');
    const submit = () => trackLenderEvent('specialist_search_submit', { hub: 'lender' });
    form?.addEventListener('submit', submit);
    return () => form?.removeEventListener('submit', submit);
  }, []);
  return null;
}
