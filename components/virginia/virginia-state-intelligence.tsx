import Link from 'next/link';
import { VirginiaCountyTable } from '@/components/virginia/county-table';
import { Trace } from '@/components/new-jersey/trace';
import { fmtInt, fmtPct, type VirginiaIntelligenceSnapshot } from '@/lib/virginia-intelligence/snapshot';

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

export function VirginiaStateIntelligenceUnavailable({ reason }: { reason: string }) {
  return (
    <div className="th-shell mx-auto w-full max-w-[880px] overflow-x-clip px-4 py-8 sm:py-10">
      <header className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#047857]">
          Independent research · Virginia
        </p>
        <h1 className="mt-1 break-words text-2xl font-bold text-[#0A2540] sm:text-3xl">
          Virginia Mortgage Licensing &amp; Lending Intelligence
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          The current published Virginia intelligence snapshot is unavailable.
        </p>
        <p className="mt-2 text-sm text-slate-600">{reason}</p>
      </header>
    </div>
  );
}

export function VirginiaStateIntelligence({
  snapshot,
}: {
  snapshot: VirginiaIntelligenceSnapshot;
}) {
  const s = snapshot;
  const H = s.hmda;
  const R = s.scc_roster;
  const mixMax = Math.max(H.apps_conventional, H.apps_fha, H.apps_va, H.apps_usda_other);
  const purposeMax = Math.max(H.purchase_applications, H.refinance_applications, H.purpose_other_applications);

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
          <li className="text-slate-800">Virginia research</li>
        </ol>
      </nav>

      <header className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#047857]">
          Independent research · Virginia
        </p>
        <h1 className="mt-1 break-words text-2xl font-bold text-[#0A2540] sm:text-3xl">
          Virginia Mortgage Licensing &amp; Lending Intelligence
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          Virginia SCC Bureau of Financial Institutions licenses mortgage brokers, mortgage lenders,
          and mortgage lender-and-brokers as separate credentials. The 2025 annual report is dated
          official evidence as of 2025-12-31, not current September 2026 status. NMLS Consumer Access
          is the current verification path. This is not a ranking, recommendation, or Trust Score.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          No Fairfax, Arlington, Richmond, or Virginia Beach lender pages are published from this
          statewide page. Broker != lender. Company != office. Company != MLO.
        </p>
      </header>

      <section aria-labelledby="hero-metrics" className="mt-8">
        <h2 id="hero-metrics" className="sr-only">
          Snapshot metrics
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            value={fmtInt(R.scc_reported.brokers_companies)}
            label="SCC mortgage brokers"
            hint="Companies as of 2025-12-31. Not MLOs and not current 2026 status."
          />
          <Metric
            value={fmtInt(R.scc_reported.lenders_companies)}
            label="SCC mortgage lenders"
            hint="As of 2025-12-31. Not the same as brokers or lender-brokers."
          />
          <Metric
            value={fmtInt(R.scc_reported.lender_brokers_companies)}
            label="SCC lender-and-brokers"
            hint="As of 2025-12-31. Do not add these three as “Virginia lenders.”"
          />
          <Metric
            value={fmtInt(H.applications)}
            label="HMDA 2025 applications"
            hint="Property location in Virginia. Not a lender count."
          />
        </div>
      </section>

      <section aria-labelledby="license-heading" className="mt-10">
        <h2 id="license-heading" className="text-lg font-semibold text-[#0A2540]">
          Who regulates mortgage companies in Virginia?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{R.caveat}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Identity is {R.identity} with exact {R.federal_identity} when SCC prints both numbers.
          The parsed list has {fmtInt(R.rows)} dated company rows, {fmtInt(R.exact_va_to_nmls_crosswalks)}{' '}
          exact VA-license → NMLS crosswalks, {fmtInt(R.distinct_virginia_mc)} distinct MC numbers, and{' '}
          {fmtInt(R.distinct_nmls)} distinct NMLS IDs. Duplicate MC numbers: {R.duplicate_mc.length}.
          Duplicate NMLS IDs: {R.duplicate_nmls.length}. Missing NMLS IDs: {R.missing_nmls}.
        </p>
        <p className="mt-2 text-sm text-slate-600">{R.list_vs_narrative.note}</p>
      </section>

      <section aria-labelledby="verify-heading" className="mt-10">
        <h2 id="verify-heading" className="text-lg font-semibold text-[#0A2540]">
          How can I verify this lender?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.live_roster.caveat}</p>
        <p className="mt-2 text-sm text-slate-600">
          Live 2026 licensed-company denominator: {s.live_roster.live_licensed_company_denominator} /
          SOURCE_NOT_ACQUIRED. NMLS verification is not a claimed profile. Search-only is not zero.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>
            <a href={s.live_roster.nmls_consumer_access} className="text-[#047857] underline underline-offset-2">
              NMLS Consumer Access
            </a>
          </li>
          <li>
            <a href={R.source_url} className="text-[#047857] underline underline-offset-2">
              SCC 2025 mortgage annual report
            </a>
          </li>
        </ul>
      </section>

      <section aria-labelledby="types-heading" className="mt-10">
        <h2 id="types-heading" className="text-lg font-semibold text-[#0A2540]">
          Broker vs lender vs lender-broker
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          These are regulatory license categories, not quality grades and not loan-product specialties.
          Consumer-facing umbrella “Virginia mortgage companies” is only a research label.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Metric value={fmtInt(R.scc_reported.brokers_companies)} label="Brokers" hint={`${fmtInt(R.scc_reported.brokers_offices)} offices in the SCC narrative.`} />
          <Metric value={fmtInt(R.scc_reported.lenders_companies)} label="Lenders" hint={`${fmtInt(R.scc_reported.lenders_offices)} offices in the SCC narrative.`} />
          <Metric value={fmtInt(R.scc_reported.lender_brokers_companies)} label="Lender-and-brokers" hint={`${fmtInt(R.scc_reported.lender_brokers_offices)} offices in the SCC narrative.`} />
        </div>
        <p className="mt-3 text-sm text-slate-600">{s.offices.caveat}</p>
        <p className="mt-2 text-sm text-slate-600">
          SCC also reported {fmtInt(s.mlo_person.persons)} mortgage loan originators as of 2025-12-31.
          That is person grain. MLO != lender company. No Virginia MLO public directory is published.
        </p>
      </section>

      <section aria-labelledby="status-heading" className="mt-10">
        <h2 id="status-heading" className="text-lg font-semibold text-[#0A2540]">
          2025 status-change observations
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          These are 2025 aggregates, not current license status, not complaint counts, not violation
          counts, and not unique bad actors.
        </p>
        <div className="mt-4 min-w-0 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3">License type</th>
                <th className="py-2 pr-3 text-right">Approvals</th>
                <th className="py-2 pr-3 text-right">Withdrawn / abandoned</th>
                <th className="py-2 pr-3 text-right">Denials</th>
                <th className="py-2 pr-3 text-right">Surrendered / expired</th>
                <th className="py-2 pr-3 text-right">Revocations</th>
              </tr>
            </thead>
            <tbody>
              {s.status_changes_2025.rows.map((row) => (
                <tr key={row.license_type} className="border-b border-slate-100">
                  <th className="py-2 pr-3 font-medium text-slate-800">{row.license_type}</th>
                  <td className="py-2 pr-3 text-right tabular-nums">{fmtInt(row.approvals)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{fmtInt(row.withdrawn_abandoned)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{fmtInt(row.denials)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{fmtInt(row.surrendered_expired)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{fmtInt(row.revocations)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-slate-600">{s.enforcement.caveat}</p>
      </section>

      <section aria-labelledby="hmda-heading" className="mt-10">
        <h2 id="hmda-heading" className="text-lg font-semibold text-[#0A2540]">
          How active is mortgage lending in Virginia?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{H.caveat}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Metric value={fmtInt(H.applications)} label="Applications" hint="HMDA 2025, properties in Virginia." />
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
          grain={`State overlay from ${fmtInt(H.county_count)} county and independent-city rows`}
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
        <VirginiaCountyTable counties={H.counties} />
      </section>

      <section aria-labelledby="cfpb-heading" className="mt-10">
        <h2 id="cfpb-heading" className="text-lg font-semibold text-[#0A2540]">
          Virginia mortgage complaints — CFPB observations
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.cfpb.caveat}</p>
        <Metric
          value={fmtInt(s.cfpb.mortgage_complaint_rows)}
          label="CFPB Virginia mortgage complaint rows"
          hint="Complaint != violation. Not a company ranking."
        />
      </section>

      <section aria-labelledby="vh-heading" className="mt-10">
        <h2 id="vh-heading" className="text-lg font-semibold text-[#0A2540]">
          What assistance programs are available?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.programs.caveat}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {s.programs.items.map((item) => (
            <li key={item.id}>
              <a href={item.url} className="text-[#047857] underline underline-offset-2">
                {item.name}
              </a>
              {item.status !== 'CURRENT' ? ` (${item.status})` : ''}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="does-not-mean-heading" className="mt-10">
        <h2 id="does-not-mean-heading" className="text-lg font-semibold text-[#0A2540]">
          What this page does not mean
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
          <li>It does not say Virginia has one “lenders” count such as 1,257 current lenders.</li>
          <li>Dated SCC rows are not current 2026 licenses. NMLS verification is not a claimed profile.</li>
          <li>24,222 MLOs are people, not companies.</li>
          <li>HMDA applications are not lenders. CFPB complaints are not violations.</li>
          <li>Virginia Housing programs are not licenses. Search-only is not zero. No Trust Score.</li>
        </ul>
      </section>
    </div>
  );
}
