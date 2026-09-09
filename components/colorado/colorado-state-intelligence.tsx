import Link from 'next/link';
import { ColoradoCountyTable } from '@/components/colorado/county-table';
import { Trace } from '@/components/new-jersey/trace';
import {
  fmtInt,
  fmtPct,
  type ColoradoIntelligenceSnapshot,
} from '@/lib/colorado-intelligence/snapshot';

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

export function ColoradoStateIntelligenceUnavailable({ reason }: { reason: string }) {
  return (
    <div className="th-shell mx-auto w-full max-w-[880px] overflow-x-clip px-4 py-8 sm:py-10">
      <header className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#047857]">
          Independent research · Colorado
        </p>
        <h1 className="mt-1 break-words text-2xl font-bold text-[#0A2540] sm:text-3xl">
          Colorado Mortgage &amp; Lending Intelligence
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          The current published Colorado intelligence snapshot is unavailable.
        </p>
        <p className="mt-2 text-sm text-slate-600">{reason}</p>
      </header>
    </div>
  );
}

export function ColoradoStateIntelligence({
  snapshot,
}: {
  snapshot: ColoradoIntelligenceSnapshot;
}) {
  const s = snapshot;
  const H = s.hmda;
  const M = s.mlo_roster;
  const mixMax = Math.max(H.apps_conventional, H.apps_fha, H.apps_va, H.apps_usda_other);
  const purposeMax = Math.max(H.purchase_applications, H.refinance_applications, H.purpose_other_applications);
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
      family: 'DRE MLO licenses',
      source: M.source_url,
      agency: M.authority,
      asOf: M.source_as_of ?? 'Unknown',
      grain: 'person',
      rows: `${fmtInt(M.rows)} license rows · ${fmtInt(M.active)} Active`,
      identity: M.identity,
      status: M.coverage_state,
      limitations: M.caveat,
    },
    {
      family: 'Mortgage-company registration',
      source: s.live_roster.nmls_consumer_access,
      agency: 'Colorado DRE via NMLS',
      asOf: 'Unknown / search-only',
      grain: 'not acquired as a bulk roster',
      rows: 'UNKNOWN / SOURCE_NOT_ACQUIRED',
      identity: 'NMLS Company ID when a live search returns one',
      status: s.live_roster.CURRENT_COLORADO_MORTGAGE_COMPANY_BULK_ROSTER,
      limitations: s.live_roster.caveat,
    },
    {
      family: 'DRE enforcement',
      source: s.dre_enforcement.url,
      agency: s.dre_enforcement.agency,
      asOf: 'Unknown / search-only',
      grain: s.dre_enforcement.grain,
      rows: 'UNKNOWN / OPEN_SEARCH_ONLY',
      identity: 'Exact official ID or exact NMLS ID; name-only is UNSAFE_FOR_ADVERSE_PROFILE_ATTACH',
      status: s.dre_enforcement.coverage_state,
      limitations: s.dre_enforcement.caveat,
    },
    {
      family: 'CFPB complaints',
      source: s.cfpb.source_url,
      agency: 'Consumer Financial Protection Bureau',
      asOf: s.cfpb.api_last_updated ?? 'Source date not reported',
      grain: 'mortgage product, state = CO',
      rows: s.cfpb.mortgage_complaint_rows == null ? 'Unknown' : fmtInt(s.cfpb.mortgage_complaint_rows),
      identity: 'Statewide overlay; not a company ranking',
      status: s.cfpb.coverage_state,
      limitations: s.cfpb.caveat,
    },
    {
      family: 'CHFA programs',
      source: 'Official CHFA pages',
      agency: 'Colorado Housing and Finance Authority',
      asOf: 'Source date not reported',
      grain: 'PROGRAM_PARTICIPATION / CONSUMER_RESOURCE',
      rows: String(s.programs.items.length),
      identity: 'Official program name',
      status: 'OPEN_SEARCH_ONLY',
      limitations: s.programs.caveat,
    },
    {
      family: 'Depository overlay',
      source: s.depository.source,
      agency: 'FDIC (existing national overlay)',
      asOf: 'Existing committed FDIC Colorado file',
      grain: 'FDIC CERT',
      rows: fmtInt(s.depository.fdic_cert_rows),
      identity: s.depository.identity,
      status: s.depository.coverage_state,
      limitations: s.depository.caveat,
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
          <li className="text-slate-800">Colorado research</li>
        </ol>
      </nav>

      <header className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#047857]">
          Independent research · Colorado
        </p>
        <h1 className="mt-1 break-words text-2xl font-bold text-[#0A2540] sm:text-3xl">
          Colorado Mortgage &amp; Lending Intelligence
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          A source-backed view of Colorado mortgage-market activity, DRE Mortgage Loan Originator
          licensing, NMLS company-registration verification, CFPB mortgage complaints, and CHFA
          homebuyer resources. This is not a ranking, recommendation, or Trust Score. Colorado does
          not have one simple “lender license” universe in this snapshot.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          No Colorado county routes and no Denver page are published from this statewide page. MLO
          person rows are not a lender directory.
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
            hint="2025 HMDA originations, property location Colorado."
          />
          <Metric
            value={fmtInt(s.hero.observations_value)}
            label={`Observations · ${s.hero.observations_label}`}
            hint="Complaint is not a violation. Not a company ranking."
          />
          <Metric
            value={fmtInt(s.hero.geography_value)}
            label={`Geography · ${s.hero.geography_label}`}
            hint="All 64 Colorado counties in this HMDA extract. County is property location, not a ranking."
          />
          <Metric value={String(s.hero.as_of_value)} label={`As-of · ${s.hero.as_of_label}`} hint="HMDA reporting vintage." />
        </div>
      </section>

      <section aria-labelledby="findings-heading" className="mt-10">
        <h2 id="findings-heading" className="text-lg font-semibold text-[#0A2540]">
          Market findings
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
          <li>
            2025 HMDA recorded {fmtInt(H.applications)} applications, {fmtInt(H.originations)}{' '}
            originations, and {fmtInt(H.denials)} denials for properties located in Colorado (
            {fmtPct(H.denial_rate_pct)} denial rate). That is not a lender count.
          </li>
          <li>
            DRE lists {fmtInt(M.rows)} Mortgage Loan Originator license rows ({fmtInt(M.active)} Active,{' '}
            {fmtInt(M.inactive)} Inactive). MLO person is not a lender company. These rows are not a
            public person directory.
          </li>
          <li>
            The current Colorado mortgage-company registration bulk roster is SOURCE_NOT_ACQUIRED /
            OPEN_SEARCH_ONLY. Missing is not zero. Search-only is not zero.
          </li>
          <li>
            CFPB recorded {fmtInt(s.cfpb.mortgage_complaint_rows)} Colorado mortgage complaint rows. A
            complaint is not a violation and is not a DRE complaint.
          </li>
          <li>
            CHFA homebuyer resources are program participation, not licensure and not an endorsement.
          </li>
        </ul>
      </section>

      <section aria-labelledby="hmda-heading" className="mt-10">
        <h2 id="hmda-heading" className="text-lg font-semibold text-[#0A2540]">
          2025 Colorado mortgage market
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{H.caveat}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Metric value={fmtInt(H.applications)} label="Applications" hint="HMDA 2025, properties in Colorado." />
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
        <p className="mt-3 text-sm text-slate-600">
          {fmtInt(H.lei_reporter_rows)} HMDA LEI reporters appear in the Colorado state summary.{' '}
          {fmtInt(H.lei_reporters_with_exact_nmls)} have an exact LEI→NMLS map. An HMDA reporter is
          not a Colorado licensee. LEI is not NMLS.
        </p>
        <ColoradoCountyTable counties={H.counties} />
      </section>

      <section aria-labelledby="mlo-heading" className="mt-10">
        <h2 id="mlo-heading" className="text-lg font-semibold text-[#0A2540]">
          Colorado Mortgage Loan Originator licenses
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{M.caveat}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Metric value={fmtInt(M.rows)} label="MLO license rows" hint="Person-grain. Not lenders." />
          <Metric value={fmtInt(M.active)} label="Active" />
          <Metric value={fmtInt(M.inactive)} label="Inactive" />
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Identity is {M.identity}. NMLS Individual ID is {M.nmls_individual_id_coverage}. MLO !=
          mortgage company. State-license absence != unlicensed. Employer/entity strings are not used to mint companies.
        </p>
        <Trace
          source={M.source}
          sourceDate={M.source_as_of}
          denominator={`${fmtInt(M.rows)} DRE MLO rows`}
          calculation={`${fmtInt(M.active)} Active + ${fmtInt(M.inactive)} Inactive. ${fmtInt(M.unique_license_numbers)} distinct license numbers.`}
          grain="person license row"
          coverage={M.coverage_state}
          caveat={M.caveat}
        />
      </section>

      <section aria-labelledby="company-heading" className="mt-10">
        <h2 id="company-heading" className="text-lg font-semibold text-[#0A2540]">
          Colorado mortgage-company registration
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.live_roster.caveat}</p>
        <p className="mt-2 text-sm text-slate-600">
          Live licensed-company denominator: {s.live_roster.live_licensed_company_denominator}. Verify
          through{' '}
          <Link href={s.live_roster.nmls_consumer_access} className="text-[#047857] underline underline-offset-2">
            NMLS Consumer Access
          </Link>
          . Search-only is not zero.
        </p>
      </section>

      <section aria-labelledby="enf-heading" className="mt-10">
        <h2 id="enf-heading" className="text-lg font-semibold text-[#0A2540]">
          DRE enforcement and complaints
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.dre_enforcement.caveat}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.complaints.caveat}</p>
        <p className="mt-2 text-sm text-slate-600">
          Name-only identity is {s.dre_enforcement.name_only_identity}. CFPB recorded{' '}
          {fmtInt(s.cfpb.mortgage_complaint_rows)} Colorado mortgage complaint rows. CFPB complaint !=
          DRE complaint. Complaint != violation.
        </p>
      </section>

      <section aria-labelledby="chfa-heading" className="mt-10">
        <h2 id="chfa-heading" className="text-lg font-semibold text-[#0A2540]">
          CHFA homebuyer resources
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.programs.caveat}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {s.programs.items.map((item) => (
            <li key={item.id}>
              <Link href={item.url} className="text-[#047857] underline underline-offset-2">
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="regulate-heading" className="mt-10">
        <h2 id="regulate-heading" className="text-lg font-semibold text-[#0A2540]">
          Who regulates Colorado mortgage businesses?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          The Colorado Division of Real Estate / Board of Mortgage Loan Originators licenses Mortgage
          Loan Originators as people. Mortgage companies register through NMLS subject to exemptions;
          DRE points company license histories to NMLS Consumer Access rather than a DRE bulk file.
          An HMDA reporter is not a Colorado mortgage-company registrant. An FDIC bank is not a
          Colorado mortgage-company registration. CHFA participation is not licensure.
        </p>
      </section>

      <section aria-labelledby="verify-heading" className="mt-10">
        <h2 id="verify-heading" className="text-lg font-semibold text-[#0A2540]">
          How to verify a company or MLO
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Companies verify through NMLS Consumer Access. Individual MLOs verify through DRE lookup
          or the CIM extract. This search was not scraped. MLO people are not published as a lender
          directory.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>
            <a href={s.live_roster.nmls_consumer_access} className="text-[#047857] underline underline-offset-2">
              NMLS Consumer Access
            </a>
          </li>
          <li>
            <a href={M.verify_path} className="text-[#047857] underline underline-offset-2">
              DRE license lookup
            </a>
          </li>
          <li>
            <a href={M.source_url} className="text-[#047857] underline underline-offset-2">
              CIM licensed professionals (4zse-6bnw)
            </a>
          </li>
        </ul>
      </section>

      <section aria-labelledby="does-not-mean-heading" className="mt-10">
        <h2 id="does-not-mean-heading" className="text-lg font-semibold text-[#0A2540]">
          What this page does not mean
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
          <li>It does not say Colorado has one lender-license universe or a single lender count.</li>
          <li>MLO person rows are not lenders, branches, or public claimable profiles.</li>
          <li>Search-only / SOURCE_NOT_ACQUIRED company registration is unknown, not zero.</li>
          <li>CFPB complaints are not violations. CHFA listings are not endorsements.</li>
          <li>claimed != verified. No Trust Score.</li>
        </ul>
      </section>

      <section aria-labelledby="depth-heading" className="mt-10">
        <h2 id="depth-heading" className="text-lg font-semibold text-[#0A2540]">
          Evidence depth
        </h2>
        <div className="mt-4 min-w-0 overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <caption className="sr-only">Colorado source catalog. Missing is unknown, not zero.</caption>
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th scope="col" className="py-2 pr-3">Family</th>
                <th scope="col" className="py-2 pr-3">Agency</th>
                <th scope="col" className="py-2 pr-3">Count</th>
                <th scope="col" className="py-2 pr-3">Identity</th>
                <th scope="col" className="py-2 pr-3">Limitation</th>
              </tr>
            </thead>
            <tbody>
              {depth.map((row) => (
                <tr key={row.family} className="border-b border-slate-100 align-top">
                  <th scope="row" className="py-2 pr-3 font-medium text-slate-800">{row.family}</th>
                  <td className="py-2 pr-3">{row.agency}</td>
                  <td className="py-2 pr-3">{row.rows}</td>
                  <td className="py-2 pr-3">{row.identity}</td>
                  <td className="py-2 pr-3 text-slate-600">{row.limitations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
