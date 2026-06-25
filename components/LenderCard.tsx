import Link from 'next/link';
import { Star, ShieldCheck, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Lender } from '@/lib/mockData';

export function LenderCard({
  lender,
  rank,
  countyLabel,
}: {
  lender: Lender;
  rank: number;
  countyLabel?: string;
}) {
  const locationLine = [
    lender.city,
    lender.state,
    countyLabel ? `Serves ${countyLabel}` : undefined,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <article
      id={`lender-${lender.id}`}
      aria-label={`#${rank} ${lender.name} — mortgage ${lender.type.toLowerCase()}${countyLabel ? ` in ${countyLabel}` : ''}`}
      className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-[#3B82F6]/40 sm:p-6"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0A2540]/10 text-sm font-bold text-[#0A2540]"
            aria-hidden="true"
          >
            {rank}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold leading-tight tracking-tight text-[#0A2540]">
              <Link
                href={`/lenders/${lender.slug}`}
                className="hover:text-[#3B82F6] transition-colors"
              >
                {lender.name}
              </Link>
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500">{locationLine}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-sm font-semibold text-amber-700">
          <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
          {lender.rating.toFixed(1)}
          <span className="text-xs font-normal text-zinc-500">
            ({lender.reviewCount.toLocaleString()} reviews)
          </span>
        </div>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-zinc-600">
        {lender.shortDescription}
      </p>

      <div className="mb-4 flex flex-wrap gap-1.5" aria-label="Loan types offered">
        {lender.loanTypes.slice(0, 4).map((type) => (
          <Badge key={type} variant="default">
            {type}
          </Badge>
        ))}
        {lender.specialties.slice(0, 2).map((specialty) => (
          <Badge key={specialty} variant="outline">
            {specialty}
          </Badge>
        ))}
      </div>

      <div className="mb-4 grid gap-2 text-xs text-zinc-500 sm:grid-cols-2">
        <div>
          <span className="font-medium text-[#0A2540]">NMLS:</span>{' '}
          {lender.nmlsId}
        </div>
        <div>
          <span className="font-medium text-[#0A2540]">Trust Score:</span>{' '}
          {lender.trustScore}/100
        </div>
        <div>
          <span className="font-medium text-[#0A2540]">County Experience:</span>{' '}
          {lender.countyExperienceScore}/100
        </div>
        <div>
          <span className="font-medium text-[#0A2540]">Avg Close:</span>{' '}
          {lender.avgCloseDays} days
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          {lender.nmlsVerified && (
            <span className="trust-badge flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              NMLS Verified
            </span>
          )}
          <span className="text-xs text-zinc-500">BBB {lender.bbbRating}</span>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/lenders/${lender.slug}`}
            className="text-sm font-semibold text-[#3B82F6] hover:text-[#0A2540] transition-colors"
          >
            View Profile
          </Link>
          {lender.website && (
            <a
              href={lender.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-zinc-500 hover:text-[#0A2540]"
            >
              Website <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}