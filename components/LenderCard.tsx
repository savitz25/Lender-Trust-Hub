import Link from 'next/link';
import { ExternalLink, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SaveLenderButton } from '@/components/my-lending/save-lender-button';
import type { Lender } from '@/lib/mockData';
import { NmlsVerificationBadge } from '@/components/nmls-verification-badge';
import { cleanNmlsId } from '@/lib/verification';
import { homeLocalityLine, type LenderPresenceLabel } from '@/lib/geo';
import { computeLenderResearchSignals } from '@/lib/research/research-signals';

export function LenderCard({
  lender,
  rank,
  countyLabel,
  profileReturnPath,
  presenceLabel,
}: {
  lender: Lender;
  rank?: number;
  countyLabel?: string;
  profileReturnPath?: string;
  presenceLabel?: LenderPresenceLabel | string;
}) {
  const geoLine = presenceLabel ?? homeLocalityLine(lender);
  const locationLine = [lender.city, lender.state, geoLine].filter(Boolean).join(' · ');
  const signals = computeLenderResearchSignals(lender);

  const profileHref = profileReturnPath
    ? `/lenders/${lender.slug}?from=${encodeURIComponent(profileReturnPath)}`
    : `/lenders/${lender.slug}`;

  return (
    <Card
      id={`lender-${lender.id}`}
      aria-label={`${rank != null ? `#${rank} ` : ''}${lender.name} — mortgage ${lender.type.toLowerCase()}${countyLabel ? ` in ${countyLabel}` : ''}`}
      className="group flex h-full flex-col overflow-hidden transition-colors hover:border-emerald-300"
    >
      <div className="flex flex-1 flex-col p-5">
        <div className="space-y-1.5">
          <div className="flex items-start gap-2">
            {rank != null ? (
              <span
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0A2540]/10 text-xs font-bold text-[#0A2540]"
                aria-hidden="true"
              >
                {rank}
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              <Link
                href={profileHref}
                className="block text-xl font-semibold tracking-tight text-[#0A2540] transition-colors group-hover:text-[#059669]"
              >
                {lender.name}
              </Link>
              <p className="mt-0.5 flex items-start gap-1 text-sm text-zinc-500">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{locationLine}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <Badge variant="outline" className="text-xs">
              {lender.type}
            </Badge>
            <NmlsVerificationBadge nmlsId={lender.nmlsId} nmlsVerified={lender.nmlsVerified} />
          </div>
        </div>

        <p className="mt-2 line-clamp-2 text-sm text-zinc-600">{lender.shortDescription}</p>

        <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Loan types offered">
          {lender.loanTypes.slice(0, 4).map((type) => (
            <Badge key={type} variant="default" className="text-xs">
              {type}
            </Badge>
          ))}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-zinc-500">
          <div>
            <dt className="font-medium text-[#0A2540]">NMLS</dt>
            <dd className="tabular-nums">
              {cleanNmlsId(lender.nmlsId) ? `#${cleanNmlsId(lender.nmlsId)}` : 'Not on file'}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-[#0A2540]">Research Score</dt>
            <dd className="tabular-nums">{signals.researchScore}/100</dd>
          </div>
          <div>
            <dt className="font-medium text-[#0A2540]">Data Confidence</dt>
            <dd className="tabular-nums">{signals.dataConfidence}/100</dd>
          </div>
          <div>
            <dt className="font-medium text-[#0A2540]">Local Evidence</dt>
            <dd className="tabular-nums">
              {signals.localMarket.hasEvidence ? `${signals.localMarket.score}/100` : '—'}
            </dd>
          </div>
        </dl>
        <p className="mt-2 text-[10px] leading-snug text-zinc-400">
          Research Score is not approval odds, rate, or closing speed.{' '}
          <Link href="/methodology#scores" className="text-[#059669] hover:underline">
            Methodology
          </Link>
        </p>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-zinc-100 bg-zinc-50/60 px-5 py-3.5">
        <SaveLenderButton
          lenderSlug={lender.slug}
          lenderName={lender.name}
          nmlsId={lender.nmlsId}
          loanTypes={lender.loanTypes}
          size="sm"
        />
        <Link href={profileHref} className="min-w-0 flex-1 sm:flex-none">
          <Button
            size="sm"
            variant="outline"
            className="min-h-11 w-full touch-manipulation sm:w-auto focus-visible:ring-2 focus-visible:ring-[#059669]"
          >
            View Profile
          </Button>
        </Link>
        {lender.website ? (
          <a
            href={lender.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <Button size="sm" variant="outline" className="gap-1">
              Website
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </Button>
          </a>
        ) : null}
      </div>
    </Card>
  );
}
