import Link from 'next/link';
import { ArizonaCountyTable } from '@/components/arizona/county-table';
import { Trace } from '@/components/new-jersey/trace';
import {
  fmtInt,
  fmtPct,
  type ArizonaIntelligenceSnapshot,
} from '@/lib/arizona-intelligence/snapshot';

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

export function ArizonaStateIntelligenceUnavailable({ reason }: { reason: string }) {
  return (
    <div className="th-shell mx-auto w-full max-w-[880px] overflow-x-clip px-4 py-8 sm:py-10">
      <header className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#047857]">
          Independent research · Arizona
        </p>
        <h1 className="mt-1 break-words text-2xl font-bold text-[#0A2540] sm:text-3xl">
          Arizona Mortgage &amp; Lending Intelligence
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          The current published Arizona intelligence snapshot is unavailable.
        </p>
        <p className="mt-2 text-sm text-slate-600">{reason}</p>
      </header>
    </div>
  );
}

export function ArizonaStateIntelligence({
  snapshot,
}: {
  snapshot: ArizonaIntelligenceSnapshot;
}) {
  const s = snapshot;
  const H = s.hmda;
  const O = s.difi_enforcement;
  const mixMax = Math.max(H.apps_conventional, H.apps_fha, H.apps_va, H.apps_usda_other);
  const purposeMax = Math.max(H.purchase_applications, H.refinance_applications, H.purpose_other_applications);
  const cfpbMax = Math.max(...(s.cfpb.top_issues || []).map((row) => row.count), 1);
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
      family: 'DIFI verification',
      source: 'NMLS Consumer Access / DIFI license search',
      agency: 'Arizona DIFI / NMLS',
      asOf: 'Unknown / search-only',
      grain: 'not acquired as a bulk roster',
      rows: 'UNKNOWN / SOURCE_NOT_ACQUIRED',
      identity: 'NMLS ID when a live search returns one',
      status: s.live_roster.CURRENT_ARIZONA_MORTGAGE_COMPANY_BULK_ROSTER,
      limitations: s.live_roster.caveat,
    },
    {
      family: 'DIFI enforcement',
      source: O.url,
      agency: O.agency,
      asOf: 'WAF 403 on automated harvest',
      grain: O.grain,
      rows: 'UNKNOWN / OPEN_HTML_TABLE_DOCUMENTED_NOT_HARVESTED',
      identity: 'Exact NMLS or DIFI license when source-native; name-only is UNSAFE_FOR_ADVERSE_PROFILE_ATTACH',
      status: O.coverage_state,
      limitations: O.caveat,
    },
    {
      family: 'CFPB complaints',
      source: s.cfpb.source_url,
      agency: 'Consumer Financial Protection Bureau',
      asOf: s.cfpb.retrieved_at ?? 'Unknown',
      grain: 'mortgage product, state = AZ',
      rows: s.cfpb.mortgage_complaint_rows == null ? 'Unknown' : fmtInt(s.cfpb.mortgage_complaint_rows),
      identity: 'Statewide overlay; not a company ranking',
      status: s.cfpb.coverage_state,
      limitations: s.cfpb.caveat,
    },
    {
      family: 'Homebuyer programs',
      source: 'Official Arizona IDA / HOME Plus pages',
      agency: 'Arizona Industrial Development Authority / Arizona Department of Housing',
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
      asOf: 'Existing committed FDIC Arizona file',
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
    {
      family: 'Current company roster',
      source: s.live_roster.nmls_consumer_access,
      agency: 'Arizona DIFI / NMLS',
      asOf: 'Unknown / search-only',
      grain: 'not acquired',
      rows: 'UNKNOWN',
      identity: 'NMLS when a live search returns one',
      status: s.live_roster.ARIZONA_LIVE_COMPANY_ROSTER,
      limitations: s.live_roster.caveat,
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
          <li className="text-slate-800">Arizona research</li>
        </ol>
      </nav>

      <header className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#047857]">
          Independent research · Arizona
        </p>
        <h1 className="mt-1 break-words text-2xl font-bold text-[#0A2540] sm:text-3xl">
          Arizona Mortgage &amp; Lending Intelligence
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          A source-backed view of Arizona mortgage-market activity, DIFI regulatory limits, NMLS
          verification, CFPB mortgage complaints, and statewide homebuyer programs. This is not a
          ranking, recommendation, or Trust Score. There is no current live Arizona
          mortgage-company roster in this snapshot.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Local catalog pages remain at{' '}
          <Link href="/local-lenders/arizona" className="text-[#047857] underline underline-offset-2">
            /local-lenders/arizona
          </Link>
          . Those pages are not this official-source intelligence snapshot. No Arizona county or city
          routes are published from this page.
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
            hint="2025 HMDA originations, property location Arizona."
          />
          <Metric
            value={fmtInt(s.hero.observations_value)}
            label={`Observations · ${s.hero.observations_label}`}
            hint="Complaint is not a violation. Not a company ranking."
          />
          <Metric
            value={fmtInt(s.hero.geography_value)}
            label={`Geography · ${s.hero.geography_label}`}
            hint="All 15 Arizona counties in this HMDA extract. County is property location, not a ranking."
          />
          <Metric
            value={String(s.hero.as_of_value)}
            label={`As-of · ${s.hero.as_of_label}`}
            hint="HMDA reporting vintage."
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
            originations, and {fmtInt(H.denials)} denials for properties located in Arizona (
            {fmtPct(H.denial_rate_pct)} denial rate). That is not a license count.
          </li>
          <li>
            Purchase applications are {fmtPct(H.purchase_pct_of_apps)} of the file, refinance
            applications are {fmtPct(H.refinance_pct_of_apps)}, and other purposes are{' '}
            {fmtPct(H.purpose_other_pct_of_apps)}. Conventional applications are {fmtPct(H.conventional_pct)}.
            Denial-reason fields are SOURCE_NOT_AVAILABLE_IN_COMMITTED_EXTRACT.
          </li>
          <li>
            All {fmtInt(H.county_count)} Arizona counties are in this HMDA geography, sorted
            alphabetically on this page. No Arizona county or city routes are published.
          </li>
          <li>
            CFPB recorded {fmtInt(s.cfpb.mortgage_complaint_rows)} Arizona mortgage complaint rows. A
            complaint is not a violation and is not a company ranking.
          </li>
          <li>
            Arizona DIFI mortgage classes apply through NMLS. The live company roster is
            SOURCE_NOT_ACQUIRED / OPEN_SEARCH_ONLY. Missing is not zero. Search-only is not zero.
          </li>
        </ul>
      </section>

      <section aria-labelledby="hmda-heading" className="mt-10">
        <h2 id="hmda-heading" className="text-lg font-semibold text-[#0A2540]">
          2025 Arizona mortgage market
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{H.caveat}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Metric value={fmtInt(H.applications)} label="Applications" hint="HMDA 2025, properties in Arizona." />
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
          <BarRow label="Other purpose applications" n={H.purpose_other_applications} max={purposeMax} />
        </div>
        <h3 className="mt-6 text-base font-semibold text-[#0A2540]">Loan type (applications)</h3>
        <div className="mt-3 space-y-3">
          <BarRow label={`Conventional (${fmtPct(H.conventional_pct)})`} n={H.apps_conventional} max={mixMax} />
          <BarRow label={`FHA (${fmtPct(H.fha_pct)})`} n={H.apps_fha} max={mixMax} />
          <BarRow label={`VA (${fmtPct(H.va_pct)})`} n={H.apps_va} max={mixMax} />
          <BarRow label={`USDA / other (${fmtPct(H.usda_other_pct)})`} n={H.apps_usda_other} max={mixMax} />
        </div>
        <Trace
          source={H.source}
          sourceDate={H.source_as_of}
          denominator={`${fmtInt(H.applications)} applications`}
          calculation={`Purchase ${fmtInt(H.purchase_applications)}; refinance ${fmtInt(H.refinance_applications)}; other ${fmtInt(H.purpose_other_applications)}. Conventional ${fmtInt(H.apps_conventional)}; FHA ${fmtInt(H.apps_fha)}; VA ${fmtInt(H.apps_va)}; USDA/other ${fmtInt(H.apps_usda_other)}.`}
          grain="loan purpose and loan type on the same Arizona county-sum extract"
          coverage={H.coverage_state}
          caveat="Purpose mix is not a quality ranking. Conventional share is not an underwriting finding."
        />
        <p className="mt-3 text-sm text-slate-600">{H.denial_reasons_coverage}</p>
        <p className="mt-2 text-sm text-slate-600">
          {fmtInt(H.lei_reporter_rows)} HMDA LEI reporters appear in the Arizona state summary.{' '}
          {fmtInt(H.lei_reporters_with_exact_nmls)} have an exact LEI→NMLS map. An HMDA reporter is
          not an Arizona licensee. LEI is not NMLS.
        </p>
        <Trace
          source="data/hmda/arizona/lei_to_nmls_mapping.csv plus Arizona LEI state rows"
          sourceDate={H.source_as_of}
          denominator={`${fmtInt(H.lei_reporter_rows)} Arizona HMDA LEI reporter rows`}
          calculation={`${fmtInt(H.lei_reporters_with_exact_nmls)} reporters with an exact LEI→NMLS map; ${fmtInt(H.high_confidence_lei_maps)} mapping CSV rows. These two counts are not collapsed. LEI is not NMLS.`}
          grain="institution LEI; NMLS only when source-native in the mapping file"
          coverage="Committed mapping overlay, not a live license check"
          caveat="An exact LEI→NMLS map is not current Arizona DIFI authority. An HMDA reporter is not an Arizona licensee."
        />
      </section>

      <section aria-labelledby="clock-heading" className="mt-10">
        <h2 id="clock-heading" className="text-lg font-semibold text-[#0A2540]">
          Clock reconciliation
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.clock_reconciliation.why}</p>
        <p className="mt-2 text-sm text-slate-600">
          Canonical for this page: {fmtInt(s.clock_reconciliation.lender_applications)} applications /{' '}
          {fmtInt(s.clock_reconciliation.lender_originations)} originations /{' '}
          {fmtInt(s.clock_reconciliation.lender_denials)} denials. Ask fallback remains{' '}
          {fmtInt(s.clock_reconciliation.ask_fallback_applications)} /{' '}
          {fmtInt(s.clock_reconciliation.ask_fallback_originations)} /{' '}
          {fmtInt(s.clock_reconciliation.ask_fallback_denials)} and is not rewritten here.
        </p>
      </section>

      <section aria-labelledby="county-heading" className="mt-10">
        <h2 id="county-heading" className="text-lg font-semibold text-[#0A2540]">
          County market table
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Counties present in the committed Arizona HMDA geography, sorted alphabetically. No Arizona
          county routes are published from this page. Denial rate is not a county ranking.
        </p>
        <ArizonaCountyTable counties={H.counties} />
      </section>

      <section aria-labelledby="regulate-heading" className="mt-10">
        <h2 id="regulate-heading" className="text-lg font-semibold text-[#0A2540]">
          Who regulates Arizona mortgage businesses?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Arizona DIFI licenses Mortgage Banker, Mortgage Broker, Commercial Mortgage Banker,
          Commercial Mortgage Broker, Registered Exempt Person, and Loan Originator classes through
          NMLS. Loan Originator is a person grain — this site does not publish an MLO directory.
          Depository banks and credit unions are chartered separately. An HMDA reporter is not an
          Arizona licensee. An NMLS ID is not current Arizona authority by itself.
        </p>
      </section>

      <section aria-labelledby="verify-heading" className="mt-10">
        <h2 id="verify-heading" className="text-lg font-semibold text-[#0A2540]">
          How to verify a company or MLO
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Mortgage banker/broker classes and MLOs verify through NMLS Consumer Access. This search
          was not scraped. This page is not an NMLS shadow directory.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>
            <a href="https://www.nmlsconsumeraccess.org/" className="text-[#047857] underline underline-offset-2">
              NMLS Consumer Access
            </a>
          </li>
          <li>
            <a href="https://difi.az.gov/licensing/mortgage-lending" className="text-[#047857] underline underline-offset-2">
              DIFI mortgage licensing
            </a>
          </li>
          <li>
            <a href="https://difi.az.gov/license-search" className="text-[#047857] underline underline-offset-2">
              DIFI license search
            </a>
          </li>
        </ul>
      </section>

      <section aria-labelledby="difi-heading" className="mt-10">
        <h2 id="difi-heading" className="text-lg font-semibold text-[#0A2540]">
          DIFI enforcement
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{O.caveat}</p>
        <Metric
          value="OPEN_HTML_TABLE / NOT HARVESTED"
          label="DIFI enforcement table"
          hint="WAF 403 on automated harvest. Table exists. Mixes insurance and lending. Lender-relevant count is UNKNOWN, not zero."
        />
        <Trace
          source={O.url}
          sourceDate="Documented 2026-09-04; bulk harvest blocked"
          denominator="Official HTML table — total UNKNOWN"
          calculation="Source-native License Type filter for mortgage/lending. Name-only is UNSAFE_FOR_ADVERSE_PROFILE_ATTACH."
          grain={O.grain}
          coverage={O.coverage_state}
          caveat={O.caveat}
        />
        <p className="mt-3 text-sm text-slate-600">{O.filter_rule}</p>
        <p className="mt-2 text-sm text-slate-600">{O.documented_first_page_note}</p>
      </section>

      <section aria-labelledby="roster-heading" className="mt-10">
        <h2 id="roster-heading" className="text-lg font-semibold text-[#0A2540]">
          Current Arizona mortgage-company roster
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.live_roster.caveat}</p>
        <Metric
          value="SOURCE_NOT_ACQUIRED / OPEN_SEARCH_ONLY"
          label="ARIZONA_LIVE_COMPANY_ROSTER"
          hint="Live licensed-company denominator is UNKNOWN. Missing is not zero. Search-only is not zero."
        />
      </section>

      <section aria-labelledby="cfpb-heading" className="mt-10">
        <h2 id="cfpb-heading" className="text-lg font-semibold text-[#0A2540]">
          CFPB Arizona mortgage complaints
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.cfpb.caveat}</p>
        <Metric
          value={fmtInt(s.cfpb.mortgage_complaint_rows)}
          label="Arizona mortgage complaint rows"
          hint="Statewide overlay. Not a company ranking."
        />
        <Trace
          source={s.cfpb.source_url}
          sourceDate={s.cfpb.retrieved_at ?? 'Unknown'}
          denominator="CFPB mortgage product rows with state AZ"
          calculation="hits.total from the public CFPB complaint search API"
          grain="statewide product overlay"
          coverage={s.cfpb.coverage_state}
          caveat={s.cfpb.caveat}
        />
        <h3 className="mt-6 text-base font-semibold text-[#0A2540]">Major issue categories</h3>
        <div className="mt-3 space-y-3">
          {(s.cfpb.top_issues || []).map((row) => (
            <BarRow key={row.key} label={row.key} n={row.count} max={cfpbMax} />
          ))}
        </div>
      </section>

      <section aria-labelledby="programs-heading" className="mt-10">
        <h2 id="programs-heading" className="text-lg font-semibold text-[#0A2540]">
          Arizona statewide homebuyer assistance
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
        <Trace
          source="Official Arizona IDA HOME Plus and Arizona Is Home pages"
          sourceDate={s.programs.retrieved_at}
          denominator={`${s.programs.verified_family_count} statewide program families`}
          calculation="Official-page retrieval. Local Phoenix / Maricopa DPA is out of scope."
          grain="program family"
          coverage="ACQUIRED_CURRENT_SNAPSHOT"
          caveat={s.programs.caveat}
        />
      </section>

      <section aria-labelledby="ledger-heading" className="mt-10">
        <h2 id="ledger-heading" className="text-lg font-semibold text-[#0A2540]">
          Expansion ledger
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Entity growth is measured separately from intelligence growth. HMDA rows already in the
          repository are not new evidence merely because this page displays them.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Metric value={String(s.expansion_ledger.NET_NEW_CANONICAL_ORGANIZATIONS)} label="Net-new canonical organizations" />
          <Metric value={String(s.expansion_ledger.NET_NEW_STATE_IDENTITIES)} label="Net-new state identities" />
          <Metric value={String(s.expansion_ledger.EXISTING_ORGANIZATIONS_ENRICHED)} label="Existing organizations enriched" />
          <Metric value={fmtInt(s.expansion_ledger.NEW_EVIDENCE_ROWS)} label="New evidence rows" hint="CFPB overlay plus program families. Not HMDA." />
        </div>
        <p className="mt-3 text-sm text-slate-600">Classification: {s.growth_classification}.</p>
        <Trace
          source="AZ-LEND-001 before/after ledger against origin/main c39eae2"
          sourceDate={s.generated_at}
          denominator="Canonical organizations and Arizona DIFI/NMLS identities already in this repository"
          calculation="NET_NEW_CANONICAL_ORGANIZATIONS=0; NET_NEW_STATE_IDENTITIES=0; EXISTING_ORGANIZATIONS_ENRICHED=0; NEW_EVIDENCE_ROWS=10,365 CFPB rows + 2 program families. HMDA already in the repository is not new evidence."
          grain="ledger, not a market ranking"
          coverage={s.growth_classification}
          caveat="Market rows are not entity growth. Missing live roster is unknown, not zero."
        />
      </section>

      <section aria-labelledby="matrix-heading" className="mt-10">
        <h2 id="matrix-heading" className="text-lg font-semibold text-[#0A2540]">
          Regulator / credential matrix
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          An HMDA reporter is not an Arizona licensee. An NMLS ID is not proof of current Arizona
          authority by itself. Program participation is not an endorsement. An MLO person is not a
          lender company.
        </p>
        <div className="mt-4 min-w-0 overflow-x-auto">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <caption className="sr-only">What each Arizona mortgage credential proves and does not prove.</caption>
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th scope="col" className="py-2 pr-3">Credential</th>
                <th scope="col" className="py-2 pr-3">What it is</th>
                <th scope="col" className="py-2 pr-3">Regulator</th>
                <th scope="col" className="py-2 pr-3">Proves</th>
                <th scope="col" className="py-2">Does not prove</th>
              </tr>
            </thead>
            <tbody>
              {s.regulator_matrix.map((row) => (
                <tr key={row.credential} className="border-b border-slate-100 align-top">
                  <th scope="row" className="py-2 pr-3 font-medium text-slate-800">{row.credential}</th>
                  <td className="py-2 pr-3 text-slate-700">{row.what}</td>
                  <td className="py-2 pr-3 text-slate-700">{row.regulator}</td>
                  <td className="py-2 pr-3 text-slate-700">{row.proves}</td>
                  <td className="py-2 text-slate-700">{row.does_not_prove}</td>
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
            <caption className="sr-only">Arizona evidence families with source, clock, grain, and limitations.</caption>
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th scope="col" className="py-2 pr-3">Family</th>
                <th scope="col" className="py-2 pr-3">Agency</th>
                <th scope="col" className="py-2 pr-3">As-of</th>
                <th scope="col" className="py-2 pr-3">Grain</th>
                <th scope="col" className="py-2 pr-3">Count</th>
                <th scope="col" className="py-2">Limitations</th>
              </tr>
            </thead>
            <tbody>
              {depth.map((row) => (
                <tr key={row.family} className="border-b border-slate-100 align-top">
                  <th scope="row" className="py-2 pr-3 font-medium text-slate-800">{row.family}</th>
                  <td className="py-2 pr-3 text-slate-700">{row.agency}</td>
                  <td className="py-2 pr-3 text-slate-700">{row.asOf}</td>
                  <td className="py-2 pr-3 text-slate-700">{row.grain}</td>
                  <td className="py-2 pr-3 tabular-nums text-slate-700">{row.rows}</td>
                  <td className="py-2 text-slate-700">{row.limitations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="gaps-heading" className="mt-10">
        <h2 id="gaps-heading" className="text-lg font-semibold text-[#0A2540]">
          Coverage gaps
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
          {s.gaps.map((gap) => (
            <li key={gap}>{gap}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
