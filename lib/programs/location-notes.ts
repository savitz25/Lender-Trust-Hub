/**
 * State-aware program / DPA research notes (educational only).
 * Prefer official public sources. No eligibility claims, no applications, no lead-gen.
 *
 * Expansion: Tier 1 (CA, NC, GA, AZ, WA, CO) + Tier 2 (TN, VA, MD, NY, PA, IL, OH, NV, UT, OR)
 * plus deeper FL/TX modules. Not a nationwide city/county DPA inventory.
 */

export type OfficialSource = {
  label: string;
  href: string;
  note?: string;
};

/** @deprecated Use OfficialSource */
export type ProgramSourceLink = OfficialSource;

export type ProgramLocationNote = {
  /** URL fragment / dropdown value, e.g. florida */
  stateSlug: string;
  stateName: string;
  /** Expansion tier for maintainability notes */
  tier: 'deep' | 1 | 2;
  general: string;
  researchSteps: string[];
  dpaThemes: string[];
  firstMortgageLayering: string[];
  caveats: string[];
  nextResearch: { label: string; href: string }[];
  sources: OfficialSource[];
};

const SHARED_RESEARCH_TAIL = [
  'Ask which first mortgage product the assistance is designed to pair with (often FHA or conventional).',
  'Confirm household income limits, purchase-price caps, education requirements, and occupancy rules in writing.',
  'Treat city, county, employer, and nonprofit programs as separate research tracks from the state HFA.',
  'Use a HUD-approved housing counselor when you want neutral education—not a sales pitch.',
] as const;

const SHARED_CAVEATS = [
  'Program names, funding rounds, income limits, and layering rules change—always verify on the official site.',
  'This guide does not determine whether you qualify for any program.',
  'Local city/county assistance may exist even when the state HFA is closed or waitlisted—and vice versa.',
  'We do not inventory every local program and do not route lender leads from this content.',
] as const;

const SHARED_LAYERING = [
  'Many assistance products are structured to sit behind an FHA first mortgage (with MIP and FHA underwriting themes).',
  'Some programs are designed for conventional first mortgages (with PMI themes when down payment is below typical conventional thresholds).',
  'Always confirm that the first-lien product and assistance product are approved to work together before you budget around them.',
  'Compare total monthly payment (P&I + taxes + insurance + MIP/PMI) when assistance reduces cash to close but may change other costs.',
] as const;

function note(partial: Omit<ProgramLocationNote, 'caveats'> & { caveats?: string[] }): ProgramLocationNote {
  return {
    ...partial,
    caveats: partial.caveats ?? [...SHARED_CAVEATS],
  };
}

/** Shared official education sources appended to every state module */
const NATIONAL_SOURCES: OfficialSource[] = [
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
];

/**
 * Maintainable content modules — one object per expanded state.
 * Official starting points only; themes are plain-language research guidance.
 */
