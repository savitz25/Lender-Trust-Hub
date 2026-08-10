/**
 * Wave 4 discovery — search term → company aggregation, then exact company= verify.
 */
import { fetchCfpbCompanyMortgageStats } from '../lib/cfpb/client';

const CFPB_API =
  'https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/';

async function searchCompanies(term: string): Promise<{ total: number; companies: { key: string; count: number }[] }> {
  const params = new URLSearchParams({
    size: '0',
    product: 'Mortgage',
    search_term: term,
  });
  const res = await fetch(`${CFPB_API}?${params}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'LenderTrustHub/1.0 (+https://www.lendertrusthub.com; research)',
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`search ${res.status}`);
  const data = (await res.json()) as {
    hits?: { total?: { value?: number } | number };
    aggregations?: { company?: { company?: { buckets?: { key: string; doc_count: number }[] } } };
  };
  const t = data.hits?.total;
  const total = typeof t === 'number' ? t : t?.value ?? 0;
  const buckets = data.aggregations?.company?.company?.buckets ?? [];
  return {
    total,
    companies: buckets.slice(0, 10).map((b) => ({ key: b.key, count: b.doc_count })),
  };
}

const SEARCH_TERMS = [
  'homebridge',
  'space coast credit',
  'veterans united',
  'union home mortgage',
  'acrisure mortgage',
  'fbc mortgage',
  'supreme lending',
  'pierpoint mortgage',
  'florida va mortgage',
  'capital city home loans',
  'city national bank of florida',
  'city national bank mortgage',
  'lennar mortgage',
  'eagle home mortgage',
  'seacoast',
  'synovus',
  'fifth third',
  'huntington bank',
  'keybank',
  'capital one mortgage',
  'discover bank',
  'citibank mortgage',
  'american express',
  'quicken loans',
  'loan depot',
];

const EXACT_CANDIDATES = [
  // known from prior / search follow-ups will be filled after search
  'Veterans United Home Loans',
  'VETERANS UNITED HOME LOANS',
  'Mortgage Research Center, LLC',
  'MORTGAGE RESEARCH CENTER, LLC',
  'Union Home Mortgage Corp.',
  'UNION HOME MORTGAGE CORP.',
  'UNION HOME MORTGAGE CORPORATION',
  'FBC Mortgage, LLC',
  'FBC MORTGAGE, LLC',
  'Acrisure Mortgage, LLC',
  'Supreme Lending',
  'SUPREME LENDING',
  'Supreme Lending, a division of',
  'PierPoint Mortgage, LLC',
  'PIERPOINT MORTGAGE, LLC',
  'City National Bank of Florida',
  'CITY NATIONAL BANK OF FLORIDA',
  'City National Bank',
  'Lennar Mortgage, LLC',
  'LENNAR MORTGAGE, LLC',
  'Eagle Home Mortgage, LLC',
  'BANK OF AMERICA, NATIONAL ASSOCIATION',
  'Fifth Third Bank, National Association',
  'FIFTH THIRD FINANCIAL CORPORATION',
  'The Huntington National Bank',
  'HUNTINGTON NATIONAL BANK',
  'KeyBank National Association',
  'KEYCORP',
  'Capital One, National Association',
  'CAPITAL ONE FINANCIAL CORPORATION',
  'Citibank, N.A.',
  'CITIBANK, N.A.',
  'Discover Bank',
  'DISCOVER BANK',
  'Seacoast National Bank',
  'SEACOAST NATIONAL BANK',
  'Synovus Bank',
  'SYNOVUS BANK',
  'HomeBridge Financial Services, Inc',
  'Homebridge Financial Services Inc',
  'AMA Advisors, LLC.',
];

async function main() {
  console.log('=== SEARCH AGGREGATIONS ===\n');
  for (const term of SEARCH_TERMS) {
    try {
      const r = await searchCompanies(term);
      console.log(`### ${term} (total≈${r.total})`);
      for (const c of r.companies) {
        console.log(`  ${String(c.count).padStart(6)}  ${c.key}`);
      }
    } catch (e) {
      console.log(`### ${term} ERR`, e);
    }
    await new Promise((r) => setTimeout(r, 350));
  }

  console.log('\n=== EXACT company= FILTER ===\n');
  for (const company of EXACT_CANDIDATES) {
    try {
      const s = await fetchCfpbCompanyMortgageStats(company);
      if (s.total > 0) console.log(`HIT ${String(s.total).padStart(6)}  ${company}`);
      else console.log(`—   ${String(0).padStart(6)}  ${company}`);
    } catch (e) {
      console.log(`ERR ${company}`, e);
    }
    await new Promise((r) => setTimeout(r, 300));
  }
}

main();
