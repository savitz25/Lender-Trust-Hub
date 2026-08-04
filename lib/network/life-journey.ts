/**
 * Contextual journey handoffs (Lender standalone).
 * Max 2 outbound links. Not for every lender profile.
 */

export type LifeJourneyContext =
  | 'lender-closing'
  | 'lender-calculator'
  | 'lender-directory';

export type LifeJourneyGeography = {
  state?: string;
  stateCode?: string;
  stateSlug?: string;
  city?: string;
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

const MOVE_VERIFY = 'https://www.movetrusthub.com/verify-dot';
const MOVE_HOME = 'https://www.movetrusthub.com/';
const INSURANCE_DIR = 'https://www.insurancetrusthub.com/directory';

function insuranceHref(geo?: LifeJourneyGeography): string {
  const code = geo?.stateCode?.toUpperCase();
  if (code && /^[A-Z]{2}$/.test(code)) {
    return `https://www.insurancetrusthub.com/directory?state=${code}`;
  }
  return INSURANCE_DIR;
}

export function resolveLifeJourney(
  context: LifeJourneyContext,
  geography?: LifeJourneyGeography
): LifeJourneyContent {
  const label = 'Next in your journey';

  switch (context) {
    case 'lender-closing':
      return {
        label,
        body: 'Financing is one part of buying. Lenders often require homeowners insurance — research DOI-licensed options independently (verify licenses on the regulator).',
        links: [
          {
            href: insuranceHref(geography),
            label: 'Research DOI-licensed insurance options',
          },
        ],
      };
    case 'lender-calculator':
      return {
        label,
        body: 'A payment estimate is one step in buying. Next for many buyers: homeowners coverage research — and movers if you’re relocating.',
        links: [
          {
            href: insuranceHref(geography),
            label: 'Research homeowners insurance',
          },
          {
            href: MOVE_VERIFY,
            label: 'Research FMCSA-verified movers',
          },
        ],
      };
    case 'lender-directory':
      return {
        label,
        body: 'Financing is one part of buying. Next for many buyers: homeowners coverage research, then the move if you’re relocating.',
        links: [
          {
            href: insuranceHref(geography),
            label: 'Research homeowners insurance options',
          },
          {
            href: MOVE_HOME,
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
