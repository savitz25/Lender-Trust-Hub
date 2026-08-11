import { ArrowUpRight } from 'lucide-react';
import type { Lender } from '@/lib/mockData';
import type { HmdaCountyEvidence, HmdaLenderEvidence } from '@/lib/hmda';
import type { CfpbComplaintEvidence } from '@/lib/cfpb';
import { resolveNmlsVerification } from '@/lib/verification';
import { getLenderEvidenceBadges } from '@/lib/research/research-signals';
import { homeLocalityLine } from '@/lib/geo';
import { EmbedAnalytics } from '@/components/embed/embed-analytics';
import { analyzerCountyOptionSlug } from '@/lib/tools/loan-estimate-analyzer/county-option';

type Props = {
  lender: Lender;
  hmda: HmdaLenderEvidence | null;
  cfpb: CfpbComplaintEvidence | null;
  countyHmda: HmdaCountyEvidence | null;
  /** Optional county share for this lender when county provided */
  countyShareOriginations: number | null;
  embedSrc?: string;
};

function BadgePill({
  present,
  label,
}: {
  present: boolean;
  label: string;
}) {
  return (
    <span
      className={
        present
          ? 'inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-900'
          : 'inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-500'
      }
    >
      {label}
    </span>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200/90 bg-white px-2.5 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-0.5 text-sm font-bold tabular-nums text-[#0A2540] sm:text-base">{value}</p>
      {hint ? <p className="mt-0.5 text-[10px] leading-snug text-zinc-500">{hint}</p> : null}
    </div>
  );
}

/**
 * Stage C.3 — compact read-only lender evidence card for embeds.
 * Evidence badges / public-record metrics only — no Research Score, no lead form.
 */
export function LenderEvidenceCard({
  lender,
  hmda,
  cfpb,
  countyHmda,
  countyShareOriginations,
  embedSrc,
}: Props) {
  const nmls = resolveNmlsVerification({
    nmlsId: lender.nmlsId,
    nmlsVerified: lender.nmlsVerified,
  });
  const badges = getLenderEvidenceBadges(lender, {
    hmdaAvailable: Boolean(hmda),
    cfpbRecordAvailable: Boolean(cfpb),
  });
  const locality = homeLocalityLine(lender) || `${lender.city}, ${lender.state}`;
  const profileHref = `https://www.lendertrusthub.com/lenders/${lender.slug}${
    embedSrc ? `?src=embed&partner=${encodeURIComponent(embedSrc)}` : '?src=embed'
  }`;

  const leHref = (() => {
    const p = new URLSearchParams();
    p.set('lender', lender.slug);
    if (countyHmda) {
      const opt = analyzerCountyOptionSlug(countyHmda.stateSlug, countyHmda.countySlug);
      if (opt) p.set('county', opt);
    }
    if (embedSrc) p.set('src', 'embed');
    return `https://www.lendertrusthub.com/tools/loan-estimate-analyzer?${p.toString()}`;
  })();

  const hasRating =
    ((lender.googleRating ?? lender.rating) ?? 0) > 0 && (lender.reviewCount ?? 0) > 0;

  return (
    <article
      className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-[#0A2540]/12 bg-white shadow-sm"
      data-embed="lender-evidence"
      data-lender={lender.slug}
    >
      <EmbedAnalytics
        kind="lender-evidence"
        state={countyHmda?.stateSlug ?? lender.stateSlug}
        county={countyHmda?.countySlug}
        embedSrc={embedSrc}
        hasData
        extra={{
          lender: lender.slug,
          has_hmda: Boolean(hmda),
          has_cfpb: Boolean(cfpb),
        }}
      />

      <header className="border-b border-[#0A2540]/10 bg-[#0A2540] px-4 py-3.5 text-white">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-200/90">
          Lender research · Public record
        </p>
        <h1 className="mt-1 text-base font-bold leading-snug sm:text-lg">{lender.name}</h1>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-200">
          {lender.type}
          {locality ? ` · ${locality}` : ''}
          {nmls.nmlsId ? ` · NMLS #${nmls.nmlsId}` : ' · NMLS incomplete'}
        </p>
      </header>

      <div className="space-y-3 p-4">
        <div className="flex flex-wrap gap-1.5">
          {badges.map((b) => (
            <BadgePill key={b.id} present={b.present} label={b.label} />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {hmda && (hmda.stateOriginations != null || hmda.floridaOriginations != null) ? (
            <Metric
              label={`HMDA originations (${hmda.stateName || hmda.state})`}
              value={(hmda.stateOriginations ?? hmda.floridaOriginations ?? 0).toLocaleString(
                'en-US'
              )}
              hint={`${hmda.year} · volume, not a rating`}
            />
          ) : (
            <Metric
              label="HMDA activity"
              value="Not matched"
              hint="No LEI/slug match in research tables"
            />
          )}

          {cfpb ? (
            <Metric
              label="CFPB complaints"
              value={String(cfpb.totalComplaints)}
              hint="Mortgage product · not a finding of fault"
            />
          ) : (
            <Metric
              label="CFPB record"
              value="Not shown"
              hint="No matched complaint panel"
            />
          )}

          {countyHmda ? (
            <Metric
              label={`${countyHmda.countyName} County market`}
              value={countyHmda.originations.toLocaleString('en-US')}
              hint={`${countyHmda.year} originations · county total`}
            />
          ) : null}

          {countyShareOriginations != null && countyShareOriginations > 0 ? (
            <Metric
              label="Lender in this county"
              value={countyShareOriginations.toLocaleString('en-US')}
              hint="HMDA originations (matched)"
            />
          ) : null}

          {hasRating ? (
            <Metric
              label="Attributed rating snapshot"
              value={`${(lender.googleRating || lender.rating).toFixed(1)} · ${lender.reviewCount}`}
              hint="Catalog snapshot · confirm on source platforms"
            />
          ) : null}
        </div>

        {!hmda && !cfpb ? (
          <p className="rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-[11px] leading-relaxed text-amber-950">
            Limited public-record panels for this listing. Open the full profile to re-verify NMLS
            and review available research modules.
          </p>
        ) : null}

        <p className="text-[11px] leading-relaxed text-zinc-500">
          Evidence chips and federal panels only — not a scoreboard or endorsement.
          {hmda ? ` HMDA: ${hmda.source}.` : ''}
          {cfpb ? ` CFPB: public Consumer Complaint Database.` : ''}
        </p>
        <p className="text-[11px] font-medium text-zinc-600">
          We show the public record. You decide.
        </p>

        <a
          href={profileHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A2540] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0d3356]"
          data-embed-cta="full-profile"
          data-embed-src={embedSrc ?? ''}
        >
          View full lender research
          <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
        </a>
        <a
          href={leHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-1 text-xs font-semibold text-emerald-800 hover:underline"
          data-embed-cta="loan-estimate-analyzer"
        >
          Analyze a Loan Estimate with this lender
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </a>
        <p className="text-center text-[10px] text-zinc-400">
          Lender Trust Hub · research only · no lead form
        </p>
      </div>
    </article>
  );
}

export function LenderEvidenceCardEmpty({
  reason,
  slug,
  embedSrc,
}: {
  reason: 'missing-lender' | 'unknown-slug';
  slug?: string;
  embedSrc?: string;
}) {
  const hub = 'https://www.lendertrusthub.com/local-lenders';
  return (
    <article
      className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
      data-embed="lender-evidence"
      data-embed-empty={reason}
    >
      <EmbedAnalytics
        kind="lender-evidence"
        embedSrc={embedSrc}
        hasData={false}
        extra={{ reason, lender: slug ?? '' }}
      />
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Lender research
      </p>
      <h1 className="mt-1 text-base font-bold text-[#0A2540]">
        {reason === 'missing-lender'
          ? 'Lender slug required'
          : 'Lender not found in directory'}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
        {reason === 'missing-lender'
          ? 'Use ?lender={slug} (for example lender=rocket-mortgage).'
          : `No research listing for “${slug}”. Browse the directory for NMLS-oriented profiles.`}
      </p>
      <p className="mt-3 text-[11px] text-zinc-500">
        Research only · We show the public record when available. You decide.
      </p>
      <a
        href={hub}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#0A2540]/20 bg-zinc-50 px-4 py-3 text-sm font-semibold text-[#0A2540] hover:bg-zinc-100"
        data-embed-cta="hub-fallback"
      >
        Browse lender research
        <ArrowUpRight className="h-4 w-4" aria-hidden />
      </a>
    </article>
  );
}