export const PROGRAM_LOCATION_NOTES: ProgramLocationNote[] = [
  // ── Deep (existing) ───────────────────────────────────────────────
  note({
    stateSlug: 'florida',
    stateName: 'Florida',
    tier: 'deep',
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
      ...NATIONAL_SOURCES,
    ],
  }),
  note({
    stateSlug: 'texas',
    stateName: 'Texas',
    tier: 'deep',
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
      ...NATIONAL_SOURCES,
    ],
  }),

  // ── Tier 1 ────────────────────────────────────────────────────────
  note({
    stateSlug: 'california',
    stateName: 'California',
    tier: 1,
    general:
      'California buyers often start with California Housing Finance Agency (CalHFA) for statewide first-time buyer and down payment assistance themes, then check city, county, or regional programs that can be highly local. High home prices mean income and purchase-price limits matter early in research.',
    researchSteps: [
      'Start at CalHFA for statewide homeownership and down payment assistance product overviews.',
      'Review current product names, rate/assistance structures, and published eligibility themes on official CalHFA pages.',
      ...SHARED_RESEARCH_TAIL,
    ],
    dpaThemes: [
      'CalHFA first mortgage and down payment assistance product families (names and terms change).',
      'First-time buyer definitions and education requirements that frequently apply.',
      'Income and purchase-price limits that vary by county and product.',
      'Possible silent second, deferred, or forgivable assistance structures depending on the product.',
      'City/county and employer-assisted programs that sit outside CalHFA and may have separate waitlists.',
    ],
    firstMortgageLayering: [...SHARED_LAYERING],
    nextResearch: [
      { label: 'Program Finder (California)', href: '/tools/program-finder?state=california' },
      { label: 'Down payment assistance overview', href: '/programs/down-payment-assistance#california' },
      { label: 'California mortgage lenders directory', href: '/local-lenders/california' },
      { label: 'Mortgage calculators', href: '/calculators' },
    ],
    sources: [
      { label: 'California Housing Finance Agency (CalHFA)', href: 'https://www.calhfa.ca.gov/' },
      {
        label: 'CalHFA — Homebuyers',
        href: 'https://www.calhfa.ca.gov/homebuyer/',
      },
      ...NATIONAL_SOURCES,
    ],
  }),
  note({
    stateSlug: 'north-carolina',
    stateName: 'North Carolina',
    tier: 1,
    general:
      'North Carolina buyers often research North Carolina Housing Finance Agency (NCHFA) homebuyer and assistance products, then check local government programs in growing metros. Treat NCHFA as the primary statewide starting point—not a guarantee of open funding.',
    researchSteps: [
      'Start at NCHFA for Home Advantage, down payment assistance, and related homebuyer product information.',
      'Read official fact sheets for income limits, credit themes, and first-mortgage pairing rules.',
      ...SHARED_RESEARCH_TAIL,
    ],
    dpaThemes: [
      'NCHFA statewide homebuyer and DPA-related products (product slate changes over time).',
      'Education or counseling steps common before closing with assistance.',
      'Income and purchase-price limits by household size and county.',
      'Possible second-lien or grant-style assistance depending on the product.',
      'Local city/county programs separate from NCHFA, especially in larger metros.',
    ],
    firstMortgageLayering: [...SHARED_LAYERING],
    nextResearch: [
      { label: 'Program Finder (North Carolina)', href: '/tools/program-finder?state=north-carolina' },
      { label: 'Down payment assistance overview', href: '/programs/down-payment-assistance#north-carolina' },
      { label: 'North Carolina mortgage lenders directory', href: '/local-lenders/north-carolina' },
      { label: 'Mortgage calculators', href: '/calculators' },
    ],
    sources: [
      { label: 'North Carolina Housing Finance Agency (NCHFA)', href: 'https://www.nchfa.com/' },
      {
        label: 'NCHFA — Homebuyers',
        href: 'https://www.nchfa.com/home-buyers',
      },
      ...NATIONAL_SOURCES,
    ],
  }),
  note({
    stateSlug: 'georgia',
    stateName: 'Georgia',
    tier: 1,
    general:
      'Georgia buyers commonly research Georgia Dream and other homeownership pathways through the Georgia Department of Community Affairs (DCA) / Georgia Housing, then check Atlanta-area or other local programs separately. Confirm current product status on official DCA pages.',
    researchSteps: [
      'Start at Georgia DCA / Georgia Dream homeownership pages for statewide assistance themes.',
      'Review income limits, eligible areas, and first-mortgage pairing notes on official materials.',
      ...SHARED_RESEARCH_TAIL,
    ],
    dpaThemes: [
      'Georgia Dream and related DCA homeownership / assistance products.',
      'Income, credit, and education themes that appear on official program materials.',
      'Possible deferred second mortgages or similar assistance structures (product-specific).',
      'Metro Atlanta and other local programs that are not the same as Georgia Dream.',
      'Funding cycles that can pause or reopen without long notice.',
    ],
    firstMortgageLayering: [...SHARED_LAYERING],
    nextResearch: [
      { label: 'Program Finder (Georgia)', href: '/tools/program-finder?state=georgia' },
      { label: 'Down payment assistance overview', href: '/programs/down-payment-assistance#georgia' },
      { label: 'Georgia mortgage lenders directory', href: '/local-lenders/georgia' },
      { label: 'Mortgage calculators', href: '/calculators' },
    ],
    sources: [
      {
        label: 'Georgia DCA — Georgia Dream Homeownership Program',
        href: 'https://www.dca.ga.gov/safe-affordable-housing/homeownership/georgia-dream-homeownership-program',
      },
      {
        label: 'Georgia Department of Community Affairs',
        href: 'https://www.dca.ga.gov/',
      },
      ...NATIONAL_SOURCES,
    ],
  }),
  note({
    stateSlug: 'arizona',
    stateName: 'Arizona',
    tier: 1,
    general:
      'Arizona buyers often research Arizona Department of Housing (ADOH) and related homebuyer / Home Plus–style pathways, then check Phoenix, Tucson, or other local programs. Desert metro growth means local overlays can matter as much as statewide products.',
    researchSteps: [
      'Start at Arizona Department of Housing for homebuyer and assistance program portals.',
      'Review any statewide Home Plus or similar product pages linked from official ADOH materials.',
      ...SHARED_RESEARCH_TAIL,
    ],
    dpaThemes: [
      'Statewide homebuyer and down payment assistance themes published via ADOH / related HFA channels.',
      'Income and purchase-price limits that vary by product and area.',
      'Education requirements common to many assistance products.',
      'City and county programs in major metros that operate independently.',
      'Seasonal or annual funding that can exhaust quickly in high-demand markets.',
    ],
    firstMortgageLayering: [...SHARED_LAYERING],
    nextResearch: [
      { label: 'Program Finder (Arizona)', href: '/tools/program-finder?state=arizona' },
      { label: 'Down payment assistance overview', href: '/programs/down-payment-assistance#arizona' },
      { label: 'Arizona mortgage lenders directory', href: '/local-lenders/arizona' },
      { label: 'Mortgage calculators', href: '/calculators' },
    ],
    sources: [
      { label: 'Arizona Department of Housing', href: 'https://housing.az.gov/' },
      {
        label: 'ADOH — Homebuyers / programs (official portal)',
        href: 'https://housing.az.gov/general-public/homebuyer-programs',
      },
      ...NATIONAL_SOURCES,
    ],
  }),
  note({
    stateSlug: 'washington',
    stateName: 'Washington',
    tier: 1,
    general:
      'Washington buyers often start with Washington State Housing Finance Commission (WSHFC) for Home Advantage and related down payment assistance themes, then check Seattle/King County and other local programs. High-cost western counties make limit checks especially important.',
    researchSteps: [
      'Start at WSHFC for Home Advantage, down payment assistance, and homebuyer education resources.',
      'Read official product pages for income limits, purchase-price caps, and first-mortgage pairing.',
      ...SHARED_RESEARCH_TAIL,
    ],
    dpaThemes: [
      'WSHFC Home Advantage and related assistance product families.',
      'Homebuyer education requirements that frequently apply.',
      'Income and purchase-price limits that can differ by county.',
      'Possible second-lien assistance structures (product-specific).',
      'Local government and nonprofit programs, especially in Puget Sound, that are separate from WSHFC.',
    ],
    firstMortgageLayering: [...SHARED_LAYERING],
    nextResearch: [
      { label: 'Program Finder (Washington)', href: '/tools/program-finder?state=washington' },
      { label: 'Down payment assistance overview', href: '/programs/down-payment-assistance#washington' },
      { label: 'Washington mortgage lenders directory', href: '/local-lenders/washington' },
      { label: 'Mortgage calculators', href: '/calculators' },
    ],
    sources: [
      { label: 'Washington State Housing Finance Commission (WSHFC)', href: 'https://www.wshfc.org/' },
      {
        label: 'WSHFC — Homebuyers',
        href: 'https://www.wshfc.org/buyers/',
      },
      ...NATIONAL_SOURCES,
    ],
  }),
  note({
    stateSlug: 'colorado',
    stateName: 'Colorado',
    tier: 1,
    general:
      'Colorado buyers often research Colorado Housing and Finance Authority (CHFA) homebuyer and down payment assistance products, then check Denver metro or mountain-community local programs. Confirm current CHFA product status on official pages before budgeting.',
    researchSteps: [
      'Start at CHFA for statewide home finance and down payment assistance overviews.',
      'Review CHFA first mortgage and assistance product fact sheets for limits and layering notes.',
      ...SHARED_RESEARCH_TAIL,
    ],
    dpaThemes: [
      'CHFA first mortgage and DPA-related product suites.',
      'Income limits, first-time buyer definitions, and education requirements.',
      'Possible grant or second-mortgage assistance structures (product-specific).',
      'Local city/county programs outside CHFA, especially along the Front Range.',
      'Funding availability that can change with bond capacity and demand.',
    ],
    firstMortgageLayering: [...SHARED_LAYERING],
    nextResearch: [
      { label: 'Program Finder (Colorado)', href: '/tools/program-finder?state=colorado' },
      { label: 'Down payment assistance overview', href: '/programs/down-payment-assistance#colorado' },
      { label: 'Colorado mortgage lenders directory', href: '/local-lenders/colorado' },
      { label: 'Mortgage calculators', href: '/calculators' },
    ],
    sources: [
      { label: 'Colorado Housing and Finance Authority (CHFA)', href: 'https://www.chfainfo.com/' },
      {
        label: 'CHFA — Home Finance',
        href: 'https://www.chfainfo.com/homeownership',
      },
      ...NATIONAL_SOURCES,
    ],
  }),

  // ── Tier 2 ────────────────────────────────────────────────────────
  note({
    stateSlug: 'tennessee',
    stateName: 'Tennessee',
    tier: 2,
    general:
      'Tennessee buyers often start with Tennessee Housing Development Agency (THDA) for Great Choice and related homebuyer / assistance themes, then check Nashville, Memphis, Knoxville, or other local programs.',
    researchSteps: [
      'Start at THDA for statewide homebuyer and down payment assistance product information.',
      'Review official Great Choice / assistance pages for income limits and pairing themes.',
      ...SHARED_RESEARCH_TAIL,
    ],
    dpaThemes: [
      'THDA statewide homebuyer and DPA-related products.',
      'Education requirements and first-time buyer definitions where applicable.',
      'Income and purchase-price limits by product.',
      'Local metro programs independent of THDA.',
    ],
    firstMortgageLayering: [...SHARED_LAYERING],
    nextResearch: [
      { label: 'Program Finder (Tennessee)', href: '/tools/program-finder?state=tennessee' },
      { label: 'Down payment assistance overview', href: '/programs/down-payment-assistance#tennessee' },
      { label: 'Tennessee mortgage lenders directory', href: '/local-lenders/tennessee' },
      { label: 'Mortgage calculators', href: '/calculators' },
    ],
    sources: [
      { label: 'Tennessee Housing Development Agency (THDA)', href: 'https://thda.org/' },
      {
        label: 'THDA — Homebuyers',
        href: 'https://thda.org/homebuyers',
      },
      ...NATIONAL_SOURCES,
    ],
  }),
  note({
    stateSlug: 'virginia',
    stateName: 'Virginia',
    tier: 2,
    general:
      'Virginia buyers often research Virginia Housing (formerly VHDA) for first-time buyer and down payment assistance themes, then check Northern Virginia, Richmond, or Hampton Roads local programs separately.',
    researchSteps: [
      'Start at Virginia Housing for homeownership and assistance program overviews.',
      'Review official product pages for income limits, education, and first-mortgage pairing.',
      ...SHARED_RESEARCH_TAIL,
    ],
    dpaThemes: [
      'Virginia Housing statewide homebuyer and assistance products.',
      'First-time buyer and education themes common on official materials.',
      'Income and purchase-price limits that vary by area and product.',
      'Local programs, especially in high-cost Northern Virginia, that are separate from the state HFA.',
    ],
    firstMortgageLayering: [...SHARED_LAYERING],
    nextResearch: [
      { label: 'Program Finder (Virginia)', href: '/tools/program-finder?state=virginia' },
      { label: 'Down payment assistance overview', href: '/programs/down-payment-assistance#virginia' },
      { label: 'Virginia mortgage lenders directory', href: '/local-lenders/virginia' },
      { label: 'Mortgage calculators', href: '/calculators' },
    ],
    sources: [
      { label: 'Virginia Housing', href: 'https://www.virginiahousing.com/' },
      {
        label: 'Virginia Housing — Homebuyers',
        href: 'https://www.virginiahousing.com/homebuyers',
      },
      ...NATIONAL_SOURCES,
    ],
  }),
  note({
    stateSlug: 'maryland',
    stateName: 'Maryland',
    tier: 2,
    general:
      'Maryland buyers often start with Maryland Mortgage Program / Department of Housing and Community Development (DHCD) pathways for statewide assistance themes, then research county programs (Maryland has active county-level options in many markets).',
    researchSteps: [
      'Start at Maryland Mortgage Program / DHCD homeownership pages for statewide products.',
      'Check your county housing department separately—Maryland local programs are common research targets.',
      ...SHARED_RESEARCH_TAIL,
    ],
    dpaThemes: [
      'Maryland Mortgage Program and related statewide assistance themes.',
      'Income limits and first-time buyer definitions on official MMP materials.',
      'County and municipal DPA that may layer with or replace state options.',
      'Education and counseling requirements common to many products.',
    ],
    firstMortgageLayering: [...SHARED_LAYERING],
    nextResearch: [
      { label: 'Program Finder (Maryland)', href: '/tools/program-finder?state=maryland' },
      { label: 'Down payment assistance overview', href: '/programs/down-payment-assistance#maryland' },
      { label: 'Maryland mortgage lenders directory', href: '/local-lenders/maryland' },
      { label: 'Mortgage calculators', href: '/calculators' },
    ],
    sources: [
      { label: 'Maryland Mortgage Program', href: 'https://mmp.maryland.gov/' },
      {
        label: 'Maryland DHCD',
        href: 'https://dhcd.maryland.gov/',
      },
      ...NATIONAL_SOURCES,
    ],
  }),
  note({
    stateSlug: 'new-york',
    stateName: 'New York',
    tier: 2,
    general:
      'New York buyers often research Homes and Community Renewal (HCR) / SONYMA for statewide first-time buyer and assistance themes, then treat NYC and other local programs as entirely separate research tracks with their own rules and lotteries.',
    researchSteps: [
      'Start at NYS Homes and Community Renewal / SONYMA for statewide homeownership products.',
      'If purchasing in NYC or another large city, open that city’s housing agency site as a second research path.',
      ...SHARED_RESEARCH_TAIL,
    ],
    dpaThemes: [
      'SONYMA / HCR statewide first-time buyer and assistance-related products.',
      'Income and purchase-price limits that can be tight in high-cost regions.',
      'NYC and other municipal programs that are not the same as SONYMA.',
      'Education requirements and participating-lender concepts on official materials.',
    ],
    firstMortgageLayering: [...SHARED_LAYERING],
    nextResearch: [
      { label: 'Program Finder (New York)', href: '/tools/program-finder?state=new-york' },
      { label: 'Down payment assistance overview', href: '/programs/down-payment-assistance#new-york' },
      { label: 'New York mortgage lenders directory', href: '/local-lenders/new-york' },
      { label: 'Mortgage calculators', href: '/calculators' },
    ],
    sources: [
      { label: 'NYS Homes and Community Renewal (HCR)', href: 'https://hcr.ny.gov/' },
      {
        label: 'SONYMA (via HCR)',
        href: 'https://hcr.ny.gov/sonyma',
      },
      ...NATIONAL_SOURCES,
    ],
  }),
  note({
    stateSlug: 'pennsylvania',
    stateName: 'Pennsylvania',
    tier: 2,
    general:
      'Pennsylvania buyers often start with Pennsylvania Housing Finance Agency (PHFA) for Keystone Home Loan and related down payment assistance themes, then check Philadelphia, Pittsburgh, or other local programs.',
    researchSteps: [
      'Start at PHFA for statewide homebuyer and assistance product overviews.',
      'Review official Keystone / DPA materials for income limits and first-mortgage pairing.',
      ...SHARED_RESEARCH_TAIL,
    ],
    dpaThemes: [
      'PHFA statewide homebuyer and DPA-related products.',
      'Income limits, credit themes, and education requirements on official pages.',
      'Possible second-lien assistance structures (product-specific).',
      'City programs independent of PHFA.',
    ],
    firstMortgageLayering: [...SHARED_LAYERING],
    nextResearch: [
      { label: 'Program Finder (Pennsylvania)', href: '/tools/program-finder?state=pennsylvania' },
      { label: 'Down payment assistance overview', href: '/programs/down-payment-assistance#pennsylvania' },
      { label: 'Pennsylvania mortgage lenders directory', href: '/local-lenders/pennsylvania' },
      { label: 'Mortgage calculators', href: '/calculators' },
    ],
    sources: [
      { label: 'Pennsylvania Housing Finance Agency (PHFA)', href: 'https://www.phfa.org/' },
      {
        label: 'PHFA — Homebuyers',
        href: 'https://www.phfa.org/homebuyers/',
      },
      ...NATIONAL_SOURCES,
    ],
  }),
  note({
    stateSlug: 'illinois',
    stateName: 'Illinois',
    tier: 2,
    general:
      'Illinois buyers often research Illinois Housing Development Authority (IHDA) for statewide homebuyer and assistance themes, then check Chicago / Cook County and other local programs as separate tracks.',
    researchSteps: [
      'Start at IHDA for statewide homeownership and down payment assistance information.',
      'If buying in Chicago or Cook County, open those housing agency sites as additional research paths.',
      ...SHARED_RESEARCH_TAIL,
    ],
    dpaThemes: [
      'IHDA statewide homebuyer and DPA-related products.',
      'Income and purchase-price limits by product and area.',
      'Chicago-area local programs that are not IHDA.',
      'Education and counseling requirements common to assistance products.',
    ],
    firstMortgageLayering: [...SHARED_LAYERING],
    nextResearch: [
      { label: 'Program Finder (Illinois)', href: '/tools/program-finder?state=illinois' },
      { label: 'Down payment assistance overview', href: '/programs/down-payment-assistance#illinois' },
      { label: 'Illinois mortgage lenders directory', href: '/local-lenders/illinois' },
      { label: 'Mortgage calculators', href: '/calculators' },
    ],
    sources: [
      { label: 'Illinois Housing Development Authority (IHDA)', href: 'https://www.ihda.org/' },
      {
        label: 'IHDA — Homeownership',
        href: 'https://www.ihda.org/homebuyers/',
      },
      ...NATIONAL_SOURCES,
    ],
  }),
  note({
    stateSlug: 'ohio',
    stateName: 'Ohio',
    tier: 2,
    general:
      'Ohio buyers often start with Ohio Housing Finance Agency (OHFA) for statewide first-time buyer and down payment assistance themes, then check Columbus, Cleveland, Cincinnati, or other local programs.',
    researchSteps: [
      'Start at OHFA (ohiohome.org) for statewide homebuyer and assistance product overviews.',
      'Review official product pages for income limits, education, and layering notes.',
      ...SHARED_RESEARCH_TAIL,
    ],
    dpaThemes: [
      'OHFA statewide homebuyer and DPA-related products.',
      'First-time buyer definitions and education requirements where applicable.',
      'Income and purchase-price limits by product.',
      'Local city/county programs independent of OHFA.',
    ],
    firstMortgageLayering: [...SHARED_LAYERING],
    nextResearch: [
      { label: 'Program Finder (Ohio)', href: '/tools/program-finder?state=ohio' },
      { label: 'Down payment assistance overview', href: '/programs/down-payment-assistance#ohio' },
      { label: 'Ohio mortgage lenders directory', href: '/local-lenders/ohio' },
      { label: 'Mortgage calculators', href: '/calculators' },
    ],
    sources: [
      { label: 'Ohio Housing Finance Agency (OHFA)', href: 'https://ohiohome.org/' },
      {
        label: 'OHFA — Homebuyers',
        href: 'https://ohiohome.org/homebuyers/',
      },
      ...NATIONAL_SOURCES,
    ],
  }),
  note({
    stateSlug: 'nevada',
    stateName: 'Nevada',
    tier: 2,
    general:
      'Nevada buyers often research Nevada Housing Division programs for statewide homebuyer and assistance themes, then check Las Vegas / Clark County and Reno-area local options. Fast-growth markets can exhaust funding quickly.',
    researchSteps: [
      'Start at Nevada Housing Division for homebuyer and assistance program information.',
      'Review official product pages for limits, education, and first-mortgage pairing.',
      ...SHARED_RESEARCH_TAIL,
    ],
    dpaThemes: [
      'Statewide Nevada Housing Division homebuyer / DPA themes.',
      'Income and purchase-price limits that vary by product.',
      'Clark County / Las Vegas local programs that are separate research tracks.',
      'Education requirements common to many assistance products.',
    ],
    firstMortgageLayering: [...SHARED_LAYERING],
    nextResearch: [
      { label: 'Program Finder (Nevada)', href: '/tools/program-finder?state=nevada' },
      { label: 'Down payment assistance overview', href: '/programs/down-payment-assistance#nevada' },
      { label: 'Nevada mortgage lenders directory', href: '/local-lenders/nevada' },
      { label: 'Mortgage calculators', href: '/calculators' },
    ],
    sources: [
      { label: 'Nevada Housing Division', href: 'https://housing.nv.gov/' },
      {
        label: 'Nevada Housing — Homebuyers',
        href: 'https://housing.nv.gov/programs/Homeownership/',
      },
      ...NATIONAL_SOURCES,
    ],
  }),
  note({
    stateSlug: 'utah',
    stateName: 'Utah',
    tier: 2,
    general:
      'Utah buyers often start with Utah Housing Corporation for statewide first-time buyer and down payment assistance themes, then check Salt Lake County and other local programs. Confirm current product status on official UHC pages.',
    researchSteps: [
      'Start at Utah Housing Corporation for homebuyer and assistance product overviews.',
      'Review official fact sheets for income limits, education, and first-mortgage pairing.',
      ...SHARED_RESEARCH_TAIL,
    ],
    dpaThemes: [
      'Utah Housing Corporation statewide homebuyer and DPA-related products.',
      'First-time buyer definitions and education requirements where applicable.',
      'Income and purchase-price limits by product and area.',
      'Local programs outside UHC, especially along the Wasatch Front.',
    ],
    firstMortgageLayering: [...SHARED_LAYERING],
    nextResearch: [
      { label: 'Program Finder (Utah)', href: '/tools/program-finder?state=utah' },
      { label: 'Down payment assistance overview', href: '/programs/down-payment-assistance#utah' },
      { label: 'Utah mortgage lenders directory', href: '/local-lenders/utah' },
      { label: 'Mortgage calculators', href: '/calculators' },
    ],
    sources: [
      { label: 'Utah Housing Corporation', href: 'https://utahhousingcorp.org/' },
      {
        label: 'UHC — Homebuyers',
        href: 'https://utahhousingcorp.org/homebuyers',
      },
      ...NATIONAL_SOURCES,
    ],
  }),
  note({
    stateSlug: 'oregon',
    stateName: 'Oregon',
    tier: 2,
    general:
      'Oregon buyers often research Oregon Housing and Community Services (OHCS) for statewide homebuyer and assistance themes, then check Portland metro and other local programs. High-cost western markets make limit checks important early.',
    researchSteps: [
      'Start at OHCS for homeownership and down payment assistance program information.',
      'Review official product pages for income limits, education, and first-mortgage pairing.',
      ...SHARED_RESEARCH_TAIL,
    ],
    dpaThemes: [
      'OHCS statewide homebuyer and DPA-related themes.',
      'Income and purchase-price limits that vary by product and area.',
      'Portland-metro local programs that are separate from OHCS.',
      'Education and counseling requirements common to assistance products.',
    ],
    firstMortgageLayering: [...SHARED_LAYERING],
    nextResearch: [
      { label: 'Program Finder (Oregon)', href: '/tools/program-finder?state=oregon' },
      { label: 'Down payment assistance overview', href: '/programs/down-payment-assistance#oregon' },
      { label: 'Oregon mortgage lenders directory', href: '/local-lenders/oregon' },
      { label: 'Mortgage calculators', href: '/calculators' },
    ],
    sources: [
      {
        label: 'Oregon Housing and Community Services (OHCS)',
        href: 'https://www.oregon.gov/ohcs/',
      },
      {
        label: 'OHCS — Homeownership',
        href: 'https://www.oregon.gov/ohcs/homeownership/Pages/index.aspx',
      },
      ...NATIONAL_SOURCES,
    ],
  }),
];

