import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star, ShieldCheck, ChevronRight, Phone, ExternalLink } from 'lucide-react';
import { getLenderBySlug, lenders } from '@/lib/lenders';
import { Badge } from '@/components/ui/badge';
import { MatchLenderButton } from '@/components/MatchLenderButton';
import { SaveLenderButton } from '@/components/my-lending/save-lender-button';
import { RelatedDirectoryLinks } from '@/components/directory/RelatedDirectoryLinks';
import { TrustMark } from '@/components/network/trust-mark';
import { BeforeYouReachOut } from '@/components/research/before-you-reach-out';

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

  const countyLabel = `${lender.county} County, ${lender.state}`;

  return (
    <div className="container mx-auto px-4 py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-zinc-500">
        <ol className="flex flex-wrap items-center gap-1">
          <li><Link href="/" className="hover:text-[#3B82F6]">Home</Link></li>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <li>
            <Link
              href={`/local-lenders/${lender.stateSlug}/${lender.countySlug}`}
              className="hover:text-[#3B82F6]"
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
                <span className="trust-badge">
                  <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                  NMLS Verified
                </span>
                <Badge variant="outline">{lender.type}</Badge>
              </div>
              <h1 className="text-3xl font-bold text-[#0A2540]">{lender.name}</h1>
              <p className="mt-1 text-zinc-500">
                {lender.city}, {lender.state} · NMLS #{lender.nmlsId}
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5 text-lg font-semibold text-amber-700">
              <Star className="h-5 w-5 fill-current" aria-hidden="true" />
              {lender.rating.toFixed(1)}
              <span className="text-sm font-normal text-zinc-500">
                ({lender.reviewCount.toLocaleString()})
              </span>
            </div>
          </div>

          <p className="mb-6 text-zinc-600 leading-relaxed">{lender.shortDescription}</p>

          <div className="mb-2 grid gap-4 sm:grid-cols-2">
            {[
              {
                label: 'Trust Score',
                value: `${lender.trustScore}/100`,
                note: 'Research composite — not a credit decision',
              },
              {
                label: 'County Experience',
                value: `${lender.countyExperienceScore}/100`,
                note: 'Relative market orientation',
              },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-zinc-50 p-4 text-center">
                <div className="text-xl font-bold text-[#0A2540]">{stat.value}</div>
                <div className="text-xs text-zinc-500">{stat.label}</div>
                <div className="mt-1 text-[10px] text-zinc-400">{stat.note}</div>
              </div>
            ))}
          </div>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            {[
              {
                label: 'Close estimate (editorial)*',
                value: `~${lender.avgCloseDays} days`,
              },
              {
                label: 'On-time close (editorial)*',
                value: `${lender.onTimeCloseRate}%`,
              },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-dashed border-zinc-200 bg-white p-4 text-center">
                <div className="text-xl font-bold text-[#0A2540]">{stat.value}</div>
                <div className="text-xs text-zinc-500">{stat.label}</div>
              </div>
            ))}
          </div>
          <p className="mb-3 text-xs text-zinc-500">
            *Close metrics are editorial/seed estimates — not NMLS or CFPB official fields.{' '}
            <Link href="/methodology#close-metrics" className="font-medium text-[#3B82F6] hover:underline">
              Hub methodology
            </Link>
            . Research listing only — not an endorsement of this lender. Re-verify NMLS #
            {lender.nmlsId} on{' '}
            <a
              href="https://www.nmlsconsumeraccess.org/"
              className="font-medium text-[#3B82F6] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              NMLS Consumer Access
            </a>
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

          <div className="mb-6 grid gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm sm:grid-cols-2">
            <div><strong>BBB Rating:</strong> {lender.bbbRating}</div>
            <div><strong>CFPB Complaints:</strong> {lender.cfpbComplaints}</div>
            <div><strong>Google Rating:</strong> {lender.googleRating}/5</div>
            <div><strong>Trustpilot:</strong> {lender.trustpilotRating}/5</div>
            <div><strong>National Volume Rank:</strong> #{lender.nationalVolumeRank}</div>
            <div><strong>Credit Tiers Served:</strong> {lender.creditTiers.join(', ')}</div>
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