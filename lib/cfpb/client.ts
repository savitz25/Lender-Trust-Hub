import {
  CFPB_API_BASE,
  CFPB_PRODUCT_MORTGAGE,
  type CfpbCompanySnapshot,
  type CfpbCountBucket,
} from './types';

type AggBucket = { key: string; doc_count: number };

type CcdbSearchResponse = {
  hits?: { total?: { value?: number } | number };
  aggregations?: {
    issue?: { issue?: { buckets?: AggBucket[] } };
    timely?: { timely?: { buckets?: AggBucket[] } };
    company_response?: { company_response?: { buckets?: AggBucket[] } };
  };
};

function totalHits(res: CcdbSearchResponse): number {
  const t = res.hits?.total;
  if (typeof t === 'number') return t;
  if (t && typeof t.value === 'number') return t.value;
  return 0;
}

function toBuckets(raw: AggBucket[] | undefined, total: number, limit = 5): CfpbCountBucket[] {
  if (!raw?.length || total <= 0) return [];
  return raw.slice(0, limit).map((b) => ({
    key: b.key,
    count: b.doc_count,
    pct: Math.round((b.doc_count / total) * 1000) / 10,
  }));
}

function bucketCount(raw: AggBucket[] | undefined, key: string): number {
  if (!raw) return 0;
  const hit = raw.find((b) => b.key.toLowerCase() === key.toLowerCase());
  return hit?.doc_count ?? 0;
}

/**
 * Fetch mortgage complaint aggregates for one exact CFPB company name.
 * Uses size=5 so default aggregations populate (size=0 can omit issue buckets).
 */
export async function fetchCfpbCompanyMortgageStats(
  company: string,
  options?: { dateReceivedMin?: string; signal?: AbortSignal }
): Promise<{
  total: number;
  topIssues: CfpbCountBucket[];
  timelyYes: number;
  timelyNo: number;
  companyResponses: CfpbCountBucket[];
}> {
  const params = new URLSearchParams({
    size: '5',
    product: CFPB_PRODUCT_MORTGAGE,
    company,
  });
  if (options?.dateReceivedMin) {
    params.set('date_received_min', options.dateReceivedMin);
  }

  const url = `${CFPB_API_BASE}?${params.toString()}`;
  const res = await fetch(url, {
    signal: options?.signal,
    headers: {
      Accept: 'application/json',
      'User-Agent': 'LenderTrustHub/1.0 (+https://www.lendertrusthub.com; research)',
    },
    // Script + build-time: no Next cache here; callers may wrap.
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `CFPB API ${res.status} for company="${company}": ${body.slice(0, 200)}`
    );
  }

  const data = (await res.json()) as CcdbSearchResponse;
  const total = totalHits(data);
  const issueBuckets = data.aggregations?.issue?.issue?.buckets;
  const timelyBuckets = data.aggregations?.timely?.timely?.buckets;
  const responseBuckets = data.aggregations?.company_response?.company_response?.buckets;

  return {
    total,
    topIssues: toBuckets(issueBuckets, total, 5),
    timelyYes: bucketCount(timelyBuckets, 'Yes'),
    timelyNo: bucketCount(timelyBuckets, 'No'),
    companyResponses: toBuckets(responseBuckets, total, 5),
  };
}

export async function buildCompanySnapshot(
  company: string,
  recentWindowStart: string
): Promise<CfpbCompanySnapshot> {
  const allTime = await fetchCfpbCompanyMortgageStats(company);
  // Brief pause to be polite to the public API
  await new Promise((r) => setTimeout(r, 350));
  const recent = await fetchCfpbCompanyMortgageStats(company, {
    dateReceivedMin: recentWindowStart,
  });

  return {
    company,
    product: CFPB_PRODUCT_MORTGAGE,
    totalComplaints: allTime.total,
    complaintsLast24Months: recent.total,
    topIssues: allTime.topIssues,
    timelyYes: allTime.timelyYes,
    timelyNo: allTime.timelyNo,
    companyResponses: allTime.companyResponses,
    fetchedAt: new Date().toISOString(),
  };
}
