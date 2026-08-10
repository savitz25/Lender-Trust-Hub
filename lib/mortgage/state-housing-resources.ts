/**
 * Phase 4 — state housing / DPA / regulator handoffs.
 * Only primary official sources. Omit when we do not have a confirmed URL.
 */

export type HousingResourceLink = {
  label: string;
  href: string;
  note: string;
};

export type StateHousingResources = {
  stateSlug: string;
  resources: HousingResourceLink[];
};

const NMLS: HousingResourceLink = {
  label: 'NMLS Consumer Access',
  href: 'https://www.nmlsconsumeraccess.org/',
  note: 'Confirm company and individual licenses before you apply',
};

const CFPB: HousingResourceLink = {
  label: 'CFPB — Owning a Home',
  href: 'https://www.consumerfinance.gov/owning-a-home/',
  note: 'Educational tools and Loan Estimate guides',
};

const HUD: HousingResourceLink = {
  label: 'HUD housing counseling',
  href: 'https://www.hud.gov/findacounselor',
  note: 'Find a HUD-approved housing counselor',
};

/** State-specific official housing finance / DPA style agencies when known. */
const BY_STATE: Record<string, HousingResourceLink[]> = {
  florida: [
    {
      label: 'Florida Housing Finance Corporation',
      href: 'https://www.floridahousing.org/',
      note: 'State housing finance and homebuyer program portal',
    },
    {
      label: 'Florida Housing — Homebuyer overview',
      href: 'https://www.floridahousing.org/programs/homebuyer-overview-page',
      note: 'Published homebuyer program families (confirm currency and funding)',
    },
  ],
  california: [
    {
      label: 'CalHFA (California Housing Finance Agency)',
      href: 'https://www.calhfa.ca.gov/',
      note: 'California homeownership and down payment program information',
    },
  ],
  texas: [
    {
      label: 'Texas Department of Housing and Community Affairs',
      href: 'https://www.tdhca.texas.gov/',
      note: 'Texas housing programs and homebuyer resources',
    },
    {
      label: 'TDHCA Welcome Home — programs',
      href: 'https://welcomehome.tdhca.texas.gov/programs',
      note: 'Published statewide homebuyer-oriented pathways (confirm current offerings)',
    },
    {
      label: 'Texas State Affordable Housing Corporation (TSAHC)',
      href: 'https://www.tsahc.org/homebuyers-renters/loans-down-payment-assistance',
      note: 'TSAHC loans and down-payment assistance research starting point',
    },
  ],
  'new-york': [
    {
      label: 'New York State Homes and Community Renewal',
      href: 'https://hcr.ny.gov/',
      note: 'NY housing and homeownership resources',
    },
  ],
  georgia: [
    {
      label: 'Georgia Department of Community Affairs',
      href: 'https://www.dca.ga.gov/',
      note: 'Georgia housing and community development resources',
    },
  ],
  arizona: [
    {
      label: 'Arizona Department of Housing',
      href: 'https://housing.az.gov/',
      note: 'Arizona housing resources',
    },
  ],
  washington: [
    {
      label: 'Washington State Housing Finance Commission',
      href: 'https://www.wshfc.org/',
      note: 'Washington homebuyer and housing finance programs',
    },
  ],
  colorado: [
    {
      label: 'CHFA (Colorado Housing and Finance Authority)',
      href: 'https://www.chfainfo.com/',
      note: 'Colorado homeownership program information',
    },
  ],
  massachusetts: [
    {
      label: 'MassHousing',
      href: 'https://www.masshousing.com/',
      note: 'Massachusetts homeownership and housing finance resources',
    },
  ],
  illinois: [
    {
      label: 'Illinois Housing Development Authority',
      href: 'https://www.ihda.org/',
      note: 'Illinois homebuyer and housing resources',
    },
  ],
  michigan: [
    {
      label: 'MSHDA (Michigan State Housing Development Authority)',
      href: 'https://www.michigan.gov/mshda',
      note: 'Michigan homeownership programs',
    },
  ],
  pennsylvania: [
    {
      label: 'PHFA (Pennsylvania Housing Finance Agency)',
      href: 'https://www.phfa.org/',
      note: 'Pennsylvania homeownership resources',
    },
  ],
  'north-carolina': [
    {
      label: 'NCHFA (North Carolina Housing Finance Agency)',
      href: 'https://www.nchfa.com/',
      note: 'North Carolina homebuyer programs',
    },
  ],
  'south-carolina': [
    {
      label: 'SC Housing',
      href: 'https://www.schousing.com/',
      note: 'South Carolina housing finance resources',
    },
  ],
  tennessee: [
    {
      label: 'THDA (Tennessee Housing Development Agency)',
      href: 'https://thda.org/',
      note: 'Tennessee homeownership resources',
    },
  ],
  'new-jersey': [
    {
      label: 'New Jersey Housing and Mortgage Finance Agency',
      href: 'https://www.njhousing.gov/',
      note: 'New Jersey housing and mortgage finance resources',
    },
  ],
};

export function getStateHousingResources(stateSlug: string): HousingResourceLink[] {
  const stateSpecific = BY_STATE[stateSlug] ?? [];
  return [NMLS, ...stateSpecific, CFPB, HUD];
}
