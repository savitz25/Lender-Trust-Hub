/**
 * Contextual journey handoffs (Lender).
 * Builds crawlable absolute URLs with Stage A′ journey context.
 */

import {
  buildInsuranceJourneyUrl,
  buildMoveJourneyUrl,
  type JourneyContext,
} from '@/lib/network/journey-context';
import { normalizeState } from '@/lib/network/journey-context';

export type LifeJourneyContext =
  | 'lender-closing'
  | 'lender-calculator'
  | 'lender-directory'
  | 'lender-le-tool'
  | 'lender-county';

export type LifeJourneyGeography = {
  state?: string;
  stateCode?: string;
  stateSlug?: string;
  city?: string;
  county?: string;
  intent?: JourneyContext['intent'];
  journey?: JourneyContext['journey'];
};

export type LifeJourneyLink = {
  href: string;
  label: string;
};

export type LifeJourneyContent = {
  label: string;
  body: string;
  links: LifeJourneyLink[];
};

function toJourneyCtx(geo?: LifeJourneyGeography): JourneyContext {
  const st = normalizeState(geo?.stateCode || geo?.stateSlug || geo?.state);
  return {
    src: 'lender',
    journey: geo?.journey ?? 'purchase',
    intent: geo?.intent ?? 'buy',
    stateSlug: st?.stateSlug ?? geo?.stateSlug,
    stateCode: st?.stateCode ?? geo?.stateCode,
    stateName: st?.stateName,
    county: geo?.county,
  };
}

export function resolveLifeJourney(
  context: LifeJourneyContext,
  geography?: LifeJourneyGeography
): LifeJourneyContent {
  const ctx = toJourneyCtx(geography);
  const place =
    ctx.stateName && ctx.county
      ? `${ctx.county
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')} County, ${ctx.stateName}`
      : ctx.stateName || 'your market';
  const insuranceHref = buildInsuranceJourneyUrl(ctx);
  const moveHref = buildMoveJourneyUrl({ ...ctx, journey: 'relocate' });
  const label = 'Continue your Trust journey';

  switch (context) {
    case 'lender-closing':
    case 'lender-le-tool':
    case 'lender-county':
      return {
        label,
        body: `Homeowners insurance is typically required to close. Research coverage considerations in ${place} — educational only, not a quote marketplace.`,
        links: [
          {
            href: insuranceHref,
            label: 'Research coverage considerations',
          },
        ],
      };
    case 'lender-calculator':
      return {
        label,
        body: 'A payment estimate is one research step. Many buyers also research homeowners coverage — and movers if relocating.',
        links: [
          {
            href: insuranceHref,
            label: 'Research homeowners insurance',
          },
          {
            href: moveHref,
            label: 'Research licensed movers',
          },
        ],
      };
    case 'lender-directory':
      return {
        label,
        body: 'Financing is one part of buying. Next for many buyers: coverage research, then the move if you’re relocating.',
        links: [
          {
            href: insuranceHref,
            label: 'Research coverage options',
          },
          {
            href: moveHref,
            label: 'Research interstate movers',
          },
        ],
      };
    default: {
      const _exhaustive: never = context;
      return _exhaustive;
    }
  }
}
