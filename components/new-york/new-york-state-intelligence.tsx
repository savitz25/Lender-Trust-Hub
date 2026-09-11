import Link from 'next/link';
import { fmtInt, fmtPct, type NewYorkIntelligenceSnapshot } from '@/lib/new-york-intelligence/snapshot';

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

export function NewYorkStateIntelligenceUnavailable({ reason }: { reason: string }) {
  return (
    <div className="th-shell mx-auto w-full max-w-[880px] overflow-x-clip px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-bold text-[#0A2540]">New York Mortgage Licensing &amp; Lending Intelligence</h1>
      <p className="mt-3 text-sm text-slate-600">{reason}</p>
    </div>
  );
}

export function NewYorkStateIntelligence({ snapshot }: { snapshot: NewYorkIntelligenceSnapshot }) {
  const s = snapshot;
  const A = s.dfs_2024_aggregates;
  const H = s.hmda;
  const B = s.weekly_bulletins.distributions;
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
          <li className="text-slate-800">New York research</li>
        </ol>
      </nav>

      <header className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#047857]">Independent research · New York</p>
        <h1 className="mt-1 break-words text-2xl font-bold text-[#0A2540] sm:text-3xl">
          New York Mortgage Licensing &amp; Lending Intelligence
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          NYDFS Mortgage Banking supervises mortgage bankers, mortgage brokers, mortgage loan
          servicers, and mortgage loan originators as separate classes. 2024 annual-report counts
          are dated official aggregates, not current September 2026 licensees. NMLS Consumer Access
          is the current verification path. This is not a ranking, recommendation, or Trust Score.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          No New York City, borough, or county lender pages are published from this statewide page.
          Banker != broker. Servicer != banker. Company != branch. Company != MLO.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Snapshot {s.contract_name} · fingerprint {s.fingerprint.slice(0, 12)} · retrieved {s.retrieved_at}
        </p>
      </header>

      <section aria-labelledby="hero-metrics" className="mt-8">
        <h2 id="hero-metrics" className="sr-only">
          Snapshot metrics
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            value={fmtInt(A.licensed_mortgage_bankers)}
            label="DFS licensed mortgage bankers"
            hint="End of 2024 annual-report aggregate. Not current 2026 status and not brokers."
          />
          <Metric
            value={fmtInt(A.registered_mortgage_brokers)}
            label="DFS registered mortgage brokers"
            hint="End of 2024. Do not add 151 + 439 as New York lenders."
          />
          <Metric
            value={fmtInt(H.applications)}
            label="HMDA 2025 applications"
            hint="Property location in New York. Not a lender count."
          />
          <Metric
            value={fmtInt(H.originations)}
            label="HMDA 2025 originations"
            hint={`${fmtInt(H.denials)} denials. An origination is not a company.`}
          />
        </div>
      </section>

      <section className="mt-10" aria-labelledby="ny-reg">
        <h2 id="ny-reg" className="text-lg font-semibold text-[#0A2540]">
          New York mortgage regulation
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          The New York State Department of Financial Services Mortgage Banking Unit licenses and
          registers mortgage bankers, brokers, servicers, and MLOs under Banking Law Articles 12-D
          and 12-E. Applications go through NMLS. A depository bank is not a NYDFS mortgage banker
          license.
        </p>
      </section>

      <section className="mt-8" aria-labelledby="ny-verify">
        <h2 id="ny-verify" className="text-lg font-semibold text-[#0A2540]">
          Current licensing verification
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          No clean official bulk CSV/HTML current company roster was acquired. Current banker,
          broker, servicer, and MLO status is search-only. Search-only is not zero. Do not infer
          current population from the 2024 annual-report counts.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>
            <Official href={s.regulators.nmls} label="NMLS Consumer Access" /> — company and MLO verification
          </li>
          <li>
            <Official href={s.regulators.url} label="NYDFS Mortgage Banking" /> — applications and notices
          </li>
          <li>
            FDIC BankFind for depository institutions, which are not NYDFS mortgage bankers
          </li>
        </ul>
      </section>

      <section className="mt-8" aria-labelledby="ny-agg">
        <h2 id="ny-agg" className="text-lg font-semibold text-[#0A2540]">
          DFS dated mortgage-market supervision counts
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          End of 2024 DFS annual-report aggregates: {fmtInt(A.licensed_mortgage_bankers)} licensed
          mortgage bankers, {fmtInt(A.registered_mortgage_brokers)} registered mortgage brokers,{' '}
          {fmtInt(A.registered_mortgage_loan_servicers)} registered mortgage loan servicers, and{' '}
          {fmtInt(A.licensed_mortgage_loan_originators)} licensed MLOs. The 9,769 MLO count is a
          person grain, not lender companies. These four classes must not be added together.
        </p>
      </section>

      <section className="mt-8" aria-labelledby="ny-types">
        <h2 id="ny-types" className="text-lg font-semibold text-[#0A2540]">
          Mortgage banker / broker / servicer distinctions
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          A mortgage banker license is not a mortgage broker registration. A mortgage loan servicer
          is not a mortgage lender. A branch license is not the company. An MLO approval is a person,
          not a lender. Registration is not the same legal term as license where DFS uses both.
        </p>
      </section>

      <section className="mt-8" aria-labelledby="ny-bull">
        <h2 id="ny-bull" className="text-lg font-semibold text-[#0A2540]">
          2026 DFS licensing activity
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {fmtInt(s.weekly_bulletins.bulletin_count)} Weekly Banking Bulletins from{' '}
          {s.weekly_bulletins.window} contain {fmtInt(s.weekly_bulletins.NY_DFS_2026_MORTGAGE_BULLETIN_EVENTS)}{' '}
          classified mortgage-related activity observations. Examples: banker licenses issued{' '}
          {fmtInt(B.banker_issued)}, banker surrendered {fmtInt(B.banker_surrendered)}, banker
          branches issued {fmtInt(B.banker_branch_issued)}, broker certificates issued{' '}
          {fmtInt(B.broker_issued)}, broker surrendered {fmtInt(B.broker_surrendered)}, servicer
          surrenders {fmtInt(B.servicer_surrendered)}, MLO approvals {fmtInt(B.mlo_approval)}, MLO
          withdrawals {fmtInt(B.mlo_withdrawal)}. A bulletin event is not a current roster. An MLO
          approval is not the 9,769 2024 MLO population.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          <Official href={s.weekly_bulletins.source_url} label="Official Weekly Banking Bulletins" />
        </p>
      </section>

      <section className="mt-8" aria-labelledby="ny-enf">
        <h2 id="ny-enf" className="text-lg font-semibold text-[#0A2540]">
          Mortgage enforcement actions
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          The official Mortgage Banking Enforcement Actions table has {fmtInt(s.enforcement.observation_rows)}{' '}
          dated observations ({s.enforcement.date_min} to {s.enforcement.date_max}). Subjects include
          companies and individuals. The HTML table does not print NMLS or NYDFS license IDs, so
          these observations stay unattached. Name-only adverse joins are unsafe. An action is not a
          violation count, not a conviction, and not company quality. Linked PDFs were not downloaded.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          <Official href={s.enforcement.url} label="Official NYDFS Mortgage Banking Enforcement Actions" />
        </p>
      </section>

      <section className="mt-8" aria-labelledby="ny-hmda">
        <h2 id="ny-hmda" className="text-lg font-semibold text-[#0A2540]">
          HMDA New York lending activity
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          2025 HMDA properties in New York: {fmtInt(H.applications)} applications,{' '}
          {fmtInt(H.originations)} originations, {fmtInt(H.denials)} denials (
          {fmtPct(H.denial_rate_pct)}). Purchase {fmtInt(H.purchase_applications)}, refinance{' '}
          {fmtInt(H.refinance_applications)}. Conventional {fmtPct(H.conventional_pct)}, FHA{' '}
          {fmtPct(H.fha_pct)}, VA {fmtPct(H.va_pct)}. {fmtInt(H.county_count)} county rows exist in
          the committed partition; this ticket does not publish county pages. An application is not a
          lender. Property geography is not company headquarters and not license jurisdiction.
        </p>
        <div className="mt-4 space-y-2">
          {[
            ['Conventional applications', H.apps_conventional],
            ['FHA applications', H.apps_fha],
            ['VA applications', H.apps_va],
            ['USDA / other', H.apps_usda_other],
          ].map(([label, n]) => (
            <div key={label}>
              <div className="flex justify-between text-sm">
                <span>{label}</span>
                <span className="tabular-nums">{fmtInt(n as number)}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#0D9488]"
                  style={{ width: `${mixMax > 0 ? Math.max(2, Math.round(((n as number) / mixMax) * 100)) : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="ny-cfpb">
        <h2 id="ny-cfpb" className="text-lg font-semibold text-[#0A2540]">
          CFPB mortgage complaints
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.cfpb.caveat}</p>
        <p className="mt-2 text-sm text-slate-600">
          <Official href={s.cfpb.source_url} label="Official CFPB Consumer Complaint Database" />
        </p>
      </section>

      <section className="mt-8" aria-labelledby="ny-fdic">
        <h2 id="ny-fdic" className="text-lg font-semibold text-[#0A2540]">
          Depository-bank context
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Existing LenderTrustHub FDIC overlay lists {fmtInt(s.fdic.institution_rows)} New York
          depository institutions. An FDIC-insured bank is not a NYDFS mortgage banker license.
        </p>
      </section>

      <section className="mt-8" aria-labelledby="ny-not">
        <h2 id="ny-not" className="text-lg font-semibold text-[#0A2540]">
          What these numbers do not mean
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>151 + 439 is not “how many lenders are in New York.”</li>
          <li>9,769 MLOs are people, not lender companies.</li>
          <li>2024 aggregates are not current 2026 licenses.</li>
          <li>A 2026 bulletin issuance is not a current active universe.</li>
          <li>A surrender event is not an enforcement violation.</li>
          <li>An HMDA application is not a lender.</li>
          <li>A complaint is not a violation.</li>
          <li>An enforcement action is not a conviction.</li>
          <li>Unknown and search-only evidence is not zero.</li>
          <li>No Trust Score, paid ranking, or best/safest/vetted conclusions.</li>
        </ul>
      </section>

      <section className="mt-8" aria-labelledby="ny-gaps">
        <h2 id="ny-gaps" className="text-lg font-semibold text-[#0A2540]">
          Coverage and gaps
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>
            <strong>Grabbed — high yield.</strong> {s.juice_squeeze.GRABBED_HIGH_YIELD.join('; ')}.
          </li>
          <li>
            <strong>Grabbed — easy secondary.</strong> {s.juice_squeeze.GRABBED_EASY_SECONDARY.join('; ')}.
          </li>
          <li>
            <strong>Left — search only.</strong> {s.juice_squeeze.LEFT_SEARCH_ONLY.join('; ')}.
          </li>
          <li>
            <strong>Left — too much work.</strong> {s.juice_squeeze.LEFT_TOO_MUCH_WORK.join('; ')}.
          </li>
          <li>
            <strong>Left — request only.</strong> {s.juice_squeeze.LEFT_REQUEST_ONLY.join('; ')}.
          </li>
          <li>
            <strong>Left — local / future.</strong> {s.juice_squeeze.LEFT_LOCAL_FUTURE.join('; ')}.
          </li>
        </ul>
      </section>
    </div>
  );
}
