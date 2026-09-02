import Link from 'next/link';
import { NewJerseyCountyTable } from '@/components/new-jersey/county-table';
import { NewJerseyHmfaLenderList } from '@/components/new-jersey/lender-list';
import { Trace } from '@/components/new-jersey/trace';
import {
  fmtInt,
  fmtPct,
  fmtUsd,
  type NewJerseyIntelligenceSnapshot,
} from '@/lib/new-jersey-intelligence/snapshot';

function Metric({
  value,
  label,
  hint,
}: {
  value: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="break-words text-2xl font-bold tabular-nums text-[#0A2540]">{value}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{label}</p>
      {hint ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{hint}</p> : null}
    </div>
  );
}

function BarRow({ label, n, max, caption }: { label: string; n: number; max: number; caption?: string }) {
  const pct = max > 0 ? Math.max(2, Math.round((n / max) * 100)) : 0;
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 break-words text-slate-800">{label}</span>
        <span className="shrink-0 tabular-nums text-slate-600">{fmtInt(n)}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden>
        <div className="h-full rounded-full bg-[#0D9488]" style={{ width: `${pct}%` }} />
      </div>
      {caption ? <p className="mt-1 text-xs text-slate-500">{caption}</p> : null}
    </div>
  );
}

export function NewJerseyStateIntelligenceUnavailable({ reason }: { reason: string }) {
  return (
    <div className="th-shell mx-auto w-full max-w-[880px] overflow-x-clip px-4 py-8 sm:py-10">
      <header className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#047857]">Independent research · New Jersey</p>
        <h1 className="mt-1 break-words text-2xl font-bold text-[#0A2540] sm:text-3xl">
          New Jersey Mortgage &amp; Lending Intelligence
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          The current published New Jersey intelligence snapshot is unavailable. This page does not substitute live
          database queries or stale hardcoded constants.
        </p>
        <p className="mt-2 text-sm text-slate-600">{reason}</p>
      </header>
    </div>
  );
}

