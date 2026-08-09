import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Phone, ExternalLink } from 'lucide-react';
import { getLenderBySlug, lenders } from '@/lib/lenders';
import { Badge } from '@/components/ui/badge';
import { MatchLenderButton } from '@/components/MatchLenderButton';
import { SaveLenderButton } from '@/components/my-lending/save-lender-button';
import { RelatedDirectoryLinks } from '@/components/directory/RelatedDirectoryLinks';
import { TrustMark } from '@/components/network/trust-mark';
import { BeforeYouReachOut } from '@/components/research/before-you-reach-out';
import { ResearchScoreDisplay } from '@/components/research/research-score-display';
import { LenderProfileViewTracker } from '@/components/analytics/lender-profile-view-tracker';
import { deriveLenderHomeLocality, homeLocalityLine } from '@/lib/geo';
import { resolveNmlsVerification } from '@/lib/verification';
import { NmlsVerificationBadge } from '@/components/nmls-verification-badge';
import { computeLenderResearchSignals } from '@/lib/research/research-signals';
import { getHmdaLenderEvidenceBySlug } from '@/lib/hmda';
import { HmdaLenderEvidencePanel } from '@/components/hmda/HmdaLenderEvidencePanel';
import { getCfpbComplaintEvidenceBySlug } from '@/lib/cfpb';
import { CfpbComplaintPanel } from '@/components/cfpb/CfpbComplaintPanel';

export function generateStaticParams() {
  return lenders.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lender = getLenderBySlug(slug);
  if (!lender) return { title: 'Lender Not Found' };
  return {
    title: `${lender.name} — NMLS #${lender.nmlsId}`,
    description: lender.shortDescription,
  };
}

