import Link from 'next/link';
import { WashingtonCountyTable } from '@/components/washington/county-table';
import { Trace } from '@/components/new-jersey/trace';
import {
  fmtInt,
  fmtPct,
  type WashingtonIntelligenceSnapshot,
} from '@/lib/washington-intelligence/snapshot';

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

function BarRow({ label, n, max }: { label: string; n: number; max: number }) {
  const pctBar = max > 0 ? Math.max(2, Math.round((n / max) * 100)) : 0;
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 break-words text-slate-800">{label}</span>
        <span className="shrink-0 tabular-nums text-slate-600">{fmtInt(n)}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden>
        <div className="h-full rounded-full bg-[#0D9488]" style={{ width: `${pctBar}%` }} />
      </div>
    </div>
  );
}

export function WashingtonStateIntelligenceUnavailable({ reason }: { reason: string }) {
  return (
    <div className="th-shell mx-auto w-full max-w-[880px] overflow-x-clip px-4 py-8 sm:py-10">
      <header className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#047857]">
          Independent research · Washington
        </p>
        <h1 className="mt-1 break-words text-2xl font-bold text-[#0A2540] sm:text-3xl">
          Washington Mortgage &amp; Lending Intelligence
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          The current published Washington intelligence snapshot is unavailable.
        </p>
        <p className="mt-2 text-sm text-slate-600">{reason}</p>
      </header>
    </div>
  );
}

