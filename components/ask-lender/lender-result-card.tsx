'use client';

import Link from 'next/link';
import { useRef, type PointerEvent, type ReactNode } from 'react';
import { pointerMovedPastCardScroll } from '@/components/ask-lender/ask-result-card-gesture';
import type { AskIdentityStatus, AskInstitutionRow } from '@/lib/ask-lender/types';

type DragPoint = { x: number; y: number; lastX: number; lastY: number };

const interactiveCardClass =
  'relative min-w-0 cursor-pointer touch-pan-y rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm motion-safe:transition-[border-color,box-shadow,background-color] motion-safe:duration-150 motion-reduce:transition-none hover:border-emerald-300 hover:bg-[#F8FAFC] hover:shadow-md focus-within:border-[#059669] focus-within:ring-2 focus-within:ring-inset focus-within:ring-[#059669] sm:p-5';

const staticCardClass =
  'relative min-w-0 touch-pan-y rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-5';

const controlClass = 'pointer-events-auto relative z-20';

function statusPhrase(status: AskIdentityStatus): string {
  if (status === 'public_profile') return 'Public research profile';
  if (status === 'identity_hold') return 'Identity hold';
  if (status === 'unpublished_research_identity') return 'Unpublished research identity';
  return 'HMDA reporting LEI';
}

function classification(row: AskInstitutionRow): string | null {
  if (row.resolvedClass === 'person') return 'Person';
  if (row.resolvedClass === 'branch') return 'Branch';
  const label = row.evidenceAvailable?.length === 1 ? row.evidenceAvailable[0] : null;
  if (label && label.length <= 80 && !/[.;]/.test(label)) return label;
  if (row.resolvedClass === 'institution') return 'Institution';
  return null;
}

/** One quiet sentence. The full whyMatched list stays in the disclosure. */
export function restingMatchLine(row: AskInstitutionRow): string {
  const why = row.whyMatched.join(' ');
  if (/NMLS institution/i.test(why)) return 'Matched by NMLS institution ID.';
  if (/\bLEI\b/.test(why) && /identifier/i.test(why)) return 'Matched by LEI.';
  if (/name/i.test(why)) return 'Matched by institution name.';
  return 'Matched by institution identity.';
}

function CardShell({ href, children }: { href: string | null; children: ReactNode }) {
  const drag = useRef<DragPoint | null>(null);
  const interactive = Boolean(href);

  function rememberPoint(event: PointerEvent<HTMLElement>) {
    drag.current = { x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY };
  }

  function trackPoint(event: PointerEvent<HTMLElement>) {
    const start = drag.current;
    if (!start) return;
    start.lastX = event.clientX;
    start.lastY = event.clientY;
  }

  return (
    <article
      data-ask-card
      data-ask-card-nav={interactive ? 'profile' : 'none'}
      className={interactive ? interactiveCardClass : staticCardClass}
      onPointerDown={interactive ? rememberPoint : undefined}
      onPointerMove={interactive ? trackPoint : undefined}
      onPointerCancel={interactive ? () => { drag.current = null; } : undefined}
    >
      {href ? (
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          data-specialist-event="profile_open"
          data-ask-card-surface
          className="absolute inset-0 z-0 rounded-2xl"
          onClick={(event) => {
            const start = drag.current;
            drag.current = null;
            if (start && pointerMovedPastCardScroll(start.x, start.y, start.lastX, start.lastY)) event.preventDefault();
          }}
        />
      ) : null}
      <div className={href ? 'relative z-10 min-w-0 pointer-events-none' : 'relative min-w-0'}>{children}</div>
    </article>
  );
}

export function LenderResultCard({
  row,
  period,
  grain,
  geographyWarning,
}: {
  row: AskInstitutionRow;
  period?: string;
  grain?: string;
  geographyWarning: string;
}) {
  const kind = classification(row);
  const profile = Boolean(row.href);
  return (
    <CardShell href={row.href ?? null}>
      <h4 className="text-lg font-semibold tracking-tight text-[#0A2540] [overflow-wrap:anywhere]" data-identity-status={row.identityStatus}>
        {row.displayName}
      </h4>
      {kind ? <p className="mt-1 text-sm text-zinc-600">{kind}</p> : null}
      {row.nmls || row.lei ? (
        <dl className="mt-3 space-y-1 text-sm text-[#0A2540]">
          {row.nmls ? (
            <div className="[overflow-wrap:anywhere]">
              <dt className="inline font-medium">NMLS </dt>
              <dd className="inline">#{row.nmls}</dd>
            </div>
          ) : null}
          {row.lei ? (
            <div className="[overflow-wrap:anywhere]">
              <dt className="inline font-medium">LEI </dt>
              <dd className="inline font-mono text-[13px]">{row.lei}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      <p className="mt-3 text-sm text-zinc-700">{statusPhrase(row.identityStatus)}</p>
      <p className="mt-1 text-sm text-zinc-700">
        {profile ? 'Public LenderTrustHub research profile' : 'No LenderTrustHub profile is currently published.'}
      </p>
      {profile ? (
        <div className="mt-4">
          <Link
            href={row.href!}
            data-specialist-event="profile_open"
            data-card-control
            className={`${controlClass} inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#059669] px-4 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#059669] sm:w-auto`}
          >
            View lender profile →
          </Link>
        </div>
      ) : row.officialHref ? (
        <div className="mt-4">
          <a
            href={row.officialHref}
            rel="noopener noreferrer"
            target="_blank"
            data-specialist-event="official_verification_open"
            data-card-control
            className={`${controlClass} inline-flex min-h-11 items-center text-sm font-medium text-[#0A2540] underline decoration-zinc-300 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#059669]`}
          >
            {row.officialLabel ?? 'Verify identity with official registry'} ↗
          </a>
        </div>
      ) : null}
      <p data-ask-match-line className="mt-3 text-sm text-zinc-500">{restingMatchLine(row)}</p>
      <details data-specialist-event="trace_open" data-card-control className={`${controlClass} mt-3 border-t border-[#E2E8F0] pt-1 text-sm`}>
        <summary className="min-h-11 cursor-pointer py-2 font-medium text-zinc-600">How we matched this result</summary>
        <div className="pb-2 text-[#0A2540]">
          <h5 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Trace this result</h5>
          <p className="mt-2"><strong>Why this matched</strong></p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {row.whyMatched.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {row.matchEvidence?.map((evidence) => (
            <p key={`${evidence.family}-${evidence.matchedField}`} className="mt-2 [overflow-wrap:anywhere]">
              Requested {evidence.family === 'LEI' ? 'LEI' : 'NMLS institution ID'}: <code>{evidence.requestedValue}</code>.
              Matched field {evidence.matchedField} = <code>{evidence.returnedValue}</code>.
              Institution key: <code>{evidence.institutionKey}</code>.
              Source: {evidence.sourceReference}. Official source-as-of: {evidence.sourceAsOf ?? 'not supplied'}.
            </p>
          ))}
          {row.institutionKey ? <p className="mt-2 [overflow-wrap:anywhere]">Institution key: <code>{row.institutionKey}</code>.</p> : null}
          <p className="mt-2"><strong>Evidence available:</strong> {(row.evidenceAvailable?.length ? row.evidenceAvailable : ['institution identity']).join('; ')}.</p>
          {row.identityNote ? <p className="mt-2">{row.identityNote}</p> : null}
          <p className="mt-2 text-xs text-zinc-600">
            {period ?? 'Committed publication manifest'} · {grain ?? 'institution identity'}. {geographyWarning} Property geography is not lender location or service territory.
          </p>
        </div>
      </details>
    </CardShell>
  );
}