export default async function LenderProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lender = getLenderBySlug(slug);
  if (!lender) notFound();

  const home = deriveLenderHomeLocality(lender);
  const homeCountySlug = home.countySlug || lender.countySlug;
  const countyLabel = home.county
    ? `${home.county} County, ${lender.state}`
    : `${lender.county} County, ${lender.state}`;
  const nmls = resolveNmlsVerification({
    nmlsId: lender.nmlsId,
    nmlsVerified: lender.nmlsVerified,
  });
  const signals = computeLenderResearchSignals(lender);
  const hmdaEvidence = getHmdaLenderEvidenceBySlug(lender.slug);
  const cfpbEvidence = getCfpbComplaintEvidenceBySlug(lender.slug);

  return (
    <div className="container mx-auto px-4 py-12">
      <LenderProfileViewTracker slug={lender.slug} nmlsVerified={lender.nmlsVerified} />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-zinc-500">
        <ol className="flex flex-wrap items-center gap-1">
          <li><Link href="/" className="hover:text-[#059669]">Home</Link></li>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <li>
            <Link
              href={`/local-lenders/${lender.stateSlug}/${homeCountySlug}`}
              className="hover:text-[#059669]"
            >
              {countyLabel}
            </Link>
          </li>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <li><span className="text-[#0A2540]">{lender.name}</span></li>
        </ol>
      </nav>

      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                <NmlsVerificationBadge
                  nmlsId={lender.nmlsId}
                  nmlsVerified={lender.nmlsVerified}
                />
                <Badge variant="outline">{lender.type}</Badge>
                {home.county ? (
                  <Badge variant="outline">HQ in {home.county} County</Badge>
                ) : null}
              </div>
              <h1 className="text-3xl font-bold text-[#0A2540]">{lender.name}</h1>
              <p className="mt-1 text-zinc-500">
                {homeLocalityLine(lender)}
                {nmls.nmlsId ? ` · NMLS #${nmls.nmlsId}` : ' · NMLS incomplete'}
              </p>
            </div>
          </div>

          <p className="mb-6 text-zinc-600 leading-relaxed">{lender.shortDescription}</p>

          <div className="mb-6">
            <ResearchScoreDisplay lender={lender} />
          </div>
          <div className="mb-6 rounded-xl border border-dashed border-zinc-200 bg-white p-4 text-center">
            <div className="text-sm font-medium leading-snug text-zinc-600">
              No independently verified closing-performance data available
            </div>
            <div className="mt-1 text-xs text-zinc-500">Closing performance</div>
          </div>
          <p className="mb-3 text-xs text-zinc-500">
            Closing timelines are only shown when backed by a documented observed dataset (source,
            sample size, window). Seed or editorial estimates are not displayed.{' '}
            <Link href="/methodology#close-metrics" className="font-medium text-[#059669] hover:underline">
              Hub methodology
            </Link>
            . Research listing only — not an endorsement of this lender.
            {lender.nmlsId ? (
              <>
                {' '}
                Re-verify NMLS #{lender.nmlsId} on{' '}
                <a
                  href="https://www.nmlsconsumeraccess.org/"
                  className="font-medium text-[#059669] hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  NMLS Consumer Access
                </a>
              </>
            ) : (
              <>
                {' '}
                NMLS ID incomplete — recheck required on{' '}
                <a
                  href="https://www.nmlsconsumeraccess.org/"
                  className="font-medium text-[#059669] hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  NMLS Consumer Access
                </a>
              </>
            )}
            .
          </p>
          <div className="mb-6">
            <TrustMark />
          </div>

          <div className="mb-6">
            <h2 className="mb-2 font-semibold text-[#0A2540]">Loan Types</h2>
            <div className="flex flex-wrap gap-2">
              {lender.loanTypes.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="mb-2 font-semibold text-[#0A2540]">Specialties</h2>
            <div className="flex flex-wrap gap-2">
              {lender.specialties.map((s) => (
                <Badge key={s} variant="outline">{s}</Badge>
              ))}
            </div>
          </div>

          <div className="mb-6 space-y-2 rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Public metrics (provenance-gated)
            </p>
            {signals.metrics.cfpbComplaints.displayable ? (
              <div>
                <strong>CFPB complaints (catalog):</strong> {lender.cfpbComplaints}
                <p className="mt-0.5 text-xs text-zinc-500">{signals.metrics.cfpbComplaints.note}</p>
              </div>
            ) : null}
            {signals.metrics.creditTiers.displayable && lender.creditTiers?.length ? (
              <div>
                <strong>Product / credit tiers listed:</strong> {lender.creditTiers.join(', ')}
                <p className="mt-0.5 text-xs text-zinc-500">{signals.metrics.creditTiers.note}</p>
              </div>
            ) : null}
            {!signals.metrics.googleRating.displayable &&
            !signals.metrics.bbbRating.displayable &&
            !signals.metrics.nationalVolumeRank.displayable ? (
              <p className="text-xs text-zinc-500">
                Third-party review and BBB snapshots are suppressed until independently retrieved.
                Volume ranks are not shown without a documented source.
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-start gap-3">
            <SaveLenderButton
              lenderSlug={lender.slug}
              lenderName={lender.name}
              nmlsId={lender.nmlsId}
              loanTypes={lender.loanTypes}
            />
            {lender.phone && (
              <a
                href={`tel:${lender.phone.replace(/\D/g, '')}`}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0A2540] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0A2540]/90"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                {lender.phone}
              </a>
            )}
            {lender.website && (
              <a
                href={lender.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-[#0A2540] hover:bg-zinc-50"
              >
                Visit Website <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
            <MatchLenderButton
              filters={{
                stateSlug: lender.stateSlug,
                countySlug: lender.countySlug,
                loanType: lender.loanTypes[0],
              }}
            />
          </div>
        </div>

        {hmdaEvidence && <HmdaLenderEvidencePanel evidence={hmdaEvidence} />}

        {cfpbEvidence && <CfpbComplaintPanel evidence={cfpbEvidence} />}

        <div className="mt-8">
          <BeforeYouReachOut
            summaryLines={[
              lender.name,
              `NMLS #${lender.nmlsId}`,
              `${lender.city}, ${lender.state}`,
              `Profile: https://www.lendertrusthub.com/lenders/${lender.slug}`,
              'Re-verify on NMLS Consumer Access before applying',
            ]}
            mailtoSubject={`${lender.name} — Lender Trust Hub research notes`}
          />
        </div>

        <RelatedDirectoryLinks stateSlug={lender.stateSlug} stateName={lender.state} />

        <p className="mt-6 text-center text-xs text-zinc-400">
          Data aggregated from NMLS, CFPB, BBB, Google, and Trustpilot for informational
          purposes. Lender Trust Hub is not a lender or broker and does not provide
          financial advice.
        </p>
      </div>
    </div>
  );
}