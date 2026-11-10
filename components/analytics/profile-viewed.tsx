'use client';

import { useEffect } from 'react';
import { captureTrustEvent } from '@/lib/analytics/trusthub';
import { TRUSTHUB_EVENTS } from '@/lib/analytics/trusthub-events';

export function ProfileViewed({ surface = 'lender_profile' }: { surface?: string }) {
  useEffect(() => {
    captureTrustEvent(TRUSTHUB_EVENTS.PROFILE_VIEWED, { surface, success: true });
  }, [surface]);
  return null;
}