export function WashingtonStateIntelligence({
  snapshot,
}: {
  snapshot: WashingtonIntelligenceSnapshot;
}) {
  const s = snapshot;
  const H = s.hmda;
  const O = s.dfi_enforcement;
  const mixMax = Math.max(H.apps_conventional, H.apps_fha, H.apps_va, H.apps_usda_other);
  const purposeMax = Math.max(H.purchase_applications, H.refinance_applications);
  const titleMax = Math.max(...O.native_type_top.map((row) => row.count), 1);
  const depth = [
    {
      family: 'HMDA',
      source: H.source,
      agency: 'CFPB / FFIEC HMDA',
      asOf: H.source_as_of,
      grain: H.geo_grain,
      rows: `${fmtInt(H.applications)} applications / ${fmtInt(H.county_count)} counties`,
      identity: 'HMDA LEI for reporters; county FIPS for geography',
      status: H.coverage_state,
      limitations: H.caveat,
    },
    {
      family: 'DFI license verification',
      source: 'NMLS Consumer Access / DFI Verify a Financial License',
      agency: 'Washington DFI / NMLS',
      asOf: 'Unknown / search-only',
      grain: 'not acquired as a bulk roster',
      rows: 'UNKNOWN / SOURCE_NOT_ACQUIRED',
      identity: 'NMLS ID when a live search returns one',
      status: s.live_roster.CURRENT_WASHINGTON_MORTGAGE_COMPANY_BULK_ROSTER,
      limitations: s.live_roster.caveat,
    },
    {
      family: 'DFI year-end aggregates',
      source: s.dfi_aggregates.url,
      agency: s.dfi_aggregates.agency,
      asOf: s.dfi_aggregates.as_of,
      grain: 'statewide dated report',
      rows: `${fmtInt(s.dfi_aggregates.mortgage_brokers)} mortgage brokers / ${fmtInt(s.dfi_aggregates.consumer_loan_companies)} consumer loan companies (year-end reported entities)`,
      identity: 'Report aggregate only; MLO people are not a company count',
      status: s.dfi_aggregates.coverage_state,
      limitations: s.dfi_aggregates.caveat,
    },
    {
      family: 'DFI enforcement',
      source: O.url,
      agency: O.agency,
      asOf: O.retrieved_at ?? 'Unknown',
      grain: O.grain,
      rows: `${fmtInt(O.order_rows)} table rows / ${fmtInt(O.exact_nmls_rows)} exact NMLS`,
      identity: 'Exact NMLS when source-native; name-only is UNSAFE_FOR_ADVERSE_PROFILE_ATTACH',
      status: O.coverage_state,
      limitations: O.caveat,
    },
    {
      family: 'CFPB complaints',
      source: s.cfpb.source_url,
      agency: 'Consumer Financial Protection Bureau',
      asOf: s.cfpb.retrieved_at ?? 'Unknown',
      grain: 'mortgage product, state = WA',
      rows: s.cfpb.mortgage_complaint_rows == null ? 'Unknown' : fmtInt(s.cfpb.mortgage_complaint_rows),
      identity: 'Statewide overlay; not a company ranking',
      status: s.cfpb.coverage_state,
      limitations: s.cfpb.caveat,
    },
    {
      family: 'WSHFC programs',
      source: 'Official WSHFC / Here to Home program pages',
      agency: 'Washington State Housing Finance Commission',
      asOf: s.source_as_of.programs,
      grain: 'program',
      rows: String(s.programs.items.length),
      identity: 'Official program name',
      status: 'ACQUIRED_CURRENT_SNAPSHOT',
      limitations: s.programs.caveat,
    },
    {
      family: 'Depository overlay',
      source: s.depository.source,
      agency: 'FDIC (existing national overlay)',
      asOf: 'Existing committed FDIC Washington file',
      grain: 'FDIC CERT',
      rows: fmtInt(s.depository.fdic_cert_rows),
      identity: s.depository.identity,
      status: s.depository.coverage_state,
      limitations: s.depository.caveat,
    },
    {
      family: 'Foreclosure / servicing source',
      source: 'No dedicated statewide structured file',
      agency: 'n/a',
      asOf: 'Unknown',
      grain: 'not acquired',
      rows: 'Unknown / not acquired',
      identity: 'none',
      status: 'STATEWIDE_STRUCTURED_FORECLOSURE_SOURCE_NOT_ACQUIRED',
      limitations: s.foreclosure.note,
    },
  ];

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
          <li className="text-slate-800">Washington research</li>
        </ol>
      </nav>

      <header className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#047857]">
          Independent research · Washington
        </p>
        <h1 className="mt-1 break-words text-2xl font-bold text-[#0A2540] sm:text-3xl">
          Washington Mortgage &amp; Lending Intelligence
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          A source-backed view of Washington mortgage-market activity, DFI Consumer Services
          enforcement with exact NMLS identity, and current WSHFC homebuyer programs. This is not a
          ranking, recommendation, or Trust Score. There is no current live Washington
          mortgage-company roster in this snapshot.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Local catalog pages remain at{' '}
          <Link href="/local-lenders/washington" className="text-[#047857] underline underline-offset-2">
            /local-lenders/washington
          </Link>
          . Those pages are not this official-source intelligence snapshot. No Washington county or
          city routes are published from this page.
        </p>
      </header>

      <section aria-labelledby="hero-metrics" className="mt-8">
        <h2 id="hero-metrics" className="sr-only">
          Snapshot metrics
        </h2>
        <div className="grid gap-3 sm:grid-cols-5">
          <Metric
            value={fmtInt(s.hero.universe_value)}
            label={`Universe · ${s.hero.universe_label}`}
            hint={s.hero.universe_hint}
          />
          <Metric
            value={fmtInt(s.hero.current_value)}
            label={`Current · ${s.hero.current_label}`}
            hint="2025 HMDA originations, property location Washington."
          />
          <Metric
            value={fmtInt(s.hero.observations_value)}
            label={`Observations · ${s.hero.observations_label}`}
            hint="Bounded DFI HTML table rows. Order count is not quality. Not the 2025 year-end 91-action statistic."
          />
          <Metric
            value={fmtInt(s.hero.geography_value)}
            label={`Geography · ${s.hero.geography_label}`}
            hint="All 39 Washington counties in this HMDA extract. County is property location, not a ranking."
          />
          <Metric
            value={String(s.hero.as_of_value)}
            label={`As-of · ${s.hero.as_of_label}`}
            hint="HMDA reporting vintage. DFI year-end aggregates are 2025-12-31."
          />
        </div>
      </section>

      <section aria-labelledby="findings-heading" className="mt-10">
        <h2 id="findings-heading" className="text-lg font-semibold text-[#0A2540]">
          Market findings
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
          <li>
            2025 HMDA recorded {fmtInt(H.applications)} applications, {fmtInt(H.originations)}{' '}
            originations, and {fmtInt(H.denials)} denials for properties located in Washington (
            {fmtPct(H.denial_rate_pct)} denial rate). That is not a license count.
          </li>
          <li>
            Purchase applications are {fmtPct(H.purchase_pct_of_apps)} of the file and refinance
            applications are {fmtPct(H.refinance_pct_of_apps)}. Conventional applications are{' '}
            {fmtPct(H.conventional_pct)}. Denial-reason fields are not in this extract.
          </li>
          <li>
            All {fmtInt(H.county_count)} Washington counties are in this HMDA geography, sorted
            alphabetically on this page. No Washington county or city routes are published.
          </li>
          <li>
            DFI Consumer Services published a bounded HTML table of {fmtInt(O.order_rows)} recent
            enforcement rows. {fmtInt(O.exact_nmls_rows)} carry an exact NMLS ID (
            {fmtInt(O.distinct_exact_nmls)} distinct NMLS values). {fmtInt(O.name_only_rows)} are
            name-only and stay at event grain — UNSAFE_FOR_ADVERSE_PROFILE_ATTACH. Order count is
            not quality.
          </li>
          <li>
            DFI year-end reported entities as of 2025-12-31 include {fmtInt(s.dfi_aggregates.mortgage_brokers)}{' '}
            mortgage brokers and {fmtInt(s.dfi_aggregates.consumer_loan_companies)} consumer loan
            companies. Those are not current live licensed-lender totals. Active MLOs (
            {fmtInt(s.dfi_aggregates.loan_originators_active)}) are people, not companies, and are
            not a public person directory.
          </li>
          <li>
            CFPB recorded {fmtInt(s.cfpb.mortgage_complaint_rows)} Washington mortgage complaint
            rows. A complaint is not a violation and is not a company ranking.
          </li>
        </ul>
      </section>

      <section aria-labelledby="hmda-heading" className="mt-10">
        <h2 id="hmda-heading" className="text-lg font-semibold text-[#0A2540]">
          2025 Washington mortgage market
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{H.caveat}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Metric value={fmtInt(H.applications)} label="Applications" hint="HMDA 2025, properties in Washington." />
          <Metric value={fmtInt(H.originations)} label="Originations" />
          <Metric value={fmtInt(H.denials)} label="Denials" />
          <Metric
            value={fmtPct(H.denial_rate_pct)}
            label="Denial rate"
            hint="Denials ÷ applications in this extract. Not quality and not a discrimination finding."
          />
        </div>
        <Trace
          source={H.source}
          sourceDate={H.source_as_of}
          denominator={`${fmtInt(H.applications)} applications`}
          calculation={H.denial_rate_calculation}
          grain={`State overlay from ${fmtInt(H.county_count)} county rows`}
          coverage={H.coverage_state}
          caveat={H.caveat}
        />
        <h3 className="mt-6 text-base font-semibold text-[#0A2540]">
          Applications compared with originations and denials
        </h3>
        <div className="mt-3 space-y-3">
          <BarRow label="Applications" n={H.applications} max={H.applications} />
          <BarRow label="Originations" n={H.originations} max={H.applications} />
          <BarRow label="Denials" n={H.denials} max={H.applications} />
        </div>
        <h3 className="mt-6 text-base font-semibold text-[#0A2540]">Loan purpose (applications)</h3>
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
        <p className="mt-3 text-sm text-slate-600">{H.denial_reasons_coverage}</p>
      </section>

      <section aria-labelledby="county-heading" className="mt-10">
        <h2 id="county-heading" className="text-lg font-semibold text-[#0A2540]">
          County market table
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Counties present in the committed Washington HMDA geography, sorted alphabetically. No
          Washington county routes are published from this page. Denial rate is not a county ranking.
        </p>
        <WashingtonCountyTable counties={H.counties} />
      </section>

      <section aria-labelledby="regulate-heading" className="mt-10">
        <h2 id="regulate-heading" className="text-lg font-semibold text-[#0A2540]">
          Who regulates Washington mortgage companies?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Washington DFI Division of Consumer Services licenses Mortgage Brokers, Consumer Loan
          Companies, and Mortgage Loan Originators. Escrow agents are a separate DFI class.
          Depository banks and credit unions are chartered separately. CMS-style federal HMDA filing
          is not a DFI license. An NMLS ID is not current Washington authority by itself.
        </p>
      </section>

      <section aria-labelledby="verify-heading" className="mt-10">
        <h2 id="verify-heading" className="text-lg font-semibold text-[#0A2540]">
          How to verify a company or MLO
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Mortgage brokers, consumer loan companies, and MLOs verify through NMLS Consumer Access.
          Escrow and some other DFI classes may use the DFI Licensee Database. Neither search was
          scraped. This page is not an NMLS shadow directory.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>
            <a href="https://www.nmlsconsumeraccess.org/" className="text-[#047857] underline underline-offset-2">
              NMLS Consumer Access
            </a>
          </li>
          <li>
            <a href="https://dfi.wa.gov/consumers/verify-license" className="text-[#047857] underline underline-offset-2">
              DFI Verify a Financial License
            </a>
          </li>
        </ul>
      </section>

      <section aria-labelledby="dfi-heading" className="mt-10">
        <h2 id="dfi-heading" className="text-lg font-semibold text-[#0A2540]">
          DFI Consumer Services enforcement
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{O.caveat}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Metric value={fmtInt(O.order_rows)} label="Table rows" hint="Not a quality score. Not the 2025 year-end 91-action statistic." />
          <Metric
            value={fmtInt(O.exact_nmls_rows)}
            label="Rows with exact NMLS"
            hint={`${fmtInt(O.distinct_exact_nmls)} distinct NMLS values. Table does not type institution vs person.`}
          />
          <Metric
            value={fmtInt(O.name_only_rows)}
            label="Name-only rows"
            hint="UNSAFE_FOR_ADVERSE_PROFILE_ATTACH. Stay at event grain."
          />
          <Metric
            value={fmtInt(O.native_type_distinct)}
            label="Native Type of Order classes"
            hint="Source-native titles are not collapsed. Notice is not a final order."
          />
        </div>
        <Trace
          source={O.url}
          sourceDate={O.retrieved_at ?? 'Unknown'}
          denominator={`${fmtInt(O.order_rows)} DFI HTML table rows`}
          calculation="Paged official HTML table. Exact NMLS = NMLS # with 3–12 nonzero digits in the respondent cell."
          grain={O.grain}
          coverage={O.coverage_state}
          caveat={O.caveat}
        />
        <p className="mt-3 text-sm text-slate-600">
          Row class heuristic (not a DFI native person/company flag): company {fmtInt(O.company_rows)};
          person {fmtInt(O.person_rows)}; mixed {fmtInt(O.mixed_company_person_rows)}; unresolved{' '}
          {fmtInt(O.unresolved_class_rows)}. Person rows are not published as a directory.
        </p>
        <h3 className="mt-6 text-base font-semibold text-[#0A2540]">
          Native Type of Order (not collapsed)
        </h3>
        <div className="mt-3 space-y-3">
          {O.native_type_top.slice(0, 12).map((row) => (
            <BarRow key={row.key} label={row.key} n={row.count} max={titleMax} />
          ))}
        </div>
      </section>

      <section aria-labelledby="report-heading" className="mt-10">
        <h2 id="report-heading" className="text-lg font-semibold text-[#0A2540]">
          DFI year-end reported entities
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.dfi_aggregates.caveat}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Metric
            value={fmtInt(s.dfi_aggregates.mortgage_brokers)}
            label="Mortgage Brokers"
            hint="As of 2025-12-31. Not a live roster."
          />
          <Metric
            value={fmtInt(s.dfi_aggregates.consumer_loan_companies)}
            label="Consumer Loan Companies"
            hint="As of 2025-12-31. Not a live roster."
          />
          <Metric
            value={fmtInt(s.dfi_aggregates.loan_originators_active)}
            label="Loan Originators — Active"
            hint="People, not companies. Not a public person directory."
          />
          <Metric
            value={fmtInt(s.dfi_aggregates.escrow_agents)}
            label="Escrow Agents"
            hint="Separate DFI class. Not added to brokers + consumer loan companies."
          />
          <Metric
            value={fmtInt(s.dfi_aggregates.enforcement_actions_issued_2025)}
            label="Enforcement actions issued (2025 year-end)"
            hint="Dated DFI statistic. Not this page's HTML table row count."
          />
          <Metric
            value={fmtInt(s.dfi_aggregates.money_transmitters)}
            label="Money Transmitters"
            hint="Adjacent DFI class. Not a mortgage-company total."
          />
        </div>
        <Trace
          source={s.dfi_aggregates.url}
          sourceDate={s.dfi_aggregates.as_of ?? 'Unknown'}
          denominator="DFI year-end reported entities"
          calculation="Official Stats at a Glance table as of December 31, 2025."
          grain="annual dated aggregate"
          coverage={s.dfi_aggregates.coverage_state ?? 'ACQUIRED_DATED_SNAPSHOT'}
          caveat={s.dfi_aggregates.caveat ?? ''}
        />
      </section>

      <section aria-labelledby="roster-heading" className="mt-10">
        <h2 id="roster-heading" className="text-lg font-semibold text-[#0A2540]">
          Current Washington mortgage-company roster
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.live_roster.caveat}</p>
        <Metric
          value="SOURCE_NOT_ACQUIRED / OPEN_SEARCH_ONLY"
          label="WASHINGTON_LIVE_COMPANY_ROSTER"
          hint="Live licensed-company denominator is UNKNOWN. Missing is not zero. Search-only is not zero."
        />
      </section>

      <section aria-labelledby="programs-heading" className="mt-10">
        <h2 id="programs-heading" className="text-lg font-semibold text-[#0A2540]">
          Washington homebuyer assistance
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.programs.application_path}</p>
        <div className="mt-4 space-y-4">
          {s.programs.items.map((p) => (
            <article key={p.name} className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-base font-semibold text-[#0A2540]">{p.name}</h3>
              <p className="mt-1 text-sm text-slate-600">
                {p.agency} · {p.assistance}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                <li>Headline amount / formula: {p.maximum}</li>
                <li>Eligibility: {p.eligibility}</li>
                <li>Income / purchase limits: {p.income_purchase_limits}</li>
                <li>Approved-lender requirement: {p.participating_lender_required ? 'Yes' : 'No'}</li>
                <li>Status: {p.status}</li>
                <li>Source date: {p.source_date}</li>
              </ul>
              <p className="mt-2 text-xs">
                <a href={p.source_url} className="text-[#047857] underline underline-offset-2">
                  Official source
                </a>
              </p>
            </article>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-600">{s.programs.caveat}</p>
      </section>

      <section aria-labelledby="matrix-heading" className="mt-10">
        <h2 id="matrix-heading" className="text-lg font-semibold text-[#0A2540]">
          Regulator / credential matrix
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          An HMDA reporter is not a Washington licensee. An NMLS ID is not proof of current
          Washington authority by itself. Program participation is not an endorsement. An MLO person
          is not a lender company.
        </p>
        <div className="mt-4 min-w-0 overflow-x-auto">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <caption className="sr-only">What each Washington mortgage credential proves and does not prove.</caption>
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th scope="col" className="py-2 pr-3">
                  Credential
                </th>
                <th scope="col" className="py-2 pr-3">
                  What it is
                </th>
                <th scope="col" className="py-2 pr-3">
                  Regulator
                </th>
                <th scope="col" className="py-2 pr-3">
                  What it proves
                </th>
                <th scope="col" className="py-2">
                  What it does not prove
                </th>
              </tr>
            </thead>
            <tbody>
              {s.regulator_matrix.map((row) => (
                <tr key={row.credential} className="border-b border-slate-100 align-top">
                  <th scope="row" className="py-2 pr-3 font-medium text-slate-800">
                    {row.credential}
                  </th>
                  <td className="py-2 pr-3">{row.what}</td>
                  <td className="py-2 pr-3">{row.regulator}</td>
                  <td className="py-2 pr-3">{row.proves}</td>
                  <td className="py-2">{row.does_not_prove}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="cfpb-heading" className="mt-10">
        <h2 id="cfpb-heading" className="text-lg font-semibold text-[#0A2540]">
          CFPB Washington mortgage complaints
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.cfpb.caveat}</p>
        <Metric
          value={fmtInt(s.cfpb.mortgage_complaint_rows)}
          label="Mortgage complaint rows with state = WA"
          hint="Official CFPB API overlay. Not a complaint index."
        />
        <Trace
          source={s.cfpb.source_url}
          sourceDate={s.cfpb.retrieved_at ?? 'Unknown'}
          denominator="CFPB mortgage product rows with state WA"
          calculation="hits.total from the public CFPB complaint search API"
          grain="statewide product overlay"
          coverage={s.cfpb.coverage_state}
          caveat={s.cfpb.caveat}
        />
        {s.cfpb.top_issues?.length ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {s.cfpb.top_issues.map((row) => (
              <li key={row.key}>
                {row.key}: {fmtInt(row.count)}
              </li>
            ))}
          </ul>
        ) : null}
        {s.cfpb.year_trend?.length ? (
          <div className="mt-4">
            <h3 className="text-base font-semibold text-[#0A2540]">Year trend (recent calendar years)</h3>
            <p className="mt-1 text-xs text-slate-500">
              Recent-year slices do not sum to the all-time Washington mortgage total. Older years
              remain in the all-time overlay.
            </p>
            <div className="mt-3 space-y-3">
              {s.cfpb.year_trend.map((row) => (
                <BarRow
                  key={row.year}
                  label={String(row.year)}
                  n={row.count}
                  max={Math.max(...s.cfpb.year_trend.map((y) => y.count))}
                />
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="reporters-heading" className="mt-10">
        <h2 id="reporters-heading" className="text-lg font-semibold text-[#0A2540]">
          HMDA application volume (not a license ranking)
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Largest by HMDA application volume in this Washington property-location dataset. HMDA
          reporter is not a Washington licensee. NMLS is shown only when already mapped in the
          committed exact LEI-to-NMLS file. LEI, NMLS, FDIC CERT, and RSSD stay separate.
        </p>
        <div className="mt-4 min-w-0 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th scope="col" className="py-2 pr-3">
                  HMDA reporter
                </th>
                <th scope="col" className="py-2 pr-3 text-right">
                  Applications
                </th>
                <th scope="col" className="py-2 text-right">
                  Originations
                </th>
              </tr>
            </thead>
            <tbody>
              {H.top_reporters_by_applications.map((row) => (
                <tr key={row.lei} className="border-b border-slate-100">
                  <th scope="row" className="py-2 pr-3 font-medium text-slate-800">
                    {row.institution_name ?? `HMDA reporter (LEI ${row.lei.slice(0, 8)}…)`}
                    <span className="block text-xs font-normal text-slate-500">{row.identity}</span>
                  </th>
                  <td className="py-2 pr-3 text-right tabular-nums">{fmtInt(row.applications)}</td>
                  <td className="py-2 text-right tabular-nums">{fmtInt(row.originations)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="contacts-heading" className="mt-10">
        <h2 id="contacts-heading" className="text-lg font-semibold text-[#0A2540]">
          Public business contacts
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.public_contacts.caveat}</p>
        <p className="mt-2 text-sm text-slate-600">{s.public_contacts.dfi_orders_contact_note}</p>
        <p className="mt-2 text-sm text-slate-600">{s.public_contacts.policy}</p>
      </section>

      <section aria-labelledby="depth-heading" className="mt-10">
        <h2 id="depth-heading" className="text-lg font-semibold text-[#0A2540]">
          Evidence depth
        </h2>
        <div className="mt-4 min-w-0 overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th scope="col" className="py-2 pr-3">
                  Family
                </th>
                <th scope="col" className="py-2 pr-3">
                  Agency
                </th>
                <th scope="col" className="py-2 pr-3">
                  As of
                </th>
                <th scope="col" className="py-2 pr-3">
                  Grain
                </th>
                <th scope="col" className="py-2 pr-3">
                  Count
                </th>
                <th scope="col" className="py-2 pr-3">
                  Identity
                </th>
                <th scope="col" className="py-2">
                  Limitation
                </th>
              </tr>
            </thead>
            <tbody>
              {depth.map((row) => (
                <tr key={row.family} className="border-b border-slate-100 align-top">
                  <th scope="row" className="py-2 pr-3 font-medium text-slate-800">
                    {row.family}
                  </th>
                  <td className="py-2 pr-3">{row.agency}</td>
                  <td className="py-2 pr-3">{row.asOf}</td>
                  <td className="py-2 pr-3">{row.grain}</td>
                  <td className="py-2 pr-3">{row.rows}</td>
                  <td className="py-2 pr-3">{row.identity}</td>
                  <td className="py-2">{row.limitations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
