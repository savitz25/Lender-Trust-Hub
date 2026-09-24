import companies from './dob-companies.json';

/** One DOB company (NMLS Company ID) with its separate Massachusetts credential relationships. */
export type MaDobCredential = {
  lic: string[];
  city: string | null;
  st: string | null;
  branches: number;
  branchesMA: number;
  tradeNameRows: number;
};
export type MaDobCompany = {
  n: string;
  name: string;
  holds: Array<'lender' | 'broker'>;
  lender?: MaDobCredential;
  broker?: MaDobCredential;
};

export const MA_DOB_COMPANIES = companies as MaDobCompany[];

export type MaLookupResult =
  | { kind: 'company'; by: 'nmls' | 'license'; query: string; company: MaDobCompany }
  | { kind: 'not_on_file'; by: 'nmls' | 'license'; query: string }
  | { kind: 'person_grain'; query: string }
  | { kind: 'invalid'; query: string };

function normLicense(raw: string): string {
  const m = raw.trim().match(/^([A-Za-z]+)\s*-?\s*(\d+)$/);
  return m ? `${m[1].toUpperCase()}${m[2]}` : '';
}

/**
 * Exact identifier lookup against the DOB lender and broker files (as of 2026-06-30).
 * NMLS Company ID or a company license number (MC/ML/MB). Never a name match.
 * MLO license numbers are a person grain and are not looked up here.
 */
export function lookupMaDob(input: string): MaLookupResult {
  const query = input.trim().slice(0, 40);
  if (!query) return { kind: 'invalid', query };
  const lic = normLicense(query);
  if (lic.startsWith('MLO')) return { kind: 'person_grain', query };
  if (lic && /^(MC|ML|MB)\d+$/.test(lic)) {
    const company = MA_DOB_COMPANIES.find((c) =>
      [c.lender, c.broker].some((cred) => cred?.lic.some((l) => normLicense(l) === lic)),
    );
    return company ? { kind: 'company', by: 'license', query, company } : { kind: 'not_on_file', by: 'license', query };
  }
  const digits = query.replace(/^nmls\s*(?:id|#)?\s*:?\s*/i, '');
  if (/^\d{1,8}$/.test(digits)) {
    const company = MA_DOB_COMPANIES.find((c) => c.n === String(Number(digits)));
    return company ? { kind: 'company', by: 'nmls', query, company } : { kind: 'not_on_file', by: 'nmls', query };
  }
  return { kind: 'invalid', query };
}
