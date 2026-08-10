import { ExternalLink } from 'lucide-react';
import {
  getProgramLocationNote,
  type ProgramLocationNote,
} from '@/lib/programs/location-notes';

/** Explicit general vs location-specific DPA / market notes (FL, TX in V1). */
export function ProgramLocationPanel({
  stateSlug,
  note,
  compact,
}: {
  stateSlug?: string;
  note?: ProgramLocationNote;
  compact?: boolean;
}) {
  const resolved = note ?? getProgramLocationNote(stateSlug);
  if (!resolved) {
    return (
      <aside className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
        <p className="font-medium text-zinc-800">Location notes</p>
        <p className="mt-1">
          Most program rules are national or state-agency products. V1 location detail focuses on{' '}
          <strong>Florida</strong> and <strong>Texas</strong> as research markets we cover well.
          Elsewhere, start with your state housing finance agency and a HUD-approved counselor.
        </p>
      </aside>
    );
  }

  return (
    <aside
      className={
        compact
          ? 'rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-sm text-zinc-700'
          : 'rounded-xl border border-sky-200 bg-sky-50/60 px-4 py-4 text-sm text-zinc-700'
      }
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-900">
        Location-specific notes · {resolved.stateName}
      </p>
      <p className="mt-2 leading-relaxed">{resolved.general}</p>
      {!compact ? (
        <>
          <p className="mt-3 font-medium text-[#0A2540]">Down-payment assistance themes</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            {resolved.dpaThemes.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <ul className="mt-3 space-y-1">
            {resolved.sources.map((s) => (
              <li key={s.href}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-[#3B82F6] underline-offset-2 hover:underline"
                >
                  {s.label}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <p className="mt-2 text-xs text-zinc-500">
        Not a complete local DPA database. Confirm current rules on official sources.
      </p>
    </aside>
  );
}
