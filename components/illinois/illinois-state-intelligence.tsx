import Link from 'next/link';
import { fmtInt, fmtPct, type IllinoisIntelligenceSnapshot } from '@/lib/illinois-intelligence/snapshot';

function Metric({ value, label, hint }: { value: string; label: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="break-words text-2xl font-bold tabular-nums text-[#0A2540]">{value}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{label}</p>
      {hint ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{hint}</p> : null}
    </div>
  );
}

function Official({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="font-medium text-[#047857] underline underline-offset-2" rel="noopener noreferrer" target="_blank">
      {label}
    </a>
  );
}

export function IllinoisStateIntelligenceUnavailable({ reason }: { reason: string }) {
  return (
    <div className="th-shell mx-auto w-full max-w-[880px] overflow-x-clip px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-bold text-[#0A2540]">Illinois Mortgage Lending Intelligence</h1>
      <p className="mt-3 text-sm text-slate-600">{reason}</p>
    </div>
  );
}

export function IllinoisStateIntelligence({ snapshot }: { snapshot: IllinoisIntelligenceSnapshot }) {
  const s = snapshot;
  const H = s.hmda;
  const mixMax = Math.max(H.apps_conventional, H.apps_fha, H.apps_va, H.apps_usda_other);
  return (
    <div className="th-shell mx-auto w-full max-w-[880px] overflow-x-clip px-4 py-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-600">
        <ol className="flex flex-wrap gap-1">
          <li>
            <Link href="/" className="text-[#047857] underline underline-offset-2">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-slate-800">Illinois research</li>
        </ol>
      </nav>
      <header className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#047857]">Independent research · Illinois · statewide only</p>
        <h1 className="mt-1 break-words text-2xl font-bold text-[#0A2540] sm:text-3xl">Illinois Mortgage Lending Intelligence</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          This page publishes 2025 HMDA activity for properties in Illinois and existing FDIC depository context. Current
          IDFPR mortgage-company licensing is search-only through{' '}
          <Official href={s.regulators.lookup} label="IDFPR License Look Up" /> and{' '}
          <Official href={s.regulators.nmls} label="NMLS Consumer Access" />. An HMDA application is not a lender. An
          FDIC-insured bank is not an IDFPR mortgage banker. This is not a ranking, recommendation, or Trust Score.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          No Chicago, Cook County, or other local Illinois lender pages are published from this statewide page.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Snapshot {s.contract_name} · fingerprint {s.fingerprint.slice(0, 12)} · HMDA vintage {s.hmda.source_as_of} ·
          FDIC overlay as of {s.fdic.source_as_of}. Original retrieval instants for those reused artifacts are not
          recorded. Page generated {s.generated_at} is not a source retrieval date.
        </p>
      </header>

      <section aria-labelledby="hero-metrics" className="mt-8">
        <h2 id="hero-metrics" className="sr-only">
          Snapshot metrics
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric value={fmtInt(H.applications)} label="HMDA 2025 Illinois applications" hint="Property geography. Not lenders and not current licenses." />
          <Metric value={fmtInt(H.originations)} label="HMDA 2025 Illinois originations" hint="Originations are not a company count." />
          <Metric value={fmtInt(s.fdic.institution_rows)} label="FDIC Illinois depositories" hint="Supporting context. Bank ≠ IDFPR mortgage banker." />
          <Metric value={fmtInt(H.county_count)} label="Illinois counties in the HMDA slice" hint="County rows are not county pages." />
        </div>
      </section>

      <section className="mt-10" aria-labelledby="hmda-heading">
        <h2 id="hmda-heading" className="text-lg font-semibold text-[#0A2540]">
          HMDA 2025 Illinois
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {fmtInt(H.applications)} applications, {fmtInt(H.originations)} originations, {fmtInt(H.denials)} denials as{' '}
          {fmtPct(H.denials_as_pct_of_total_applications)} of {fmtInt(H.denial_pct_denominator_total_applications)} total
          applications (numerator {fmtInt(H.denial_pct_numerator_denial_observations)} denial observations ÷ denominator{' '}
          {fmtInt(H.denial_pct_denominator_total_applications)} total HMDA applications; not a decision-based denial rate
          and not lender quality). Purchase {fmtInt(H.purchase_applications)}, refinance{' '}
          {fmtInt(H.refinance_applications)}, other purpose {fmtInt(H.purpose_other_applications)}. Conventional{' '}
          {fmtInt(H.apps_conventional)}, FHA {fmtInt(H.apps_fha)}, VA {fmtInt(H.apps_va)}, USDA/other {fmtInt(H.apps_usda_other)}.
          Mix bars are application shares, not quality.
        </p>
        <div className="mt-3 space-y-1 text-xs text-slate-600" aria-hidden="true">
          {[
            ['Conventional', H.apps_conventional],
            ['FHA', H.apps_fha],
            ['VA', H.apps_va],
            ['USDA/other', H.apps_usda_other],
          ].map(([label, n]) => (
            <div key={String(label)} className="flex items-center gap-2">
              <span className="w-24 shrink-0">{label}</span>
              <span className="h-2 flex-1 rounded bg-slate-100">
                <span className="block h-2 rounded bg-[#047857]" style={{ width: `${Math.round((Number(n) / mixMax) * 100)}%` }} />
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="roster-heading">
        <h2 id="roster-heading" className="text-lg font-semibold text-[#0A2540]">
          Current Illinois mortgage-company licensing
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          No bulk current IDFPR mortgage-company roster was acquired. Search-only is not zero. Do not infer a company
          census from HMDA rows or from {fmtInt(s.fdic.institution_rows)} FDIC depositories.{' '}
          <Official href={s.regulators.url} label="IDFPR Residential Finance" />
        </p>
      </section>

      <section className="mt-10" aria-labelledby="cfpb-heading">
        <h2 id="cfpb-heading" className="text-lg font-semibold text-[#0A2540]">
          CFPB Illinois mortgage complaints
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Statewide bulk count is SOURCE_NOT_ACQUIRED / OPEN_SEARCH_ONLY. Missing is not zero. A complaint is not a
          violation.{' '}
          <Official href={s.cfpb.source_url} label="CFPB Consumer Complaint Database" />
        </p>
      </section>

      <section className="mt-10" aria-labelledby="limits-heading">
        <h2 id="limits-heading" className="text-lg font-semibold text-[#0A2540]">
          What these numbers do not mean
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>HMDA application ≠ lender. Property geography ≠ headquarters, license jurisdiction, or service territory.</li>
          <li>FDIC CERT ≠ IDFPR mortgage license. Depository ≠ mortgage banker.</li>
          <li>Search-only and missing evidence is not zero.</li>
          <li>No Trust Score, paid ranking, or best/safest/vetted conclusions.</li>
          <li>Existing /local-lenders/illinois catalog routes are a separate grain, not this statewide intelligence page.</li>
        </ul>
      </section>
    </div>
  );
}
