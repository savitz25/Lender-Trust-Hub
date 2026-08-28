/**
 * LEND-NAT-014 — controlled render + indexing gate.
 * Rendering is the render cohort (indexing cohort + QA holds).
 * Indexation is a strict subset via publicLenderRobots.
 */

import renderFile from '@/docs/lend-nat-014-render-cohort.json';

export const NATIONAL_PROFILE_GATE = {
  mode: 'controlled_index' as const,
  productionLaunchEnabled: true,
  landingNoindex: false,
  sitemap: true,
  contractVersion: 'lend-nat-011-v1',
  cohortVersion: 'lend-nat-014-v1',
  /** @deprecated global noindex; per-profile robots via publicLenderRobots */
  noindex: false,
};

export type NationalProfileCohortEntry = {
  key: string;
  slug: string;
  stableKey: string;
  entityId: string;
  displayName: string;
  notes: string;
};

/** Original LEND-NAT-012 QA ten. Still render; index only if they pass 014 policy. */
export const NATIONAL_PROFILE_QA_COHORT: NationalProfileCohortEntry[] = [
  {
    key: 'rocket',
    slug: 'rocket-mortgage',
    stableKey: 'nmls-inst:3030',
    entityId: '1e2fa9a5-7067-52e9-8b44-4da4e71c9d47',
    displayName: 'Rocket Mortgage',
    notes: 'NMLS 3030, CFPB confirmed, servicer not established',
  },
  {
    key: 'freedom_corporation',
    slug: 'freedom-mortgage-corporation',
    stableKey: 'nmls-inst:2767',
    entityId: '9cdfce71-84f9-5648-a966-89f562d73ed7',
    displayName: 'Freedom Mortgage Corporation',
    notes: 'Company CFPB label remains unresolved',
  },
  {
    key: 'boa',
    slug: 'bank-of-america',
    stableKey: 'nmls-inst:399802',
    entityId: '1addd8ad-ae59-5b1b-9b7c-2e5f6be74cba',
    displayName: 'Bank of America Mortgage',
    notes: 'FDIC + confirmed enforcement',
  },
  {
    key: 'navy_federal',
    slug: 'navy-federal-credit-union',
    stableKey: 'nmls-inst:399807',
    entityId: '46b4f54f-f5bf-5164-9c6b-69af1c2cb1d4',
    displayName: 'Navy Federal Credit Union',
    notes: 'NCUA credit union',
  },
  {
    key: 'sps_servicer',
    slug: 'select-portfolio-servicing',
    stableKey: 'gleif-lei:254900AF53CA0NLFZW89',
    entityId: '2c4c7b7e-969d-55c6-8c84-0744facdf874',
    displayName: 'Select Portfolio Servicing, Inc.',
    notes: 'Confirmed servicer; no HMDA on this entity',
  },
  {
    key: 'small_hmda',
    slug: 'bank-of-eastern-oregon',
    stableKey: 'fdic-cert:16243',
    entityId: '5edeebd0-e907-54ad-afe9-fe27a19765bb',
    displayName: 'Bank of Eastern Oregon',
    notes: 'Small HMDA filer; no CFPB',
  },
  {
    key: 'sparse_historical_servicer',
    slug: 'ocwen-loan-servicing',
    stableKey: 'gleif-lei:549300MEMWF0Y8H4PL17',
    entityId: '804628f9-0830-5bbc-af52-1b7d4b1ea8c0',
    displayName: 'Ocwen Loan Servicing, LLC',
    notes: 'Historical servicer; sparse identifiers',
  },
  {
    key: 'newrez',
    slug: 'newrez',
    stableKey: 'nmls-inst:2289',
    entityId: 'c1262860-66db-5353-a838-c3cbd2499489',
    displayName: 'Newrez',
    notes: 'Nearby unresolved Shellpoint label — not folded',
  },
  {
    key: 'sls_llc',
    slug: 'specialized-loan-servicing',
    stableKey: 'gleif-lei:549300QSUEE20YO86W39',
    entityId: '226970c2-12b4-5490-a5e7-0a54afa60cc7',
    displayName: 'Specialized Loan Servicing LLC',
    notes: 'Holdings label remains separate',
  },
  {
    key: 'phh_home_loans',
    slug: 'phh-home-loans',
    stableKey: 'gleif-lei:549300KO4XT2PA011C25',
    entityId: 'd1f252fa-2d62-5965-8722-17dbff8f57e8',
    displayName: 'PHH Home Loans, LLC',
    notes: 'PUBLICATION_HOLD — identity only; render noindex',
  },
];

const QA_BY_STABLE = new Map(NATIONAL_PROFILE_QA_COHORT.map((r) => [r.stableKey, r]));

type RenderRow = {
  institution_id: string;
  stable_key: string;
  slug: string;
  display_name: string;
  publication_status: string;
  reason: string;
  index?: boolean;
};

export const NATIONAL_PROFILE_COHORT: NationalProfileCohortEntry[] = (renderFile.rows as RenderRow[]).map(
  (row) => {
    const qa = QA_BY_STABLE.get(row.stable_key);
    return {
      key: qa?.key || row.slug,
      slug: row.slug,
      stableKey: row.stable_key,
      entityId: row.institution_id,
      displayName: qa?.displayName || row.display_name,
      notes: qa?.notes || `${row.publication_status}: ${row.reason}`,
    };
  }
);

export function getCohortBySlug(slug: string): NationalProfileCohortEntry | undefined {
  return NATIONAL_PROFILE_COHORT.find((row) => row.slug === slug);
}

export function nationalProfilePath(slug: string): string {
  return `/lender/${slug}`;
}
