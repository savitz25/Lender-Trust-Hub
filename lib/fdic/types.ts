export interface FDICBank {
  name: string;
  fdic_insured_since: string;
  fdic_cert: string;
  primary_regulator: string;
  headquarters_address: string;
  website: string;
}

export interface StateFDICData {
  fullName: string;
  abbr: string;
  banks: FDICBank[];
  updated: string;
  fact?: string;
}

export type RegulatorKey = 'OCC' | 'FED' | 'FDIC';

export interface StateMeta {
  code: string;
  fullName: string;
  slug: string;
  region: string;
  hasData: boolean;
}