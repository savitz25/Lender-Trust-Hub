import { getHmdaLenderEvidenceBySlug, HMDA_VINTAGE_YEAR } from '@/lib/hmda';
import { CFPB_COMPANY_MAPPINGS, resolveCfpbMapping } from './mappings';
import { getCompanySnapshotMap, loadCfpbSnapshot } from './load';
import {
  CFPB_SOURCE_LABEL,
  CFPB_SOURCE_NOTE,
  CFPB_SOURCE_URL,
  type CfpbCompanyMapping,
  type CfpbComplaintEvidence,
  type CfpbCountBucket,
  type CfpbHmdaNormalizationPrep,
  type CfpbCompanySnapshot,
} from './types';

function mergeBuckets(parts: CfpbCountBucket[][], total: number, limit = 5): CfpbCountBucket[] {
  const map = new Map<string, number>();
  for (const list of parts) {
    for (const b of list) {
      map.set(b.key, (map.get(b.key) ?? 0) + b.count);
    }
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => ({
      key,
      count,
      pct: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    }));
}

function buildNormalization(
  complaints24m: number,
  totalComplaints: number
): CfpbHmdaNormalizationPrep {
  // Caller may override with HMDA — base note always explains the caveat.
  const baseNote =
    'Complaints are national (CFPB mortgage product). HMDA originations on this site are currently Florida-focused for matched LEIs. A per-1,000 rate mixes national complaint volume with state originations — use only as rough size context, not a score.';

  return {
    hmdaFloridaOriginations: null,
    hmdaYear: null,
    complaintsWindow: '24m',
    complaintsInWindow: complaints24m > 0 ? complaints24m : totalComplaints,
    complaintsPerThousandOriginations: null,
    readyForDisplay: false,
    note: baseNote,
  };
}

function attachHmdaNormalization(
  prep: CfpbHmdaNormalizationPrep,
  slug: string
): CfpbHmdaNormalizationPrep {
  const hmda = getHmdaLenderEvidenceBySlug(slug);
  if (!hmda || hmda.floridaOriginations == null || hmda.floridaOriginations <= 0) {
    return prep;
  }

  const windowCount = prep.complaintsInWindow;
  let rate: number | null = null;
  let ready = false;
  if (windowCount != null && windowCount >= 0) {
    rate = Math.round((windowCount / hmda.floridaOriginations) * 1000 * 10) / 10;
    // Only mark ready when both signals exist; UI still frames as experimental.
    ready = true;
  }

  return {
    ...prep,
    hmdaFloridaOriginations: hmda.floridaOriginations,
    hmdaYear: hmda.year ?? HMDA_VINTAGE_YEAR,
    complaintsPerThousandOriginations: rate,
    readyForDisplay: ready,
    note:
      prep.note +
      ` Linked Florida HMDA originations (${hmda.year}): ${hmda.floridaOriginations.toLocaleString('en-US')}.`,
  };
}

function evidenceFromSnapshots(
  slug: string,
  snaps: CfpbCompanySnapshot[],
  mapping: CfpbCompanyMapping,
  meta: { dataAsOf: string; recentWindowStart: string }
): CfpbComplaintEvidence | null {
  if (!mapping || snaps.length === 0) return null;

  const totalComplaints = snaps.reduce((s, c) => s + c.totalComplaints, 0);
  const complaintsLast24Months = snaps.reduce((s, c) => s + c.complaintsLast24Months, 0);
  const timelyYes = snaps.reduce((s, c) => s + c.timelyYes, 0);
  const timelyNo = snaps.reduce((s, c) => s + c.timelyNo, 0);
  const timelyDenom = timelyYes + timelyNo;
  const timelyYesPct =
    timelyDenom > 0 ? Math.round((timelyYes / timelyDenom) * 1000) / 10 : null;

  const topIssues = mergeBuckets(
    snaps.map((c) => c.topIssues),
    totalComplaints,
    5
  );
  const companyResponses = mergeBuckets(
    snaps.map((c) => c.companyResponses),
    totalComplaints,
    5
  );

  let normalization = buildNormalization(complaintsLast24Months, totalComplaints);
  normalization = attachHmdaNormalization(normalization, slug);

  return {
    slug,
    product: 'Mortgage',
    companiesMatched: snaps.map((c) => c.company),
    matchMethod: mapping.matchMethod,
    matchNote: mapping.matchNote,
    totalComplaints,
    complaintsLast24Months,
    topIssues,
    timelyYes,
    timelyNo,
    timelyYesPct,
    companyResponses,
    dataAsOf: meta.dataAsOf,
    recentWindowStart: meta.recentWindowStart,
    source: CFPB_SOURCE_LABEL,
    sourceUrl: CFPB_SOURCE_URL,
    sourceNote: CFPB_SOURCE_NOTE,
    normalization,
  };
}

/**
 * Complaint evidence for a directory profile (mapped + snapshot present).
 * Resolves by exact slug first, then by company NMLS (branch listings).
 * Returns null when unmapped or snapshot missing for all companies.
 */
export function getCfpbComplaintEvidenceBySlug(
  slug: string,
  options?: { nmlsId?: string | null }
): CfpbComplaintEvidence | null {
  const mapping = resolveCfpbMapping({ slug, nmlsId: options?.nmlsId });
  if (!mapping) return null;

  const file = loadCfpbSnapshot();
  if (!file) return null;

  const byCompany = getCompanySnapshotMap();
  const snaps = mapping.cfpbCompanyNames
    .map((name) => byCompany.get(name))
    .filter((s): s is CfpbCompanySnapshot => Boolean(s));

  if (snaps.length === 0) return null;

  const dataAsOf =
    snaps.map((s) => s.fetchedAt).sort().at(-1) ?? file.generatedAt;

  return evidenceFromSnapshots(slug, snaps, mapping, {
    dataAsOf,
    recentWindowStart: file.recentWindowStart,
  });
}

export function getCfpbMappedSlugsWithData(): string[] {
  const file = loadCfpbSnapshot();
  if (!file) return [];
  const byCompany = getCompanySnapshotMap();
  return CFPB_COMPANY_MAPPINGS.filter((m) =>
    m.cfpbCompanyNames.some((n) => byCompany.has(n))
  ).map((m) => m.ourLenderSlug);
}
