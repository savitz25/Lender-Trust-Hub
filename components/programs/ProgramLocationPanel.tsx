import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import {
  getProgramLocationNote,
  type ProgramLocationNote,
} from '@/lib/programs/location-notes';
import { cn } from '@/lib/utils';

/** Explicit general vs location-specific DPA / market notes (FL, TX). */
export function ProgramLocationPanel({
  stateSlug,
  note,
  compact,
  showFullDetail,
  className,
}: {
  stateSlug?: string;
  note?: ProgramLocationNote;
  compact?: boolean;
  /** Full research steps + layering (DPA page). Default true when not compact. */
  showFullDetail?: boolean;
  className?: string;
}) {
  const resolved = note ?? getProgramLocationNote(stateSlug);
  const full = showFullDetail ?? !compact;

  if (!resolved) {
    return (
      <aside
        className={cn(
          'rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600',
          className
        )}
      >
        <p className="font-medium text-zinc-800">Location notes</p>
        <p className="mt-1">
          Stronger DPA research detail is available for <strong>Florida</strong> and{' '}
          <strong>Texas</strong>. Elsewhere, start with your state housing finance agency and a
          HUD-approved counselor—we do not inventory every U.S. local program.
        </p>
        <p className="mt-2">
          <Link
            href="/programs/down-payment-assistance"
            className="font-medium text-[#059669] hover:underline"
          >
            National DPA overview
          </Link>
        </p>
      </aside>
    );
  }

  if (compact) {
    return (
      <aside
        className={cn(
          'rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-sm text-zinc-700',
          className
        )}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-900">
          {resolved.stateName} · Down-payment assistance research
        </p>
        <p className="mt-2 leading-relaxed">{resolved.general}</p>
        <p className="mt-2 font-medium text-[#0A2540]">Best next official steps</p>
        <ul className="mt-1.5 space-y-1.5">
          {resolved.sources.slice(0, 3).map((s) => (
            <li key={s.href}>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-[#3B82F6] underline-offset-2 hover:underline"
              >
                {s.label}
                <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
              </a>
              {s.note ? <span className="block text-xs text-zinc-500">{s.note}</span> : null}
            </li>
          ))}
        </ul>
        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium">
          {resolved.nextResearch.slice(0, 4).map((n) => (
            <li key={n.href}>
              <Link href={n.href} className="text-[#059669] hover:underline">
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-zinc-500">
          Educational only — not eligibility, funding status, or a full local inventory.
        </p>
      </aside>
    );
  }

  return (
    <aside
      id={resolved.stateSlug}
      className={cn(
        'scroll-mt-24 rounded-2xl border border-sky-200 bg-sky-50/50 px-4 py-5 text-sm text-zinc-700 shadow-sm sm:px-5',
        className
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-900">
        Location-aware DPA research · {resolved.stateName}
      </p>
      <h3 className="mt-1 text-lg font-bold text-[#0A2540]">{resolved.stateName} starting points</h3>
      <p className="mt-2 leading-relaxed">{resolved.general}</p>

      {full ? (
        <>
          <h4 className="mt-5 font-semibold text-[#0A2540]">Where to begin (official path)</h4>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5">
            {resolved.researchSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          <h4 className="mt-5 font-semibold text-[#0A2540]">Common DPA themes</h4>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            {resolved.dpaThemes.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>

          <h4 className="mt-5 font-semibold text-[#0A2540]">
            How DPA often layers with FHA / conventional
          </h4>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            {resolved.firstMortgageLayering.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>

          <h4 className="mt-5 font-semibold text-amber-950">Caveats that matter most</h4>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            {resolved.caveats.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <h4 className="mt-4 font-semibold text-[#0A2540]">Common DPA themes</h4>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            {resolved.dpaThemes.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </>
      )}

      <h4 className="mt-5 font-semibold text-[#0A2540]">Official sources</h4>
      <ul className="mt-2 space-y-2">
        {resolved.sources.map((s) => (
          <li key={s.href}>
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-[#3B82F6] underline-offset-2 hover:underline"
            >
              {s.label}
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
            </a>
            {s.note ? <span className="mt-0.5 block text-xs text-zinc-500">{s.note}</span> : null}
          </li>
        ))}
      </ul>

      <h4 className="mt-5 font-semibold text-[#0A2540]">Continue research on this site</h4>
      <ul className="mt-2 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-x-4">
        {resolved.nextResearch.map((n) => (
          <li key={n.href}>
            <Link href={n.href} className="font-medium text-[#059669] hover:underline">
              {n.label}
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-4 rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-xs text-amber-950">
        Not a complete local DPA database. County and city programs vary and change. Confirm
        everything on official sources before acting.
      </p>
    </aside>
  );
}
