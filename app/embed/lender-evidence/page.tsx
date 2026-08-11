import type { Metadata } from 'next';
import {
  LenderEvidenceCard,
  LenderEvidenceCardEmpty,
} from '@/components/embed/lender-evidence-card';
import { parseLenderEvidenceEmbedParams } from '@/lib/embed/lender-evidence-params';
import { getLenderBySlug } from '@/lib/lenders';
import { getHmdaCountyEvidence, getHmdaLenderEvidenceBySlug } from '@/lib/hmda';
import { getCfpbComplaintEvidenceBySlug } from '@/lib/cfpb';

export const metadata: Metadata = {
  title: 'Lender Evidence Card Embed',
  description:
    'Read-only public-record evidence card for a single lender. Research only — not a lead form.',
  robots: { index: false, follow: true },
};

export const revalidate = 86400;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Stage C.3 — Lender Evidence Card Embed
 *
 * /embed/lender-evidence?lender=rocket-mortgage&state=FL&county=miami-dade&src=partner
 */
export default async function LenderEvidenceEmbedPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const parsed = parseLenderEvidenceEmbedParams(sp);

  if (parsed.error === 'missing-lender' || !parsed.lenderSlug) {
    return (
      <main className="p-3 sm:p-4">
        <LenderEvidenceCardEmpty reason="missing-lender" embedSrc={parsed.embedSrc} />
      </main>
    );
  }

  const lender = getLenderBySlug(parsed.lenderSlug);
  if (!lender) {
    return (
      <main className="p-3 sm:p-4">
        <LenderEvidenceCardEmpty
          reason="unknown-slug"
          slug={parsed.lenderSlug}
          embedSrc={parsed.embedSrc}
        />
      </main>
    );
  }

  const hmda = getHmdaLenderEvidenceBySlug(lender.slug);
  const cfpb = getCfpbComplaintEvidenceBySlug(lender.slug, {
    nmlsId: lender.nmlsId,
  });

  let countyHmda = null;
  let countyShareOriginations: number | null = null;
  if (parsed.stateSlug && parsed.county) {
    countyHmda = getHmdaCountyEvidence(parsed.stateSlug, parsed.county);
    if (hmda?.countyShares?.length) {
      const share = hmda.countyShares.find(
        (c) => c.countySlug === parsed.county
      );
      if (share && share.originations > 0) {
        countyShareOriginations = share.originations;
      }
    }
  }

  return (
    <main className="p-3 sm:p-4">
      <LenderEvidenceCard
        lender={lender}
        hmda={hmda}
        cfpb={cfpb}
        countyHmda={countyHmda}
        countyShareOriginations={countyShareOriginations}
        embedSrc={parsed.embedSrc}
      />
    </main>
  );
}
