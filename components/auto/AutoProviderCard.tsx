import { Star, ShieldCheck, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { AutoLoanProvider } from '@/lib/auto/types';

export function AutoProviderCard({
  provider,
  rank,
}: {
  provider: AutoLoanProvider;
  rank: number;
}) {
  return (
    <article
      id={`provider-${provider.id}`}
      aria-label={`#${rank} ${provider.name} — auto loan ${provider.type.toLowerCase()} in ${provider.state}`}
      className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-[#00A3A1]/40 sm:p-6"
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
            <h3 className="text-lg font-semibold leading-tight text-[#0A2540]">{provider.name}</h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              {provider.city}, {provider.state} · {provider.type}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-sm font-semibold text-amber-700">
          <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
          {provider.rating.toFixed(1)}
          <span className="text-xs font-normal text-zinc-500">
            ({provider.reviewCount.toLocaleString()})
          </span>
        </div>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-zinc-600">{provider.shortDescription}</p>

      <div className="mb-4 flex flex-wrap gap-2">
        {provider.verified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            Verified
          </span>
        )}
        <Badge variant="outline">APR {provider.aprRange}</Badge>
        {provider.loanTypes.map((t) => (
          <Badge key={t} variant="outline">
            {t}
          </Badge>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {provider.website && (
          <a
            href={provider.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A2540] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d3a5c]"
          >
            Get Rates <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        )}
        {provider.phone && (
          <a
            href={`tel:${provider.phone.replace(/\D/g, '')}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-[#0A2540] hover:bg-zinc-50"
          >
            {provider.phone}
          </a>
        )}
      </div>
    </article>
  );
}