/**
 * FL / TX down-payment assistance research layer.
 * Official starting points only — not a county-by-county DPA inventory.
 * Do not invent income limits, dollar amounts, or open/closed status.
 */

export type OfficialSource = {
  label: string;
  href: string;
  note?: string;
};

export type ProgramLocationNote = {
  stateSlug: string;
  stateName: string;
  /** High-level market research framing */
  general: string;
  /** Ordered “where to begin” research steps */
  researchSteps: string[];
  /** Common DPA themes (educational patterns, not a program list) */
  dpaThemes: string[];
  /** How DPA often interacts with FHA / conventional first mortgages */
  firstMortgageLayering: string[];
  /** Hard caveats — local variation, funding, uncertainty */
  caveats: string[];
  /** In-product next research links */
  nextResearch: { label: string; href: string }[];
  sources: OfficialSource[];
};

export const PROGRAM_LOCATION_NOTES: ProgramLocationNote[] = [
  {
    stateSlug: 'florida',
    stateName: 'Florida',
    general:
      'Florida buyers often start with statewide housing finance resources, then check whether a county or city has additional assistance. Florida Housing Finance Corporation (Florida Housing) is the primary statewide portal for many homebuyer-oriented products. Local governments and nonprofits may run separate programs with different rules, funding, and application windows. This site does not list every Florida county or city program.',
    researchSteps: [
      'Open the Florida Housing Finance Corporation homebuyer overview and note which product families are currently published (names and rules change).',
      'Use HUD’s counselor search to find a HUD-approved housing counselor in Florida—many assistance paths expect or require education.',
      'Ask whether assistance is a grant, forgivable second, deferred second, or other structure, and what happens if you sell or refinance early.',
      'Confirm how any assistance layers with a first mortgage (often FHA or conventional) and whether the first-loan lender participates in that assistance path.',
      'Treat county or city “first-time buyer” pages as separate research tracks—do not assume statewide and local stacks always combine.',
    ],
    dpaThemes: [
      'First-time buyer definitions are common (sometimes “first-time in X years” or primary residence focus)—always read the current program definition.',
      'Income limits and purchase-price caps often track area median income or program-specific ceilings that vary by county.',
      'Homebuyer education or counseling certificates are frequently required before closing.',
      'Funding can be limited; programs may pause when allocations are exhausted.',
      'Occupancy (usually primary residence) and property eligibility rules typically apply.',
    ],
    firstMortgageLayering: [
      'DPA is usually a second layer of help, not a standalone first mortgage.',
      'Many Florida research paths pair assistance with FHA when cash-to-close is tight—FHA MIP still applies on the first loan if that product is used.',
      'Conventional first mortgages can also appear with some assistance structures; private mortgage insurance (PMI) rules still follow the conventional product.',
      'Gift funds, seller credits, and DPA each have different documentation rules—stack carefully under the first-loan guidelines.',
      'Compare total cost of ownership (rate, MIP/PMI, second-lien terms), not only cash needed at closing.',
    ],
    caveats: [
      'Program names, income limits, and availability change—never treat this page as live inventory.',
      'County and city assistance (where it exists) can differ sharply from statewide offerings.',
      'We do not determine eligibility, reserve funds, or match you to a lender application.',
      'Participating lenders and interest-rate structures (if any) are set by the program administrator, not Lender Trust Hub.',
    ],
    nextResearch: [
      { label: 'Florida DPA overview (this site)', href: '/programs/down-payment-assistance#florida' },
      { label: 'FHA educational overview', href: '/programs/fha' },
      { label: 'Conventional baseline overview', href: '/programs/conventional' },
      { label: 'Program finder (Florida)', href: '/tools/program-finder?state=florida' },
      { label: 'Florida lenders directory', href: '/local-lenders/florida' },
    ],
    sources: [
      {
        label: 'Florida Housing Finance Corporation',
        href: 'https://www.floridahousing.org/',
        note: 'Statewide housing finance agency portal',
      },
      {
        label: 'Florida Housing — Homebuyer overview',
        href: 'https://www.floridahousing.org/programs/homebuyer-overview-page',
        note: 'Published homebuyer program families (confirm current offerings)',
      },
      {
        label: 'HUD — Find a housing counselor',
        href: 'https://www.hud.gov/findacounselor',
        note: 'HUD-approved counseling; often required for assistance paths',
      },
      {
        label: 'CFPB — What is down payment assistance?',
        href: 'https://www.consumerfinance.gov/ask-cfpb/what-is-down-payment-assistance-en-120/',
        note: 'General consumer education',
      },
      {
        label: 'CFPB — FHA loans (educational)',
        href: 'https://www.consumerfinance.gov/owning-a-home/explore/fha-loan/',
      },
    ],
  },
  {
    stateSlug: 'texas',
    stateName: 'Texas',
    general:
      'Texas buyers commonly research both statewide channels and local city/county assistance. Two frequent official starting points are the Texas Department of Housing and Community Affairs (TDHCA) Welcome Home homebuyer resources and the Texas State Affordable Housing Corporation (TSAHC). Local housing departments and nonprofits may offer additional help. This site does not inventory every Texas county or city program.',
    researchSteps: [
      'Review TDHCA Welcome Home / homebuyer program pages for currently published statewide pathways (including education and any credit-certificate style tools where listed).',
      'Review TSAHC homebuyer and down-payment assistance pages for corporation-sponsored products and education requirements—confirm what is open now.',
      'Use HUD’s counselor search for a HUD-approved counselor in Texas when education or counseling is expected.',
      'Clarify whether help is a grant, second lien, deferred loan, or other structure, and repayment triggers (sale, refinance, non-occupancy).',
      'Confirm first-mortgage pairing (often FHA or conventional) and whether a participating lender is required by that assistance channel.',
    ],
    dpaThemes: [
      'First-time buyer or targeted-occupation themes appear in some Texas assistance marketing—always verify current eligibility definitions on the official site.',
      'Income and purchase-price limits are common and can vary by area and program.',
      'Homebuyer education is frequently required before funds are used.',
      'Funding cycles matter; some pathways close when allocations are used.',
      'Primary residence occupancy and property standards typically apply.',
    ],
    firstMortgageLayering: [
      'Texas DPA research almost always assumes a first mortgage underneath the assistance.',
      'FHA is a frequent first-loan research path when cash-to-close is limited; FHA mortgage insurance still follows FHA rules.',
      'Conventional first mortgages may pair with some assistance structures; PMI (if any) still follows that conventional product.',
      'Mortgage credit certificate–style tools (where offered by an official agency) are a different research track from cash DPA—read official definitions carefully.',
      'Total cost includes first-loan rate/fees, any MI, and second-lien or assistance terms—not cash-to-close alone.',
    ],
    caveats: [
      'Statewide portals and local city/county programs are separate research tracks.',
      'We do not list every municipal DPA in Texas or guarantee current funding.',
      'No eligibility determination, pre-approval, or lender lead routing on this site.',
      'Confirm names, fees, and lender lists only on official agency pages.',
    ],
    nextResearch: [
      { label: 'Texas DPA overview (this site)', href: '/programs/down-payment-assistance#texas' },
      { label: 'FHA educational overview', href: '/programs/fha' },
      { label: 'Conventional baseline overview', href: '/programs/conventional' },
      { label: 'Program finder (Texas)', href: '/tools/program-finder?state=texas' },
      { label: 'Texas lenders directory', href: '/local-lenders/texas' },
    ],
    sources: [
      {
        label: 'Texas Department of Housing and Community Affairs (TDHCA)',
        href: 'https://www.tdhca.texas.gov/',
        note: 'State housing agency',
      },
      {
        label: 'TDHCA Welcome Home — programs',
        href: 'https://welcomehome.tdhca.texas.gov/programs',
        note: 'Published homebuyer-oriented program listings (confirm currency)',
      },
      {
        label: 'Texas State Affordable Housing Corporation (TSAHC)',
        href: 'https://www.tsahc.org/',
        note: 'Statewide nonprofit housing finance corporation',
      },
      {
        label: 'TSAHC — loans & down payment assistance',
        href: 'https://www.tsahc.org/homebuyers-renters/loans-down-payment-assistance',
        note: 'DPA-oriented product pages (confirm open status)',
      },
      {
        label: 'HUD — Find a housing counselor',
        href: 'https://www.hud.gov/findacounselor',
      },
      {
        label: 'CFPB — What is down payment assistance?',
        href: 'https://www.consumerfinance.gov/ask-cfpb/what-is-down-payment-assistance-en-120/',
      },
    ],
  },
];

export function getProgramLocationNote(
  stateSlug: string | undefined | null
): ProgramLocationNote | undefined {
  if (!stateSlug) return undefined;
  return PROGRAM_LOCATION_NOTES.find((n) => n.stateSlug === stateSlug);
}

export function isDpaPriorityState(stateSlug: string | undefined | null): boolean {
  return stateSlug === 'florida' || stateSlug === 'texas';
}

/** Short blurb for CTAs / finder chips — no eligibility claims. */
export function dpaStateCtaCopy(stateSlug: string): string | null {
  if (stateSlug === 'florida') {
    return 'Florida: start with Florida Housing and local counseling—not a complete county DPA list.';
  }
  if (stateSlug === 'texas') {
    return 'Texas: start with TDHCA Welcome Home and TSAHC—plus any city/county programs separately.';
  }
  return null;
}
