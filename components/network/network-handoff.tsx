import { ArrowUpRight } from 'lucide-react';
import {
  resolveLifeJourney,
  type LifeJourneyContext,
  type LifeJourneyGeography,
} from '@/lib/network/life-journey';
import { TrustMark } from '@/components/network/trust-mark';
import { CrossHubLink } from '@/components/network/cross-hub-link';

export type NetworkHandoffProps = {
  context: LifeJourneyContext;
  geography?: LifeJourneyGeography;
  variant?: 'card' | 'inline' | 'compact';
  className?: string;
};

function cn(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(' ');
}

/**
 * LifeJourneyNext / NetworkJourneyStrip — contextual only.
 * Max 2 outbound absolute production URLs.
 */
export function NetworkHandoff({
  context,
  geography,
  variant = 'card',
  className,
}: NetworkHandoffProps) {
  const content = resolveLifeJourney(context, geography);
  const links = content.links.slice(0, 2);
  if (links.length === 0) return null;

  if (variant === 'inline' || variant === 'compact') {
    return (
      <aside
        className={cn(
          'rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm',
          className
        )}
        aria-label={content.label}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          {content.label}
        </p>
        <p className="mt-1.5 leading-relaxed text-zinc-600">{content.body}</p>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {links.map((link) => (
            <CrossHubLink
              key={link.href}
              href={link.href}
              currentHub="lender"
              className="inline-flex items-center gap-1 font-semibold text-zinc-900 underline-offset-2 hover:underline"
            >
              {link.label}
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
            </CrossHubLink>
          ))}
        </p>
        <div className="mt-2">
          <TrustMark variant="text" />
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        'rounded-xl border border-zinc-200 bg-white px-5 py-5 sm:px-6',
        className
      )}
      aria-label={content.label}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
        {content.label}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600 sm:text-[15px]">{content.body}</p>
      <ul className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {links.map((link) => (
          <li key={link.href}>
            <CrossHubLink
              href={link.href}
              currentHub="lender"
              className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:border-blue-300 hover:bg-zinc-50 sm:w-auto"
            >
              {link.label}
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
            </CrossHubLink>
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <TrustMark />
      </div>
    </aside>
  );
}