export function NewJerseyStateIntelligence({ snapshot }: { snapshot: NewJerseyIntelligenceSnapshot }) {
  const s = snapshot;
  const H = s.hmda;
  const mixMax = Math.max(H.apps_conventional, H.apps_fha, H.apps_va, H.apps_usda_other);
  const purposeMax = Math.max(H.purchase_applications, H.refinance_applications);
  const ocfMissing = Object.entries(s.dobi.ocf_years)
    .filter(([, v]) => v === 'SOURCE_NOT_ACQUIRED')
    .map(([y]) => y);

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
          <li className="text-slate-800">New Jersey research</li>
        </ol>
      </nav>

      <header className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#047857]">Independent research · New Jersey</p>
        <h1 className="mt-1 break-words text-2xl font-bold text-[#0A2540] sm:text-3xl">
          New Jersey Mortgage &amp; Lending Intelligence
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          A source-backed view of New Jersey mortgage-market activity, NJHMFA homeownership programs, and NJDOBI
          regulatory evidence. This is not a ranking, recommendation, or Trust Score.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Local catalog pages remain at{' '}
          <Link href="/local-lenders/new-jersey" className="text-[#047857] underline underline-offset-2">
            /local-lenders/new-jersey
          </Link>
          . Those pages are not this official-source intelligence snapshot.
        </p>
      </header>

      <section aria-labelledby="hero-metrics" className="mt-8">
        <h2 id="hero-metrics" className="sr-only">
          Snapshot metrics
        </h2>
        <div className="grid gap-3 sm:grid-cols-5">
          <Metric value={fmtInt(s.hero.universe_value)} label={`Universe · ${s.hero.universe_label}`} hint={s.hero.universe_hint} />
          <Metric value={fmtInt(s.hero.current_value)} label={`Current · ${s.hero.current_label}`} hint="2025 HMDA originations, property location New Jersey." />
          <Metric value={fmtInt(s.hero.observations_value)} label={`Observations · ${s.hero.observations_label}`} hint="Acquired NJDOBI unique order numbers. Not every action ever issued." />
          <Metric value={fmtInt(s.hero.geography_value)} label={`Geography · ${s.hero.geography_label}`} hint="All 21 New Jersey counties in the HMDA slice." />
          <Metric value={String(s.hero.as_of_value)} label={`As-of · ${s.hero.as_of_label}`} hint="HMDA reporting vintage. NJHMFA lender list is dated 2026-04-01." />
        </div>
      </section>

      <section aria-labelledby="findings-heading" className="mt-10">
        <h2 id="findings-heading" className="text-lg font-semibold text-[#0A2540]">
          Market findings
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
          <li>
            2025 HMDA recorded {fmtInt(H.applications)} applications, {fmtInt(H.originations)} originations, and{' '}
            {fmtInt(H.denials)} denials for properties located in New Jersey ({fmtPct(H.denial_rate_pct)} denial rate).
          </li>
          <li>All 21 New Jersey counties are represented in this HMDA projection.</li>
          <li>
            NJHMFA Down Payment Assistance amounts vary by county of the property: eligible borrowers may qualify for
            up to {fmtUsd(15000)} or {fmtUsd(10000)} depending on the county group, plus a first-generation supplement
            where eligible.
          </li>
          <li>
            The acquired NJDOBI corpus includes {fmtInt(s.dobi.index_occurrences)} enforcement index occurrences,{' '}
            {fmtInt(s.dobi.unique_orders)} unique orders, and {fmtInt(s.dobi.unique_documents)} unique documents.
          </li>
          <li>
            NJHMFA published {s.njhmfa.bulletins.count} lender policy bulletins in 2026. Latest on the official index:{' '}
            {s.njhmfa.bulletins.latest}. Policy bulletins are not adverse evidence against lenders.
          </li>
        </ul>
      </section>

      <section aria-labelledby="hmda-heading" className="mt-10">
        <h2 id="hmda-heading" className="text-lg font-semibold text-[#0A2540]">
          2025 New Jersey mortgage market
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{H.caveat}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Metric value={fmtInt(H.applications)} label="Applications" hint="HMDA 2025, properties in New Jersey." />
          <Metric value={fmtInt(H.originations)} label="Originations" />
          <Metric value={fmtInt(H.denials)} label="Denials" />
          <Metric value={fmtPct(H.denial_rate_pct)} label="Denial rate" hint="Denials ÷ applications in this extract." />
        </div>
        <Trace
          source={H.source}
          sourceDate={H.source_as_of}
          denominator={`${fmtInt(H.applications)} applications`}
          calculation={H.denial_rate_calculation}
          grain="State overlay from 21 county rows"
          coverage={H.coverage_state}
          caveat={H.caveat}
        />

        <h3 className="mt-6 text-base font-semibold text-[#0A2540]">Applications compared with originations and denials</h3>
        <div className="mt-3 space-y-3" role="img" aria-label="HMDA applications, originations, and denials">
          <BarRow label="Applications" n={H.applications} max={H.applications} />
          <BarRow label="Originations" n={H.originations} max={H.applications} />
          <BarRow label="Denials" n={H.denials} max={H.applications} />
        </div>

        <h3 className="mt-6 text-base font-semibold text-[#0A2540]">Loan purpose (applications)</h3>
        <p className="mt-1 text-sm text-slate-600">
          Purchase {fmtPct(H.purchase_pct_of_apps)} and refinance {fmtPct(H.refinance_pct_of_apps)} of applications.
          These are application-purpose counts, not originations.
        </p>
        <div className="mt-3 space-y-3">
          <BarRow label="Purchase applications" n={H.purchase_applications} max={purposeMax} />
          <BarRow label="Refinance applications" n={H.refinance_applications} max={purposeMax} />
        </div>

        <h3 className="mt-6 text-base font-semibold text-[#0A2540]">Loan type (applications)</h3>
        <div className="mt-3 space-y-3">
          <BarRow label={`Conventional (${fmtPct(H.conventional_pct)})`} n={H.apps_conventional} max={mixMax} />
          <BarRow label={`FHA (${fmtPct(H.fha_pct)})`} n={H.apps_fha} max={mixMax} />
          <BarRow label={`VA (${fmtPct(H.va_pct)})`} n={H.apps_va} max={mixMax} />
          <BarRow label={`USDA / other (${fmtPct(H.usda_other_pct)})`} n={H.apps_usda_other} max={mixMax} />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Median loan amount, interest-rate coverage, and denial reasons are omitted because they are not in the
          committed 2025 NJ summary extract.
        </p>
      </section>

      <section aria-labelledby="counties-heading" className="mt-10">
        <h2 id="counties-heading" className="text-lg font-semibold text-[#0A2540]">
          21-county HMDA intelligence
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          County rows use the same 2025 HMDA extract. This page does not create county routes. High or low denial rates
          are not best or worst counties.
        </p>
        <NewJerseyCountyTable counties={H.counties} />
      </section>

      <section aria-labelledby="programs-heading" className="mt-10">
        <h2 id="programs-heading" className="text-lg font-semibold text-[#0A2540]">
          NJHMFA homeownership programs
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Official current program families. This is not an eligibility calculator. County of purchase does not by
          itself qualify a borrower.
        </p>
        <div className="mt-4 space-y-3">
          {s.njhmfa.programs.map((p) => (
            <article key={p.program_key} className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-base font-semibold text-[#0A2540]">{p.official_name}</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                <li>Type: {p.program_class.replace(/_/g, ' ')}</li>
                {p.loan_type_raw ? <li>Loan type: {p.loan_type_raw}</li> : null}
                {p.first_time_buyer_requirement ? <li>First-time buyer: {p.first_time_buyer_requirement}</li> : null}
                <li>DPA relationship: {p.dpa_available ? 'May be paired where the program allows' : 'Not DPA-eligible on this product'}</li>
                <li>Source effective: {p.source_effective_on}</li>
              </ul>
              <p className="mt-2 text-sm">
                <a href={p.source_url} className="text-[#047857] underline underline-offset-2" rel="noopener noreferrer">
                  Official NJHMFA program page
                </a>
              </p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="dpa-heading" className="mt-10">
        <h2 id="dpa-heading" className="text-lg font-semibold text-[#0A2540]">
          Down payment assistance geography
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.njhmfa.dpa.caveat}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-base font-semibold text-[#0A2540]">
              {s.njhmfa.dpa.high.counties.length} counties — up to {fmtUsd(s.njhmfa.dpa.high.combined)}
            </h3>
            <p className="mt-2 text-sm text-slate-700">{s.njhmfa.dpa.high.copy}</p>
            <p className="mt-2 text-sm text-slate-600">{s.njhmfa.dpa.high.counties.join(', ')}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-base font-semibold text-[#0A2540]">
              {s.njhmfa.dpa.standard.counties.length} counties — up to {fmtUsd(s.njhmfa.dpa.standard.combined)}
            </h3>
            <p className="mt-2 text-sm text-slate-700">{s.njhmfa.dpa.standard.copy}</p>
            <p className="mt-2 text-sm text-slate-600">{s.njhmfa.dpa.standard.counties.join(', ')}</p>
          </div>
        </div>
        <Trace
          source={s.njhmfa.dpa.source}
          sourceDate={s.njhmfa.dpa.source_effective_on}
          denominator="County of the property being purchased, not the borrower's residence county alone"
          calculation="Official county-group amounts; 'up to' and eligibility-conditioned"
          grain="21 counties in two groups"
          coverage="ACQUIRED_CURRENT_SNAPSHOT"
          caveat={s.njhmfa.dpa.caveat}
        />
      </section>

      <section aria-labelledby="hmfa-lenders-heading" className="mt-10">
        <h2 id="hmfa-lenders-heading" className="text-lg font-semibold text-[#0A2540]">
          NJHMFA participating-lender activity list
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {s.njhmfa.participating_lenders.consumer_safe_label}: {fmtInt(s.njhmfa.participating_lenders.count)} distinct
          names. {s.njhmfa.participating_lenders.grain}
        </p>
        <p className="mt-2 text-sm text-slate-600">{s.njhmfa.participating_lenders.caveat}</p>
        <NewJerseyHmfaLenderList names={s.njhmfa.participating_lenders.names} />
      </section>

      <section aria-labelledby="dobi-heading" className="mt-10">
        <h2 id="dobi-heading" className="text-lg font-semibold text-[#0A2540]">
          NJDOBI regulatory evidence
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.dobi.caveat}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Metric value={fmtInt(s.dobi.index_occurrences)} label="Index occurrences" />
          <Metric value={fmtInt(s.dobi.unique_orders)} label="Unique orders" />
          <Metric value={fmtInt(s.dobi.unique_documents)} label="Unique documents" />
          <Metric value={fmtInt(s.dobi.multi_party_orders)} label="Multi-party orders" />
        </div>
        <h3 className="mt-6 text-base font-semibold text-[#0A2540]">Action type mix in the acquired corpus</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {Object.entries(s.dobi.action_mix).map(([k, n]) => (
            <li key={k}>
              {k.replace(/_/g, ' ')}: {fmtInt(n)}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-slate-600">
          OCF year pages 2023–2026 are {ocfMissing.join(', ') || 'listed as'} SOURCE_NOT_ACQUIRED. That is not a finding
          of zero actions in those years.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Exact identity coverage in the acquired corpus: {fmtInt(s.dobi.identity.exact_nmls_institution)} NMLS
          companies, {fmtInt(s.dobi.identity.exact_fdic)} FDIC, {fmtInt(s.dobi.identity.exact_state_reference)} NJ state
          references. {fmtInt(s.dobi.identity.unresolved)} unresolved respondents are not attached to public company
          profiles. {fmtInt(s.dobi.respondents.individuals_held_internal)} individuals remain internal-only.
        </p>
      </section>

      <section aria-labelledby="fi-heading" className="mt-10">
        <h2 id="fi-heading" className="text-lg font-semibold text-[#0A2540]">
          New Jersey financial-institution landscape
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.financial_institutions.caveat}</p>
        <p className="mt-2 text-sm text-slate-700">
          Official current list: {fmtInt(s.financial_institutions.source_rows)} institutions as of{' '}
          {s.financial_institutions.source_as_of}.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>State-chartered banks and savings institutions: {fmtInt(s.financial_institutions.state_chartered_banks_and_savings)}</li>
          <li>State-chartered credit unions: {fmtInt(s.financial_institutions.state_chartered_credit_unions)}</li>
          <li>Federal charters listed by NJDOBI: {fmtInt(s.financial_institutions.federal_charters)}</li>
          <li>Out-of-state banks: {fmtInt(s.financial_institutions.classes.OUT_OF_STATE_BANK)}</li>
          <li>Out-of-state thrifts: {fmtInt(s.financial_institutions.classes.OUT_OF_STATE_THRIFT)}</li>
          <li>Limited-purpose trust companies: {fmtInt(s.financial_institutions.classes.LIMITED_PURPOSE_TRUST)}</li>
        </ul>
      </section>

      <section aria-labelledby="servicer-heading" className="mt-10">
        <h2 id="servicer-heading" className="text-lg font-semibold text-[#0A2540]">
          Mortgage servicer regulatory context
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.servicer.copy}</p>
        <p className="mt-2 text-sm text-slate-600">{s.servicer.caveat}</p>
      </section>

      <section aria-labelledby="updates-heading" className="mt-10">
        <h2 id="updates-heading" className="text-lg font-semibold text-[#0A2540]">
          What changed
        </h2>
        <p className="mt-2 text-sm text-slate-600">{s.njhmfa.bulletins.caveat}</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>NJHMFA income and purchase-price limits effective 2026-06-17 (Bulletin 2026-9).</li>
          {s.njhmfa.bulletins.highlights.map((b) => (
            <li key={b.number}>
              Lender Bulletin {b.number}: {b.title}{' '}
              <a href={b.url} className="text-[#047857] underline underline-offset-2" rel="noopener noreferrer">
                official notice
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="coverage-heading" className="mt-10">
        <h2 id="coverage-heading" className="text-lg font-semibold text-[#0A2540]">
          Evidence depth
        </h2>
        <div className="mt-4 min-w-0 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3">Source family</th>
                <th className="py-2 pr-3">Coverage</th>
                <th className="py-2 pr-3">As-of</th>
                <th className="py-2">Grain</th>
              </tr>
            </thead>
            <tbody>
              {s.coverage.map((c) => (
                <tr key={c.family} className="border-b border-slate-100">
                  <td className="py-2 pr-3">{c.family}</td>
                  <td className="py-2 pr-3">{c.coverage}</td>
                  <td className="py-2 pr-3">{c.as_of || '—'}</td>
                  <td className="py-2">{c.grain}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="gaps-heading" className="mt-10">
        <h2 id="gaps-heading" className="text-lg font-semibold text-[#0A2540]">
          What we don&apos;t yet know
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Unavailable evidence is unknown, not zero. These gaps do not block this page; they block only the affected
          metrics.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {s.gaps.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
