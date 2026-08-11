import type { Metadata } from 'next';
import { getHmdaCountyEvidence } from '@/lib/hmda';
import {
  HmdaCountySnapshot,
  HmdaCountySnapshotEmpty,
} from '@/components/embed/hmda-county-snapshot';
import {
  buildCountyResearchDeepLink,
  parseEmbedHmdaCountyParams,
} from '@/lib/embed/hmda-county-params';

export const metadata: Metadata = {
  title: 'HMDA County Snapshot Embed',
  description: 'Read-only embeddable HMDA county mortgage market research snapshot.',
  robots: { index: false, follow: true },
};

export const revalidate = 86400;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Stage C.1 — County HMDA Snapshot Embed
 *
 * /embed/hmda-county?state=FL&county=miami-dade&src=partner
 */
export default async function HmdaCountyEmbedPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const parsed = parseEmbedHmdaCountyParams(sp);

  if (parsed.error === 'missing-params') {
    return (
      <main className="p-3 sm:p-4">
        <HmdaCountySnapshotEmpty
          hubHref="https://www.lendertrusthub.com/local-lenders"
          embedSrc={parsed.src}
          reason="missing-params"
        />
      </main>
    );
  }

  if (parsed.error === 'unknown-state' || !parsed.stateSlug || !parsed.county) {
    return (
      <main className="p-3 sm:p-4">
        <HmdaCountySnapshotEmpty
          countyLabel={parsed.county}
          hubHref="https://www.lendertrusthub.com/local-lenders"
          embedSrc={parsed.src}
          reason="unknown-state"
        />
      </main>
    );
  }

  const evidence = getHmdaCountyEvidence(parsed.stateSlug, parsed.county);

  if (!evidence) {
    return (
      <main className="p-3 sm:p-4">
        <HmdaCountySnapshotEmpty
          stateLabel={parsed.stateCode ?? parsed.stateName}
          countyLabel={parsed.county}
          hubHref={`https://www.lendertrusthub.com/local-lenders/${parsed.stateSlug}`}
          embedSrc={parsed.src}
          reason="no-data"
        />
      </main>
    );
  }

  const deepLink = buildCountyResearchDeepLink({
    stateSlug: evidence.stateSlug,
    county: evidence.countySlug,
    embedSrc: parsed.src,
  });

  return (
    <main className="p-3 sm:p-4">
      <HmdaCountySnapshot
        evidence={evidence}
        deepLink={deepLink}
        embedSrc={parsed.src}
      />
    </main>
  );
}
