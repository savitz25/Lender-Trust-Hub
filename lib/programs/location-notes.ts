/**
 * Light location framing for Program Finder V1.
 * Explicit general vs state-specific. Not a DPA inventory.
 */

export type ProgramLocationNote = {
  stateSlug: string;
  stateName: string;
  /** High-level market research framing */
  general: string;
  /** Down-payment assistance themes only — not a program list */
  dpaThemes: string[];
  sources: { label: string; href: string }[];
};

export const PROGRAM_LOCATION_NOTES: ProgramLocationNote[] = [
  {
    stateSlug: 'florida',
    stateName: 'Florida',
    general:
      'Florida is a core directory market on Lender Trust Hub. Program rules (FHA loan limits, USDA maps, HFA products) are still national or state-agency products—not set by this site. Use official agency sources and local counseling for decisions.',
    dpaThemes: [
      'Florida Housing Finance Corporation and some local HFAs offer first-time buyer and workforce-oriented assistance that can change by funding cycle.',
      'Many Florida DPA layers pair with FHA or conventional first mortgages and require homebuyer education.',
      'County and city programs (where they exist) often have purchase-price and income caps tied to area median income.',
    ],
    sources: [
      {
        label: 'Florida Housing Finance Corporation',
        href: 'https://www.floridahousing.org/',
      },
      {
        label: 'HUD housing counselor search',
        href: 'https://www.hud.gov/findacounselor',
      },
    ],
  },
  {
    stateSlug: 'texas',
    stateName: 'Texas',
    general:
      'Texas is a core research market here. TSAHC and local entities publish assistance and education resources that evolve. This is not a live inventory of every Texas county program.',
    dpaThemes: [
      'Texas State Affordable Housing Corporation (TSAHC) and other statewide/local partners run assistance and education programs with their own rules.',
      'Some Texas DPA is structured as second liens or grants with occupancy and refinance restrictions.',
      'Always confirm current program names, income limits, and participating lenders with the official HFA—not a third-party directory alone.',
    ],
    sources: [
      {
        label: 'Texas State Affordable Housing Corporation',
        href: 'https://www.tsahc.org/',
      },
      {
        label: 'HUD housing counselor search',
        href: 'https://www.hud.gov/findacounselor',
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
