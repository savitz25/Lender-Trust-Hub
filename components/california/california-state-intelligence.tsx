import Link from 'next/link';
import { CaliforniaCountyTable } from '@/components/california/county-table';
import { Trace } from '@/components/new-jersey/trace';
import {
  fmtInt,
  fmtPct,
  type CaliforniaIntelligenceSnapshot,
} from '@/lib/california-intelligence/snapshot';

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

export function CaliforniaStateIntelligenceUnavailable({ reason }: { reason: string }) {
  return (
    <div className="th-shell mx-auto w-full max-w-[880px] overflow-x-clip px-4 py-8 sm:py-10">
      <header className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#047857]">
          Independent research · California
        </p>
        <h1 className="mt-1 break-words text-2xl font-bold text-[#0A2540] sm:text-3xl">
          California Mortgage &amp; Lending Intelligence
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          The current published California intelligence snapshot is unavailable.
        </p>
        <p className="mt-2 text-sm text-slate-600">{reason}</p>
      </header>
    </div>
  );
}

export function CaliforniaStateIntelligence({
  snapshot,
}: {
  snapshot: CaliforniaIntelligenceSnapshot;
}) {
  const s = snapshot;
  const H = s.hmda;
  const D = s.calhfa_directory;
  const mixMax = Math.max(H.apps_conventional, H.apps_fha, H.apps_va, H.apps_usda_other);
  const purposeMax = Math.max(H.purchase_applications, H.refinance_applications);
  const depth = [
    {
      family: 'HMDA',
      source: H.source,
      agency: 'CFPB / FFIEC HMDA',
      asOf: H.source_as_of,
      grain: H.geo_grain,
      rows: `${fmtInt(H.applications)} applications / ${fmtInt(H.county_count)} counties`,
      identity: 'HMDA LEI for reporters; county FIPS for geography',
      contact: 'Not a contact directory',
      access: 'Committed product partition',
      status: H.coverage_state,
      limitations: H.caveat,
    },
    {
      family: 'CalHFA programs',
      source: s.calhfa_programs.source_index,
      agency: s.calhfa_programs.source_agency,
      asOf: s.source_as_of.calhfa_programs,
      grain: 'program',
      rows: String(s.calhfa_programs.items.length),
      identity: 'Official program name',
      contact: 'Apply through a CalHFA-approved lender',
      access: 'Official HTML',
      status: 'ACQUIRED_CURRENT_SNAPSHOT',
      limitations: s.calhfa_programs.caveat,
    },
    {
      family: 'CalHFA approved lenders',
      source: D.url,
      agency: 'California Housing Finance Agency',
      asOf: D.source_as_of,
      grain: D.grain,
      rows: `${fmtInt(D.directory_rows)} rows / ${fmtInt(D.distinct_company_names)} distinct names`,
      identity: 'REVIEW_REQUIRED name + address; no source-native NMLS',
      contact: `${fmtInt(D.phone_present)} phones / ${fmtInt(D.address_present)} addresses`,
      access: 'OPEN_BULK_DOWNLOAD HTML table',
      status: D.result,
      limitations: D.caveat,
    },
    {
      family: 'DFPI CRMLA annual report',
      source: s.crmla_annual_report.url,
      agency: s.crmla_annual_report.agency,
      asOf: s.crmla_annual_report.as_of,
      grain: 'statewide annual report',
      rows: `${fmtInt(s.crmla_annual_report.licensees)} licensees / ${fmtInt(s.crmla_annual_report.branches)} branches`,
      identity: 'Report aggregate only',
      contact: 'n/a',
      access: 'Official PDF',
      status: s.crmla_annual_report.coverage_state,
      limitations: s.crmla_annual_report.caveat,
    },
    {
      family: 'Current DFPI / NMLS roster',
      source: 'NMLS Consumer Access / DOCQNET',
      agency: 'DFPI / NMLS',
      asOf: 'Unknown',
      grain: 'not acquired',
      rows: 'Unknown / not acquired',
      identity: 'none in this snapshot',
      contact: 'n/a',
      access: 'OPEN_SEARCH_ONLY',
      status: s.live_roster.CURRENT_CRMLA_BULK_ROSTER,
      limitations: s.live_roster.caveat,
    },
    {
      family: 'DRE MLO',
      source: s.dre_mlo.source_url,
      agency: 'California Department of Real Estate',
      asOf: 'Unknown',
      grain: 'individual licensee search',
      rows: 'Unknown / not acquired',
      identity: 'DRE license number; MLO endorsement is not CRMLA',
      contact: 'n/a',
      access: s.dre_mlo.coverage,
      status: s.dre_mlo.coverage,
      limitations: s.dre_mlo.caveat,
    },
    {
      family: 'DFPI enforcement',
      source: 'DFPI enforcement extracts',
      agency: 'DFPI',
      asOf: 'Unknown',
      grain: 'not acquired',
      rows: 'Unknown / not acquired',
      identity: 'exact docket / NMLS only if acquired',
      contact: 'n/a',
      access: 'search / PDF',
      status: s.enforcement.result,
      limitations: s.enforcement.caveat,
    },
    {
      family: 'CFPB complaints',
      source: s.cfpb.source_url,
      agency: 'Consumer Financial Protection Bureau',
      asOf: s.cfpb.retrieved_at ?? 'Unknown',
      grain: 'mortgage product, state = CA',
      rows: s.cfpb.mortgage_complaint_rows == null ? 'Unknown' : fmtInt(s.cfpb.mortgage_complaint_rows),
      identity: 'CFPB company names in the national snapshot; this overlay is statewide',
      contact: 'n/a',
      access: 'Official CFPB API',
      status: s.cfpb.coverage_state,
      limitations: s.cfpb.caveat,
    },
    {
      family: 'State foreclosure / servicing source',
      source: 'No dedicated statewide structured file',
      agency: 'n/a',
      asOf: 'Unknown',
      grain: 'not acquired',
      rows: 'Unknown / not acquired',
      identity: 'none',
      contact: 'n/a',
      access: 'SOURCE_NOT_ACQUIRED',
      status: 'STATEWIDE_STRUCTURED_SOURCE_NOT_ACQUIRED',
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
          <li className="text-slate-800">California research</li>
        </ol>
      </nav>

      <header className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#047857]">
          Independent research · California
        </p>
        <h1 className="mt-1 break-words text-2xl font-bold text-[#0A2540] sm:text-3xl">
          California Mortgage &amp; Lending Intelligence
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          A source-backed view of California mortgage-market activity, CalHFA housing-finance
          programs, and DFPI CRMLA report evidence. This is not a ranking, recommendation, or Trust
          Score. There is no current live California mortgage-license roster in this snapshot.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Local catalog pages remain at{' '}
          <Link href="/local-lenders/california" className="text-[#047857] underline underline-offset-2">
            /local-lenders/california
          </Link>
          . Those pages are not this official-source intelligence snapshot.
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
            hint="2025 HMDA originations, property location California."
          />
          <Metric
            value={fmtInt(s.hero.observations_value)}
            label={`Observations · ${s.hero.observations_label}`}
            hint="CalHFA directory rows, not unique companies and not licenses."
          />
          <Metric
            value={fmtInt(s.hero.geography_value)}
            label={`Geography · ${s.hero.geography_label}`}
            hint="All 58 California counties in the HMDA geography."
          />
          <Metric
            value={String(s.hero.as_of_value)}
            label={`As-of · ${s.hero.as_of_label}`}
            hint="HMDA reporting vintage. CalHFA directory retrieved 2026-09-03."
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
            originations, and {fmtInt(H.denials)} denials for properties located in California (
            {fmtPct(H.denial_rate_pct)} denial rate). That is not a license count.
          </li>
          <li>
            Purchase applications are {fmtPct(H.purchase_pct_of_apps)} of the file and refinance
            applications are {fmtPct(H.refinance_pct_of_apps)}. Conventional applications are{' '}
            {fmtPct(H.conventional_pct)}.
          </li>
          <li>All 58 California counties are represented in this HMDA geography.</li>
          <li>
            CalHFA’s approved-lender HTML directory lists {fmtInt(D.directory_rows)} branch rows
            and {fmtInt(D.distinct_company_names)} distinct company names. A directory row is not a
            unique company and is not a California license.
          </li>
          <li>
            {s.crmla_annual_report.label} {fmtInt(s.crmla_annual_report.licensees)} licensees and{' '}
            {fmtInt(s.crmla_annual_report.branches)} branches as of 2024-12-31. That report is not a
            September 2026 live roster.
          </li>
        </ul>
      </section>

      <section aria-labelledby="hmda-heading" className="mt-10">
        <h2 id="hmda-heading" className="text-lg font-semibold text-[#0A2540]">
          2025 California mortgage market
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{H.caveat}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Metric value={fmtInt(H.applications)} label="Applications" hint="HMDA 2025, properties in California." />
          <Metric value={fmtInt(H.originations)} label="Originations" />
          <Metric value={fmtInt(H.denials)} label="Denials" />
          <Metric value={fmtPct(H.denial_rate_pct)} label="Denial rate" hint="Denials ÷ applications in this extract." />
        </div>
        <Trace
          source={H.source}
          sourceDate={H.source_as_of}
          denominator={`${fmtInt(H.applications)} applications`}
          calculation={H.denial_rate_calculation}
          grain="State overlay from 58 county rows"
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
      </section>

      <section aria-labelledby="county-heading" className="mt-10">
        <h2 id="county-heading" className="text-lg font-semibold text-[#0A2540]">
          County market table
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          All official California counties in the HMDA geography, sorted alphabetically. No
          California county routes are published from this page.
        </p>
        <CaliforniaCountyTable counties={H.counties} />
      </section>

      <section aria-labelledby="calhfa-heading" className="mt-10">
        <h2 id="calhfa-heading" className="text-lg font-semibold text-[#0A2540]">
          California housing finance programs
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {s.calhfa_programs.application_path} {s.calhfa_programs.income_limits_note}
        </p>
        <div className="mt-4 space-y-4">
          {s.calhfa_programs.items.map((p) => (
            <article key={p.name} className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-base font-semibold text-[#0A2540]">{p.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{p.assistance}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                <li>Headline maximum / formula: {p.maximum}</li>
                <li>Eligibility: {p.eligibility}</li>
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
        <p className="mt-3 text-sm text-slate-600">{s.calhfa_programs.caveat}</p>
      </section>

      <section aria-labelledby="directory-heading" className="mt-10">
        <h2 id="directory-heading" className="text-lg font-semibold text-[#0A2540]">
          CalHFA approved-lender directory
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{D.caveat}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Metric value={fmtInt(D.directory_rows)} label="Directory rows" hint={D.grain} />
          <Metric value={fmtInt(D.distinct_company_names)} label="Distinct company names" />
          <Metric value={fmtInt(D.california_branch_rows)} label="California-address rows" />
          <Metric
            value={`${fmtInt(D.phone_present)} / ${fmtInt(D.address_present)}`}
            label="Phones / addresses"
            hint="Facility contact from CalHFA directory. Not an endorsement."
          />
        </div>
        <Trace
          source={D.url}
          sourceDate={D.source_as_of}
          denominator={`${fmtInt(D.directory_rows)} directory rows`}
          calculation="HTML table rows after the header. Distinct names are case-normalized display names."
          grain={D.grain}
          coverage={D.result}
          caveat={D.caveat}
        />
        <p className="mt-3 text-sm text-slate-600">
          Verify current authority on{' '}
          <a
            href="https://www.nmlsconsumeraccess.org/"
            className="text-[#047857] underline underline-offset-2"
          >
            NMLS Consumer Access
          </a>{' '}
          or DFPI DOCQNET. Those systems were not scraped for this page.
        </p>
      </section>

      <section aria-labelledby="crmla-heading" className="mt-10">
        <h2 id="crmla-heading" className="text-lg font-semibold text-[#0A2540]">
          2024 CRMLA annual report
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.crmla_annual_report.caveat}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Metric value={fmtInt(s.crmla_annual_report.licensees)} label="Licensees" hint="As of 2024-12-31" />
          <Metric value={fmtInt(s.crmla_annual_report.branches)} label="Branches" />
          <Metric
            value={fmtInt(s.crmla_annual_report.loans_originated_count)}
            label="Loans originated (report)"
            hint={s.crmla_annual_report.loans_originated_volume_note}
          />
          <Metric
            value={fmtInt(s.crmla_annual_report.foreclosures_completed)}
            label="Completed foreclosures (report)"
          />
        </div>
        <Trace
          source={s.crmla_annual_report.url}
          sourceDate={s.crmla_annual_report.as_of}
          denominator="CRMLA 2024 annual-report statewide totals"
          calculation="Official headline counts extracted from the October 2025 PDF."
          grain="annual report"
          coverage={s.crmla_annual_report.coverage_state}
          caveat={s.crmla_annual_report.caveat}
        />
      </section>

      <section aria-labelledby="matrix-heading" className="mt-10">
        <h2 id="matrix-heading" className="text-lg font-semibold text-[#0A2540]">
          Regulator / credential matrix
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          DRE MLO endorsement is not a CRMLA company license. An HMDA reporter is not a California
          licensee. An NMLS ID is not proof of current California authority by itself.
        </p>
        <div className="mt-4 min-w-0 overflow-x-auto">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <caption className="sr-only">What each California mortgage credential proves and does not prove.</caption>
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
          CFPB California mortgage complaints
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.cfpb.caveat}</p>
        <Metric
          value={fmtInt(s.cfpb.mortgage_complaint_rows)}
          label="Mortgage complaint rows with state = CA"
          hint="Official CFPB API overlay. Not a complaint index."
        />
        <Trace
          source={s.cfpb.source_url}
          sourceDate={s.cfpb.retrieved_at ?? 'Unknown'}
          denominator="CFPB mortgage product rows with state CA"
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
      </section>

      <section aria-labelledby="reporters-heading" className="mt-10">
        <h2 id="reporters-heading" className="text-lg font-semibold text-[#0A2540]">
          HMDA application volume (not a license ranking)
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Largest by HMDA application volume in this California property-location dataset. HMDA
          reporter is not a California licensee.
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
                  Rows / count
                </th>
                <th scope="col" className="py-2 pr-3">
                  Identity
                </th>
                <th scope="col" className="py-2">
                  Limitations
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
                  <td className="py-2 pr-3">{row.rows}</td>
                  <td className="py-2 pr-3">{row.identity}</td>
                  <td className="py-2">{row.limitations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="gaps-heading" className="mt-10">
        <h2 id="gaps-heading" className="text-lg font-semibold text-[#0A2540]">
          What we do not know
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
          {s.gaps.map((gap) => (
            <li key={gap}>{gap}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-slate-600">
          Missing is unknown, not zero. Current CRMLA bulk roster is SOURCE_NOT_ACQUIRED. DFPI
          enforcement corpus is not required to publish this page. Statewide foreclosure dataset is
          not required.
        </p>
      </section>
    </div>
  );
}
