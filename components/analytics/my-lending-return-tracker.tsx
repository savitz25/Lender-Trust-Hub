'use client';

import { useEffect } from 'react';
import { trackMyLendingReturn } from '@/lib/analytics/ga-events';

/** Fire once per session when user opens My Lending surfaces. */
export function MyLendingReturnTracker() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem('lth_my_lending_return')) return;
      sessionStorage.setItem('lth_my_lending_return', '1');
    } catch {
      /* ignore */
    }
    trackMyLendingReturn();
  }, []);

  return null;
}
