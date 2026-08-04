import type { ReactNode } from 'react';
import Link from 'next/link';
import { MapPin, ExternalLink } from 'lucide-react';
import { TrustMark } from '@/components/network/trust-mark';

export type EmptyCoverageLink = {
  href: string;
  label: string;
  external?: boolean;
};

export type EmptyCoveragePanelProps = {
  variant: 'unmapped' | 'filtered';
  title: string;
  description: string;
  placeLabel?: string;
  primarySources: EmptyCoverageLink[];
  widenLinks: EmptyCoverageLink[];
  className?: string;
  children?: ReactNode;
};

function cn(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(' ');
}

export function EmptyCoveragePanel({
  variant,
  title,
  description,
  placeLabel,
  primarySources,
  widenLinks,
  className,
  children,
}: EmptyCoveragePanelProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-5 py-8 text-center sm:px-8 sm:py-10',
        className
      )}
      role="status"
    >
      <MapPin className="mx-auto h-9 w-9 text-zinc-400" aria-hidden />
      <h3 className="mt-3 text-lg font-semibold tracking-tight text-[#0A2540]">{title}</h3>
      {placeLabel ? (
        <p className="mt-1 text-sm font-medium text-zinc-700">{placeLabel}</p>
      ) : null}
      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-zinc-600">{description}</p>
      {variant === 'unmapped' ? (
        <p className="mx-auto mt-2 max-w-lg text-xs text-zinc-500">
          Coverage is expanding. We do not invent lenders or claim nationwide county counts we
          cannot support.
        </p>
      ) : null}

      {primarySources.length > 0 ? (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Verify on primary sources
          </p>
          <ul className="mt-2 flex flex-wrap items-center justify-center gap-2">
            {primarySources.map((link) => (
              <li key={link.href + link.label}>
                <a
                  href={link.href}
                  className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-[#0A2540] hover:bg-zinc-50"
                  {...(link.external
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                >
                  {link.label}
                  {link.external ? (
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
                  ) : null}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {widenLinks.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Widen your research
          </p>
          <ul className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
            {widenLinks.map((link) => (
              <li key={link.href + link.label}>
                <Link
                  href={link.href}
                  className="font-semibold text-[#059669] underline-offset-2 hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {children}

      <p className="mt-6 text-xs text-zinc-500">
        Research only · Not an endorsement · Part of the Ask Trust Hub network
      </p>
      <div className="mt-2 flex justify-center">
        <TrustMark />
      </div>
    </div>
  );
}

export const NMLS_CONSUMER_ACCESS_URL = 'https://www.nmlsconsumeraccess.org/';
export const CFPB_HOME_URL = 'https://www.consumerfinance.gov/owning-a-home/';
