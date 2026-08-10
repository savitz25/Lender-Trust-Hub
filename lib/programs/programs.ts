import type { ProgramGuide, ProgramId } from './types';

/**
 * Educational program content — maintainable facts only.
 * Not underwriting guidance. Sources: consumer-facing agency pages.
 */
export const PROGRAM_GUIDES: ProgramGuide[] = [
  {
    id: 'conventional',
    slug: 'conventional',
    name: 'Conventional loans',
    shortName: 'Conventional',
    tagline: 'The common baseline for many purchase and refinance loans.',
    summary:
      'Conventional mortgages are not insured or guaranteed by a federal agency such as FHA, VA, or USDA. They often follow guidelines associated with Fannie Mae and Freddie Mac conforming limits, though “jumbo” conventional loans exist above those limits. Many buyers use conventional financing when they have a stronger credit profile and more cash for a down payment—but that is a tendency, not a rule.',
    whoCommonlyFor:
      'Buyers and refinancers who are comparing standard market products; often people with more cash to close or credit profiles that fit conventional investor guidelines.',
    typicalDownPayment:
      'Often discussed from about 3% (some first-time / low-down programs) to 20%+ to avoid private mortgage insurance (PMI). Exact minimums depend on the product and lender overlays.',
    mortgageInsuranceTheme:
      'Private mortgage insurance (PMI) is commonly required when down payment is below 20% on many conventional purchase loans. PMI is different from FHA mortgage insurance.',
    advantages: [
      'Wide product variety (fixed, ARM, jumbo, investment) under investor guidelines',
      'PMI on many products can be cancelable once equity thresholds are met (product-dependent)',
      'Often used as the pricing baseline when shopping Loan Estimates',
    ],
    tradeoffs: [
      'Credit and cash-to-close standards can be stricter than FHA for some files',
      'PMI cost and cancel rules vary by product—read the Loan Estimate carefully',
      'Conforming loan limits cap “standard” conventional size by county/year',
    ],
    eligibilityThemes: [
      'Credit, income, assets, and debt-to-income (DTI) reviewed under investor and lender guidelines',
      'Property type and occupancy (primary, second home, investment) affect terms',
      'Conforming loan limits change by year and county',
    ],
    commonlyUsedWhen: [
      'Buyers who can put more cash down and prefer conventional pricing',
      'Refinances of existing conventional loans',
      'Purchases that do not fit FHA/VA/USDA specialty profiles',
    ],
    notAGuarantee:
      'A conventional loan is not “better” or “worse” in the abstract. Pricing and approval depend on your full file, property, and lender guidelines.',
    comparisonBullets: [
      'No government mortgage insurance premium structure like FHA’s MIP',
      'PMI rules differ from FHA; often cancelable once equity thresholds are met (product-dependent)',
      'Often used as the comparison baseline next to FHA, VA, and USDA',
    ],
    comparisonRow: {
      downPayment: 'Often ~3%–20%+ (product-specific)',
      mortgageInsurance: 'PMI common below 20% down',
      eligibilityTheme: 'Investor + lender guidelines; no VA/FHA agency guarantee',
      commonUse: 'Baseline purchase & refinance shopping',
    },
    relatedToolHrefs: [
      { href: '/tools/program-finder', label: 'Program finder' },
      { href: '/calculators#down-payment', label: 'Down payment calculator' },
      { href: '/tools/loan-estimate-analyzer', label: 'Loan Estimate Analyzer' },
      { href: '/tools/compare-loan-estimates', label: 'Compare Loan Estimates' },
      { href: '/local-lenders', label: 'Local lenders directory' },
    ],
    sources: [
      {
        label: 'Consumer Financial Protection Bureau — Buying a house',
        href: 'https://www.consumerfinance.gov/owning-a-home/',
      },
      {
        label: 'FHFA — conforming loan limits',
        href: 'https://www.fhfa.gov/DataTools/Downloads/Pages/Conforming-Loan-Limits.aspx',
      },
    ],
  },
  {
    id: 'fha',
    slug: 'fha',
    name: 'FHA loans',
    shortName: 'FHA',
    tagline: 'Federal Housing Administration–insured mortgages with flexible credit and down-payment themes.',
    summary:
      'FHA loans are insured by the Federal Housing Administration (part of HUD). They are popular with first-time and cash-constrained buyers because minimum down-payment requirements can be lower than many conventional products, and credit standards are often described as more flexible—though lenders still apply their own overlays. FHA is insurance for the lender, not free money for the borrower.',
    whoCommonlyFor:
      'First-time and cash-constrained buyers, and others researching lower down-payment paths who may not fit conventional PMI pricing on their file.',
    typicalDownPayment:
      'Commonly discussed around 3.5% down for many purchase scenarios when credit meets program thresholds; other structures exist. Always confirm current HUD handbook rules and lender overlays.',
    mortgageInsuranceTheme:
      'FHA charges mortgage insurance (often an upfront premium financed into the loan plus annual MIP). MIP rules differ from conventional PMI and can last longer depending on down payment and loan terms.',
    advantages: [
      'Lower down-payment themes than many conventional products',
      'Credit standards often described as more flexible than conventional (lender overlays still apply)',
      'Can pair with certain gift funds and down-payment assistance under program rules',
    ],
    tradeoffs: [
      'MIP structure can be more expensive over time than cancelable PMI for some borrowers',
      'Property must meet FHA standards; some condos and property types are restricted',
      'Loan limits and MIP schedules are set by HUD and change',
    ],
    eligibilityThemes: [
      'Property must meet FHA standards; occupancy is typically primary residence for purchase',
      'Credit and DTI still matter; lenders may set higher floors than the program minimum',
      'Gift funds and certain assistance sources may be usable under FHA rules (case-by-case)',
    ],
    commonlyUsedWhen: [
      'First-time buyers with limited down-payment cash',
      'Buyers rebuilding credit who still meet FHA-capable lender guidelines',
      'Purchases where conventional PMI pricing is less competitive for the file',
    ],
    notAGuarantee:
      'FHA does not guarantee you will be approved. Lenders decide using the full application, property appraisal, and overlays.',
    comparisonBullets: [
      'Government mortgage insurance (MIP) vs conventional PMI',
      'Often lower down-payment entry points than many conventional paths',
      'Loan limits and MIP rules are set by HUD and can change',
    ],
    comparisonRow: {
      downPayment: 'Often ~3.5% discussed for purchase',
      mortgageInsurance: 'Upfront + annual MIP (not PMI)',
      eligibilityTheme: 'Primary residence themes; property standards; lender overlays',
      commonUse: 'First-time / lower cash-to-close research',
    },
    relatedToolHrefs: [
      { href: '/tools/program-finder', label: 'Program finder' },
      { href: '/programs/down-payment-assistance', label: 'Down-payment assistance overview' },
      { href: '/tools/loan-estimate-analyzer', label: 'Loan Estimate Analyzer' },
      { href: '/tools/compare-loan-estimates', label: 'Compare Loan Estimates' },
      { href: '/local-lenders', label: 'Local lenders directory' },
    ],
    sources: [
      {
        label: 'HUD — FHA single-family programs (consumer)',
        href: 'https://www.hud.gov/buying/loans',
      },
      {
        label: 'CFPB — FHA loans',
        href: 'https://www.consumerfinance.gov/owning-a-home/explore/fha-loan/',
      },
    ],
  },
  {
    id: 'va',
    slug: 'va',
    name: 'VA loans',
    shortName: 'VA',
    tagline: 'VA-backed loans for eligible service members, veterans, and some surviving spouses.',
    summary:
      'VA loans are guaranteed by the U.S. Department of Veterans Affairs for eligible borrowers. A defining educational theme is that many VA purchase loans can be made with no down payment when entitlement and lender guidelines allow—plus no monthly private mortgage insurance in the conventional sense. A VA funding fee often applies (with exemptions for some disabled veterans and other categories).',
    whoCommonlyFor:
      'Eligible service members, veterans, and some surviving spouses researching $0-down and no-monthly-PMI themes.',
    typicalDownPayment:
      'Often discussed as $0 down for eligible borrowers with available entitlement; some choose to put money down. Not automatic—entitlement, residual income, and lender rules apply.',
    mortgageInsuranceTheme:
      'No conventional monthly PMI. A one-time VA funding fee is common (financed or paid in cash), with exemptions for certain disabled veterans and other cases. Confirm current VA fee tables.',
    advantages: [
      'Often $0 down purchase themes when entitlement allows',
      'No monthly PMI; funding fee structure instead (with some exemptions)',
      'Competitive pricing themes for eligible borrowers in many markets',
    ],
    tradeoffs: [
      'Limited to eligible borrowers—not a general public product',
      'Funding fee (when not exempt) adds cost; residual income tests apply',
      'Property must meet VA minimum property requirements',
    ],
    eligibilityThemes: [
      'Service-connected eligibility and Certificate of Eligibility (COE) concepts',
      'Residual income and credit reviewed under VA and lender standards',
      'Property must meet VA appraisal / MPR standards',
    ],
    commonlyUsedWhen: [
      'Eligible veterans and active-duty service members purchasing a primary home',
      'Some surviving spouses who meet VA criteria',
      'Cash-out or IRRRL refinances for existing VA loans (different rules)',
    ],
    notAGuarantee:
      'VA eligibility does not equal automatic approval. Lenders still underwrite the full file and property.',
    comparisonBullets: [
      'Often $0 down potential vs FHA/conventional minimum cash',
      'No monthly PMI; funding fee structure instead',
      'Limited to eligible borrowers—not a general public product',
    ],
    comparisonRow: {
      downPayment: 'Often $0 when entitlement allows',
      mortgageInsurance: 'No monthly PMI; funding fee common',
      eligibilityTheme: 'Service eligibility + COE; residual income',
      commonUse: 'Eligible military / veteran primary purchases',
    },
    relatedToolHrefs: [
      { href: '/tools/program-finder', label: 'Program finder' },
      { href: '/calculators#payment', label: 'Payment calculator' },
      { href: '/tools/loan-estimate-analyzer', label: 'Loan Estimate Analyzer' },
      { href: '/local-lenders', label: 'Local lenders directory' },
    ],
    sources: [
      {
        label: 'VA — home loans',
        href: 'https://www.va.gov/housing-assistance/home-loans/',
      },
      {
        label: 'CFPB — VA loans',
        href: 'https://www.consumerfinance.gov/owning-a-home/explore/va-loan/',
      },
    ],
  },
  {
    id: 'usda',
    slug: 'usda',
    name: 'USDA rural development loans',
    shortName: 'USDA',
    tagline: 'Zero-down purchase options in eligible rural and some suburban areas (income and map-based).',
    summary:
      'USDA Rural Development Single Family Housing Guaranteed Loans can allow 100% financing in eligible geographic areas for income-eligible households. Property location (USDA eligibility map) and borrower income limits are central. This is a specialized path—not available for every address or income level.',
    whoCommonlyFor:
      'Income-eligible households shopping homes in USDA-eligible rural and some edge-of-metro areas.',
    typicalDownPayment:
      'Guaranteed purchase loans are often discussed as no down payment when the property and borrower qualify. Closing costs still apply and may be financed or paid from other sources under program rules.',
    mortgageInsuranceTheme:
      'USDA uses guarantee fee / annual fee structures rather than conventional PMI. Details depend on current USDA RD fee schedules.',
    advantages: [
      'Often no down payment when property and income fully fit',
      'Can open purchase paths outside high-density cores',
      'Designed for income-eligible owner-occupants',
    ],
    tradeoffs: [
      'Property must be on the official USDA eligibility map',
      'Household income limits apply',
      'Not a general substitute for FHA or VA',
    ],
    eligibilityThemes: [
      'Property must be in a USDA-eligible area',
      'Household income typically must be within area limits',
      'Primary residence occupancy; credit and DTI still reviewed',
    ],
    commonlyUsedWhen: [
      'Buyers targeting homes outside high-density urban cores',
      'Income-eligible households seeking low cash-to-close themes',
      'Markets with USDA-eligible subdivisions on metro edges',
    ],
    notAGuarantee:
      'An address being “suburban” does not mean USDA-eligible. Always check the official USDA eligibility map and current income limits.',
    comparisonBullets: [
      'Location + income driven—unlike general conventional/FHA availability',
      'Often no down payment when fully eligible',
      'Not a substitute for VA (different populations and rules)',
    ],
    comparisonRow: {
      downPayment: 'Often $0 when fully eligible',
      mortgageInsurance: 'USDA guarantee / annual fees',
      eligibilityTheme: 'Map + income limits; primary residence',
      commonUse: 'Rural / edge-metro low-down purchases',
    },
    relatedToolHrefs: [
      { href: '/tools/program-finder', label: 'Program finder' },
      { href: '/programs/down-payment-assistance', label: 'Down-payment assistance overview' },
      { href: '/local-lenders', label: 'Local lenders directory' },
    ],
    sources: [
      {
        label: 'USDA RD — single family housing guaranteed loan program',
        href: 'https://www.rd.usda.gov/programs-services/single-family-housing-programs/single-family-housing-guaranteed-loan-program',
      },
      {
        label: 'USDA eligibility map',
        href: 'https://eligibility.sc.egov.usda.gov/eligibility/welcomeAction.do',
      },
    ],
  },
  {
    id: 'down-payment-assistance',
    slug: 'down-payment-assistance',
    name: 'Down-payment assistance (DPA)',
    shortName: 'DPA',
    tagline: 'State, local, and nonprofit help with down payment or closing costs—layered on a first mortgage.',
    summary:
      'Down-payment assistance is not a single national product. It is a family of grants, forgivable second mortgages, deferred loans, and other structures offered by housing finance agencies, cities, counties, employers, and nonprofits. DPA almost always pairs with a first mortgage (often FHA or conventional) and has income, purchase-price, education, and occupancy rules. This site provides official-source research starting points for Florida, Texas, and additional high-value states—not a nationwide city/county inventory.',
    whoCommonlyFor:
      'First-time and cash-constrained buyers researching grants or second mortgages that reduce cash to close—always layered on a first mortgage.',
    typicalDownPayment:
      'Assistance amounts vary widely (a few thousand dollars to larger second-mortgage structures). Some require a minimum borrower contribution. None of this replaces a first-mortgage underwriting decision.',
    mortgageInsuranceTheme:
      'DPA does not replace mortgage insurance on the first loan. If the first mortgage is FHA or conventional with PMI, those costs still follow that product’s rules.',
    advantages: [
      'Can reduce cash needed at closing when a program has funding',
      'May include education and counseling pathways that help buyers prepare',
      'Often stacks with FHA or conventional first mortgages under program rules',
    ],
    tradeoffs: [
      'Rules are local and change; funding can run out mid-year',
      'May require repayment if you sell, refinance, or leave the home early',
      'Income, price, and education requirements can exclude some households',
    ],
    eligibilityThemes: [
      'Often first-time buyer definitions (or first-time in X years)',
      'Income and purchase price caps by area',
      'Homebuyer education certificates commonly required',
      'Property location and occupancy (primary residence)',
    ],
    commonlyUsedWhen: [
      'First-time buyers short on cash to close',
      'Targeted revitalization or workforce housing initiatives',
      'Layering with FHA or conventional first mortgages',
    ],
    notAGuarantee:
      'Program availability is local and changes. This site does not list every DPA or determine eligibility. Check your state housing finance agency and local HUD-approved counseling resources.',
    comparisonBullets: [
      'Not a first mortgage type—usually a second layer of assistance',
      'Rules are local: Florida HFA programs differ from Texas, Georgia, etc.',
      'May require repayment if you sell or refinance early (program-specific)',
    ],
    comparisonRow: {
      downPayment: 'Varies; often reduces cash to close',
      mortgageInsurance: 'Does not replace first-loan MI / PMI / MIP',
      eligibilityTheme: 'Local HFA / city rules; income & education common',
      commonUse: 'First-time / cash-constrained buyers (with a first mortgage)',
    },
    relatedToolHrefs: [
      { href: '/tools/program-finder', label: 'Program finder' },
      { href: '/programs/fha', label: 'FHA overview' },
      { href: '/programs/conventional', label: 'Conventional overview' },
      { href: '/programs/down-payment-assistance#california', label: 'California DPA starts' },
      { href: '/local-lenders', label: 'Local lenders directory' },
    ],
    sources: [
      {
        label: 'HUD — find a housing counselor',
        href: 'https://www.hud.gov/findacounselor',
      },
      {
        label: 'CFPB — What is down payment assistance?',
        href: 'https://www.consumerfinance.gov/ask-cfpb/what-is-down-payment-assistance-en-120/',
      },
      {
        label: 'Florida Housing Finance Corporation',
        href: 'https://www.floridahousing.org/',
      },
      {
        label: 'Florida Housing — Homebuyer overview',
        href: 'https://www.floridahousing.org/programs/homebuyer-overview-page',
      },
      {
        label: 'Texas Department of Housing and Community Affairs',
        href: 'https://www.tdhca.texas.gov/',
      },
      {
        label: 'TDHCA Welcome Home — programs',
        href: 'https://welcomehome.tdhca.texas.gov/programs',
      },
      {
        label: 'Texas State Affordable Housing Corporation — DPA',
        href: 'https://www.tsahc.org/homebuyers-renters/loans-down-payment-assistance',
      },
    ],
  },
];

const bySlug = new Map(PROGRAM_GUIDES.map((p) => [p.slug, p]));
const byId = new Map(PROGRAM_GUIDES.map((p) => [p.id, p]));

export function getAllPrograms(): ProgramGuide[] {
  return PROGRAM_GUIDES;
}

export function getProgramBySlug(slug: string): ProgramGuide | undefined {
  return bySlug.get(slug);
}

export function getProgramById(id: ProgramId): ProgramGuide | undefined {
  return byId.get(id);
}

export const PROGRAM_DISCLAIMER =
  'Educational research only. Lender Trust Hub is not a lender, broker, or government agency and does not determine eligibility, issue pre-approvals, or guarantee loan terms. Program rules change. Confirm details with official agency sources, a HUD-approved housing counselor, and licensed professionals before applying.';