const BY_SLUG = new Map(PROGRAM_LOCATION_NOTES.map((n) => [n.stateSlug, n]));

/** States with dedicated DPA research modules (dropdown + boost + CTAs) */
export const DPA_GUIDANCE_STATE_SLUGS = PROGRAM_LOCATION_NOTES.map((n) => n.stateSlug);

export function getProgramLocationNote(
  stateSlug: string | undefined | null
): ProgramLocationNote | undefined {
  if (!stateSlug) return undefined;
  return BY_SLUG.get(stateSlug);
}

/** States with dedicated DPA research modules (dropdown boost + CTAs) */
export function isDpaGuidanceState(stateSlug: string | undefined | null): boolean {
  if (!stateSlug) return false;
  return BY_SLUG.has(stateSlug);
}

/** Alias kept for existing call sites */
export function isDpaPriorityState(stateSlug: string | undefined | null): boolean {
  return isDpaGuidanceState(stateSlug);
}

export function getDpaStateDisplayName(stateSlug: string | undefined | null): string | null {
  return getProgramLocationNote(stateSlug)?.stateName ?? null;
}

/** Finder dropdown options: all guidance states (A–Z) + other */
export function getProgramFinderStateOptions(): { value: string; label: string }[] {
  const states = [...PROGRAM_LOCATION_NOTES]
    .sort((a, b) => a.stateName.localeCompare(b.stateName))
    .map((n) => {
      const depth = n.tier === 'deep' ? 'deeper' : 'state HFA';
      return {
        value: n.stateSlug,
        label: `${n.stateName} (${depth} DPA guidance)`,
      };
    });
  return [...states, { value: 'other', label: 'Other / not listed' }];
}

/** Short blurb for CTAs — no eligibility claims */
export function dpaStateCtaCopy(stateSlug: string | undefined | null): string | null {
  const n = getProgramLocationNote(stateSlug);
  if (!n) return null;
  if (n.stateSlug === 'florida') {
    return 'Florida: start with Florida Housing and local counseling—not a complete county DPA list.';
  }
  if (n.stateSlug === 'texas') {
    return 'Texas: start with TDHCA Welcome Home and TSAHC—plus any city/county programs separately.';
  }
  return `${n.stateName}: start with the official state housing finance portal linked on our DPA page—then local city/county programs separately. Not a full local inventory.`;
}
