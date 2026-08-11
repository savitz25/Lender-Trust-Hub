'use client';

import { useEffect } from 'react';
import { trackJourneyLanding } from '@/lib/analytics/ga-events';
import type { JourneyContext } from '@/lib/network/journey-context';
import { hasJourneyContext } from '@/lib/network/journey-context';

/** Fire once when a contextual journey landing is shown. */
export function JourneyLandingTracker({
  context,
  landedOn,
}: {
  context: JourneyContext;
  landedOn: 'county' | 'state' | 'hub' | 'tool' | 'other';
}) {
  useEffect(() => {
    if (!hasJourneyContext(context)) return;
    trackJourneyLanding({
      src: context.src,
      journey: context.journey,
      intent: context.intent,
      state: context.stateCode || context.stateSlug,
      county: context.county,
      landed_on: landedOn,
    });
  }, [context, landedOn]);

  return null;
}
