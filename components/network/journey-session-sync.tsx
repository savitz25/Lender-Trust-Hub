'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  hasJourneyContext,
  type JourneyContext,
  type JourneySrc,
} from '@/lib/network/journey-context';
import {
  loadResearchSession,
  mergeJourneyContext,
  saveResearchSession,
  sessionToJourneyContext,
} from '@/lib/network/research-session';
import { JourneyOrientationBanner } from '@/components/network/journey-orientation-banner';
import { ContinueTrustJourney } from '@/components/network/continue-trust-journey';
import { trackJourneyLanding } from '@/lib/analytics/ga-events';

type Props = {
  /** Context from URL + page geography (server) */
  urlContext: JourneyContext;
  preferSrc?: JourneySrc;
  currentHub?: JourneySrc;
  /** Show orientation when merged context has place/intent (quiet restore OK) */
  showOrientation?: boolean;
  /** Show continue journey with merged (params + session) context */
  showContinue?: boolean;
  continueTitle?: string;
  /** When true, only persist/merge — no UI (effects still run) */
  silent?: boolean;
  landedOn?: 'county' | 'state' | 'hub' | 'tool' | 'other';
  className?: string;
};

/**
 * Stage B.1 — bridge URL params ↔ origin-local research session.
 * URL wins; session fills gaps; richer URL/page context updates session.
 */
export function JourneySessionSync({
  urlContext,
  preferSrc = 'lender',
  currentHub = 'lender',
  showOrientation = false,
  showContinue = false,
  continueTitle,
  silent = false,
  landedOn,
  className,
}: Props) {
  // Start from URL/page context so SSR + first paint keep crawlable handoffs.
  // Session gap-fill runs after mount (Stage B.1).
  const [merged, setMerged] = useState<JourneyContext>(urlContext);

  useEffect(() => {
    const sessionCtx = sessionToJourneyContext(loadResearchSession());
    const next = mergeJourneyContext(urlContext, sessionCtx);
    setMerged(next);

    // Persist when page/URL has useful non-PII context (including route geography)
    if (hasJourneyContext(urlContext)) {
      saveResearchSession(next, { preferSrc: urlContext.src ?? preferSrc });
    }

    if (landedOn && hasJourneyContext(next)) {
      trackJourneyLanding({
        src: next.src,
        journey: next.journey,
        intent: next.intent,
        state: next.stateCode || next.stateSlug,
        county: next.county,
        landed_on: landedOn,
      });
    }
  }, [urlContext, preferSrc, landedOn]);

  const continueCtx = useMemo(
    () => ({
      ...merged,
      src: merged.src ?? preferSrc,
      journey:
        merged.journey ??
        (currentHub === 'insurance' ? 'coverage' : currentHub === 'move' ? 'relocate' : 'purchase'),
    }),
    [merged, preferSrc, currentHub]
  );

  if (silent || (!showOrientation && !showContinue)) return null;
  if (!hasJourneyContext(merged)) return null;

  return (
    <div className={className}>
      {showOrientation ? <JourneyOrientationBanner context={merged} /> : null}
      {showContinue ? (
        <div className={showOrientation ? 'mt-6' : undefined}>
          <ContinueTrustJourney
            currentHub={currentHub}
            context={continueCtx}
            title={continueTitle}
          />
        </div>
      ) : null}
    </div>
  );
}

/**
 * Soft client redirect on national hub when session has state but URL does not.
 * Does not force redirect when the user is browsing without any stored place.
 */
export function ResearchSessionHubRedirect({
  hasUrlState,
  pathBuilder,
}: {
  hasUrlState: boolean;
  /** Build destination path from session state slug + optional county */
  pathBuilder?: (stateSlug: string, county?: string) => string;
}) {
  useEffect(() => {
    if (hasUrlState) return;
    const session = loadResearchSession();
    if (!session?.state) return;
    const st = sessionToJourneyContext(session);
    if (!st.stateSlug) return;
    const base =
      pathBuilder?.(st.stateSlug, st.county) ??
      (st.county
        ? `/local-lenders/${st.stateSlug}/${st.county}`
        : `/local-lenders/${st.stateSlug}`);
    const q = new URLSearchParams();
    if (session.src) q.set('src', session.src);
    if (session.journey) q.set('journey', session.journey);
    if (session.state) q.set('state', session.state);
    if (session.county) q.set('county', session.county);
    if (session.intent && session.intent !== 'unknown') q.set('intent', session.intent);
    if (session.housing && session.housing !== 'unknown') q.set('housing', session.housing);
    const qs = q.toString();
    window.location.replace(qs ? `${base}?${qs}` : base);
  }, [hasUrlState, pathBuilder]);

  return null;
}
