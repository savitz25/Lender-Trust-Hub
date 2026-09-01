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

  switch (context) {
    case 'lender-closing':
    case 'lender-le-tool':
    case 'lender-county':
      return {
        label: 'Planning the rest of the purchase?',
        body: `After financing, research homeowners and other relevant coverage in ${place}. Educational only — not a quote marketplace.`,
        links: [
          {
            href: insuranceHref,
            label: 'Research insurance coverage',
          },
        ],
      };
    case 'lender-calculator': {
      const fromMove = geography?.journey === 'relocate';
      const links = [
        {
          href: insuranceHref,
          label: 'Research insurance coverage',
        },
      ];
      if (fromMove) {
        links.push({
          href: moveHref,
          label: 'Plan your move',
        });
      }
      return {
        label: 'Planning the rest of the purchase?',
        body: fromMove
          ? 'After financing, research homeowners and other relevant coverage. You arrived from a relocation path — mover research stays available.'
          : 'After financing, research homeowners and other relevant coverage. Educational only — not a quote marketplace.',
        links,
      };
    }
    case 'lender-directory': {
      const fromMove = geography?.journey === 'relocate';
      const links = [
        {
          href: insuranceHref,
          label: 'Research insurance coverage',
        },
      ];
      if (fromMove) {
        links.push({
          href: moveHref,
          label: 'Plan your move',
        });
      }
      return {
        label: 'Planning the rest of the purchase?',
        body: fromMove
          ? 'Financing is one part of buying in a new area. Next: coverage research, and your move plan if you are still relocating.'
          : 'Financing is one part of buying. Next for many buyers: homeowners and other relevant coverage. Relocating is not assumed.',
        links,
      };
    }
    default: {
      const _exhaustive: never = context;
      return _exhaustive;
    }
  }
}
