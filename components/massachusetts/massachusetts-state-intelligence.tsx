import Link from 'next/link';
import { fmtInt, fmtPct, type MassachusettsIntelligenceSnapshot } from '@/lib/massachusetts-intelligence/snapshot';
import type { MaDobCredential, MaLookupResult } from '@/lib/massachusetts-intelligence/lookup';

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

const FAMILY_LABEL: Record<string, string> = {
  CONSENT_ORDER: 'Consent Order',
  SETTLEMENT_AGREEMENT: 'Settlement Agreement',
  TEMPORARY_ORDER_TO_CEASE_AND_DESIST: 'Temporary Order to Cease and Desist',
  NOTICE_OF_ADMINISTRATIVE_PENALTY: 'Notice of Administrative Penalty',
  ORDER_OF_SUSPENSION: 'Order of Suspension',
  ORDER_OF_REVOCATION: 'Order of Revocation',
  ORDER_TO_SHOW_CAUSE: 'Order to Show Cause',
};

function Credential({ label, cred }: { label: string; cred: MaDobCredential }) {
  return (
    <li>
      <span className="font-medium text-slate-800">{label}</span> — license {cred.lic.join(', ')}; main office {cred.city},{' '}
      {cred.st}; {fmtInt(cred.branches)} branch license rows ({fmtInt(cred.branchesMA)} in Massachusetts)
      {cred.tradeNameRows ? `; ${cred.tradeNameRows} other trade name rows` : ''}.
    </li>
  );
}

function LookupPanel({ result, asOf }: { result: MaLookupResult | null; asOf: string }) {
  return (
    <section className="mt-10" aria-labelledby="lookup-heading">
      <h2 id="lookup-heading" className="text-lg font-semibold text-[#0A2540]">
        Look up a company by NMLS ID or Massachusetts license number
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Exact identifier match against the DOB mortgage lender and mortgage broker files as of {asOf}. No name matching.
        Loan originator (MLO) license numbers are a person grain and are not looked up here; verify an individual on NMLS
        Consumer Access.
      </p>
      <form method="get" action="/massachusetts#lookup-heading" className="mt-3 flex flex-wrap gap-2">
        <label htmlFor="ma-lookup" className="sr-only">
          NMLS ID or Massachusetts license number
        </label>
        <input
          id="ma-lookup"
          name="id"
          defaultValue={result?.query ?? ''}
          placeholder="e.g. 3029 or MC3029"
          maxLength={40}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-[#0A2540] px-4 py-2 text-sm font-semibold text-white">
          Look up
        </button>
      </form>
      {result ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700" data-testid="ma-lookup-result">
          {result.kind === 'company' ? (
            <>
              <p className="font-semibold text-[#0A2540]">
                {result.company.name} · NMLS {result.company.n}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Listed by DOB as approved and authorized as of {asOf}. Not current status after that date; confirm on NMLS
                Consumer Access.
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {result.company.lender ? <Credential label="MA Mortgage Lender License" cred={result.company.lender} /> : null}
                {result.company.broker ? <Credential label="MA Mortgage Broker License" cred={result.company.broker} /> : null}
              </ul>
            </>
          ) : result.kind === 'not_on_file' ? (
            <p>
              “{result.query}” is not on the DOB mortgage lender or broker file as of {asOf}. That is not proof the company
              is unlicensed today, and it may be a bank or credit union, which these files do not cover. Check NMLS Consumer
              Access.
            </p>
          ) : result.kind === 'person_grain' ? (
            <p>
              That looks like a loan originator license number. MLOs are individuals; this page does not publish person
              lookups. Verify the individual on NMLS Consumer Access.
            </p>
          ) : (
            <p>Enter an NMLS ID (digits) or a Massachusetts company license number such as MC3029, ML10287, or MB4368.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}

export function MassachusettsStateIntelligenceUnavailable({ reason }: { reason: string }) {
  return (
    <div className="th-shell mx-auto w-full max-w-[880px] overflow-x-clip px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-bold text-[#0A2540]">Massachusetts Mortgage Licensing &amp; Lending Intelligence</h1>
      <p className="mt-3 text-sm text-slate-600">{reason}</p>
    </div>
  );
}

export function MassachusettsStateIntelligence({
  snapshot,
  lookup,
}: {
  snapshot: MassachusettsIntelligenceSnapshot;
  lookup: MaLookupResult | null;
}) {
  const s = snapshot;
  const L = s.licenses;
  const E = s.enforcement;
  const H = s.hmda;
  const cities = Object.entries(L.city_filters.cities);
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
          <li className="text-slate-800">Massachusetts research</li>
        </ol>
      </nav>
      <header className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#047857]">Independent research · Massachusetts · statewide</p>
        <h1 className="mt-1 break-words text-2xl font-bold text-[#0A2540] sm:text-3xl">
          Massachusetts Mortgage Licensing &amp; Lending Intelligence
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          The Massachusetts Division of Banks (DOB) licenses mortgage lenders, mortgage brokers, and mortgage loan
          originators. DOB runs those licenses through NMLS, which is the licensing system and public verification tool —
          not a federal-only list and not the regulator. DOB publishes quarterly Excel lists of approved licensees; this page
          uses the lists dated {L.source_as_of}. A mortgage lender license and a mortgage broker license are different
          licenses, a company is not a loan originator, and a branch is not a company. There is no single “Massachusetts
          lenders” number on this page. Not a ranking, recommendation, or Trust Score.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Snapshot {s.contract_name} · fingerprint {s.fingerprint.slice(0, 12)} · DOB licensee files as of {L.source_as_of}{' '}
          (retrieved {L.retrieved_at.slice(0, 10)}) · DOB enforcement table retrieved {E.retrieved_at.slice(0, 10)} · HMDA
          vintage 2025 · page generated {s.generated_at}. The file date is not a license expiration date and the retrieval
          date is not a license effective date.
        </p>
      </header>

      <section aria-labelledby="hero-metrics" className="mt-8">
        <h2 id="hero-metrics" className="sr-only">
          License populations
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Metric
            value={fmtInt(L.lender.distinct_company_nmls_ids)}
            label="Companies on the DOB mortgage lender file"
            hint={`Distinct NMLS company IDs, as of ${L.source_as_of}. ${fmtInt(L.lender.total_rows)} rows including ${fmtInt(L.lender.branch_license_rows)} branch rows.`}
          />
          <Metric
            value={fmtInt(L.broker.distinct_company_nmls_ids)}
            label="Companies on the DOB mortgage broker file"
            hint={`Distinct NMLS company IDs, as of ${L.source_as_of}. ${fmtInt(L.broker.total_rows)} rows including ${fmtInt(L.broker.branch_license_rows)} branch rows.`}
          />
          <Metric
            value={fmtInt(L.mlo.distinct_person_nmls_ids)}
            label="Individuals on the DOB loan originator file"
            hint={`Distinct individual NMLS IDs across ${fmtInt(L.mlo.rows)} rows. People, not companies.`}
          />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          These counts use different units and must not be added. {fmtInt(L.cross_file.companies_holding_lender_and_broker)}{' '}
          companies hold both a lender and a broker license, so they appear on both files as one company with two licenses.
        </p>
      </section>

      <section className="mt-10" aria-labelledby="grains-heading">
        <h2 id="grains-heading" className="text-lg font-semibold text-[#0A2540]">
          What each DOB file contains
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm text-slate-700">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-3">File</th>
                <th className="py-2 pr-3">Unit</th>
                <th className="py-2 pr-3 text-right">Company license rows</th>
                <th className="py-2 pr-3 text-right">Branch rows</th>
                <th className="py-2 pr-3 text-right">Trade-name rows</th>
                <th className="py-2 text-right">Total rows</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-100">
                <td className="py-2 pr-3">Mortgage lender</td>
                <td className="py-2 pr-3">Company license</td>
                <td className="py-2 pr-3 text-right tabular-nums">{fmtInt(L.lender.company_license_rows)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{fmtInt(L.lender.branch_license_rows)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{fmtInt(L.lender.trade_name_rows)}</td>
                <td className="py-2 text-right tabular-nums">{fmtInt(L.lender.total_rows)}</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="py-2 pr-3">Mortgage broker</td>
                <td className="py-2 pr-3">Company license</td>
                <td className="py-2 pr-3 text-right tabular-nums">{fmtInt(L.broker.company_license_rows)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{fmtInt(L.broker.branch_license_rows)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{fmtInt(L.broker.trade_name_rows)}</td>
                <td className="py-2 text-right tabular-nums">{fmtInt(L.broker.total_rows)}</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="py-2 pr-3">Mortgage loan originator</td>
                <td className="py-2 pr-3">Individual license</td>
                <td className="py-2 pr-3 text-right text-slate-400">—</td>
                <td className="py-2 pr-3 text-right text-slate-400">—</td>
                <td className="py-2 pr-3 text-right text-slate-400">—</td>
                <td className="py-2 text-right tabular-nums">{fmtInt(L.mlo.rows)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>
            Each company is keyed by its NMLS company ID. The lender and broker files list {fmtInt(L.cross_file.distinct_company_nmls_ids_any_file)}{' '}
            distinct companies between them: {fmtInt(L.cross_file.companies_lender_only)} lender only,{' '}
            {fmtInt(L.cross_file.companies_broker_only)} broker only, {fmtInt(L.cross_file.companies_holding_lender_and_broker)} both.
            That is a count of companies on two license files, not of all Massachusetts mortgage lenders: banks and credit
            unions do not need these licenses.
          </li>
          <li>
            Branch rows carry an NMLS branch ID ({fmtInt(L.cross_file.distinct_nmls_branch_ids_any_file)} distinct branch IDs across
            both files, {fmtInt(L.cross_file.nmls_branch_ids_on_both_files)} on both). A branch is a location of a company, not
            another company. Main-office addresses were not turned into branches.
          </li>
          <li>
            “Other Trade Name” rows record additional names a company uses under the same license. They are not extra
            companies. The files do not give the trade name itself.
          </li>
          <li>
            The files do not include issue dates, expiration dates, or a status column. DOB says listed businesses are
            approved and authorized to do business in Massachusetts as of the file date.
          </li>
          <li>
            The loan originator file lists the sponsoring company by name only, with no company NMLS ID. Originators are not
            linked to companies here, and there are no public originator pages.
          </li>
        </ul>
      </section>

      <LookupPanel result={lookup} asOf={L.source_as_of} />

      <section className="mt-10" aria-labelledby="cities-heading">
        <h2 id="cities-heading" className="text-lg font-semibold text-[#0A2540]">
          Licensed locations by city
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Boston, Worcester, and Springfield are filters on the one statewide DOB population, not separate licensing
          systems. A company counts for a city if DOB lists its main office or a licensed branch at an address there. An
          address is not a service area: licensed companies can lend anywhere in Massachusetts.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm text-slate-700">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-3">City</th>
                <th className="py-2 pr-3 text-right">Lender-file companies</th>
                <th className="py-2 pr-3 text-right">Lender branch rows</th>
                <th className="py-2 pr-3 text-right">Broker-file companies</th>
                <th className="py-2 text-right">Broker branch rows</th>
              </tr>
            </thead>
            <tbody>
              {cities.map(([city, v]) => (
                <tr key={city} className="border-t border-slate-100">
                  <td className="py-2 pr-3">{city}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{fmtInt(v.lender.companies_with_any_licensed_location_in_city)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{fmtInt(v.lender.branch_license_rows_in_city)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{fmtInt(v.broker.companies_with_any_licensed_location_in_city)}</td>
                  <td className="py-2 text-right tabular-nums">{fmtInt(v.broker.branch_license_rows_in_city)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="enf-heading">
        <h2 id="enf-heading" className="text-lg font-semibold text-[#0A2540]">
          DOB mortgage enforcement actions, 2021–2026
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {fmtInt(E.mortgage_related_events)} rows from the DOB enforcement table where the entity type includes a mortgage
          lender, broker, loan originator, or servicer. Coverage is PARTIAL: earlier years are on the DOB page but not
          included here. Each row is one DOB action, shown with DOB’s own action name. A temporary order or an order to show
          cause is not a final order, and a consent order or settlement is not a TrustHub finding; the order documents were
          not parsed, so any admission or denial language is unknown here. An action is linked to a company only when DOB
          printed that company’s NMLS number ({fmtInt(E.exact_company_nmls_attachments)} company links). Individual
          respondents are counted ({fmtInt(E.person_party_rows)}) but not named on this site; the DOB page is the source.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm text-slate-700">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">DOB action</th>
                <th className="py-2 pr-3">Respondent</th>
                <th className="py-2 pr-3">Entity type</th>
                <th className="py-2">Status note</th>
              </tr>
            </thead>
            <tbody>
              {E.events.map((e) => (
                <tr key={e.event_id} className="border-t border-slate-100 align-top">
                  <td className="py-2 pr-3 whitespace-nowrap tabular-nums">{e.action_date}</td>
                  <td className="py-2 pr-3">
                    {e.order_url ? <Official href={e.order_url} label={e.regulatory_action_raw} /> : e.regulatory_action_raw}
                  </td>
                  <td className="py-2 pr-3">
                    {e.parties.map((p, i) => (
                      <span key={i} className="block">
                        {p.respondent_class === 'COMPANY'
                          ? `${p.name_as_published}${p.nmls_printed ? ` (NMLS ${p.nmls_printed})` : ''}`
                          : 'Individual (not named here)'}
                      </span>
                    ))}
                  </td>
                  <td className="py-2 pr-3">{e.entity_type_raw}</td>
                  <td className="py-2 text-xs text-slate-500">{e.related_raw || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Action types in this window:{' '}
          {Object.entries(E.action_families)
            .map(([k, n]) => `${FAMILY_LABEL[k] ?? k} ${n}`)
            .join(' · ')}
          . Source: <Official href={E.source_page} label="Enforcement actions issued by the Division of Banks" />
        </p>
      </section>

      <section className="mt-10" aria-labelledby="complaints-heading">
        <h2 id="complaints-heading" className="text-lg font-semibold text-[#0A2540]">
          Complaints
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          DOB’s Consumer Assistance Unit takes complaints about the mortgage lenders, brokers, and loan originators it
          licenses. DOB does not publish complaint records by company, so none are shown (not acquired; request only). That
          is not a zero-complaint finding. CFPB complaints are a separate federal dataset and are not used as DOB findings. A
          complaint is not a violation. <Official href={s.regulators.complaints} label="File a complaint with DOB" />
        </p>
      </section>

      <section className="mt-10" aria-labelledby="hmda-heading">
        <h2 id="hmda-heading" className="text-lg font-semibold text-[#0A2540]">
          HMDA 2025 Massachusetts activity
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {fmtInt(H.applications)} applications, {fmtInt(H.originations)} originations, and {fmtInt(H.denials)} denials for
          properties in Massachusetts ({fmtPct(H.denials_as_pct_of_total_applications)} of all applications were denied)
          across {fmtInt(H.county_count)} counties, reported by {fmtInt(H.distinct_leis)} distinct LEIs. Purchase{' '}
          {fmtInt(H.purchase_applications)}, refinance {fmtInt(H.refinance_applications)}; conventional {fmtInt(H.apps_conventional)},
          FHA {fmtInt(H.apps_fha)}, VA {fmtInt(H.apps_va)}. HMDA is loan activity, not a license list: an application is not a
          lender, and an HMDA LEI is not a Massachusetts license. Banks and credit unions report HMDA without DOB mortgage
          licenses.
        </p>
      </section>

      <section className="mt-10" aria-labelledby="verify-heading">
        <h2 id="verify-heading" className="text-lg font-semibold text-[#0A2540]">
          Verify and sources
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>
            <Official href={s.regulators.licensees} label="DOB approved licensee lists (Excel, quarterly)" />
          </li>
          <li>
            <Official href={s.regulators.verify} label="DOB: verify a licensee through NMLS" /> ·{' '}
            <Official href={s.regulators.nmls} label="NMLS Consumer Access" />
          </li>
          <li>
            <Official href={s.regulators.enforcement} label="DOB enforcement actions" />
          </li>
          <li>
            <Official href={s.regulators.consumer} label="DOB consumer information on lenders, brokers, and originators" />
          </li>
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="limits-heading">
        <h2 id="limits-heading" className="text-lg font-semibold text-[#0A2540]">
          What these numbers do not mean
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Lender license ≠ broker license. Company ≠ loan originator. Branch ≠ company. Trade-name row ≠ company.</li>
          <li>The {L.source_as_of} files are not current status after that date. Missing from a file is not proof of anything.</li>
          <li>HMDA application ≠ licensed lender. HMDA LEI ≠ Massachusetts license. Banks are not in these license counts.</li>
          <li>An enforcement row is an event, not a rating. Temporary and show-cause orders are not final orders.</li>
          <li>Complaint ≠ violation. No DOB complaint records are published.</li>
          <li>No combined Massachusetts lender total, no Trust Score, and no rankings of any kind.</li>
        </ul>
      </section>
    </div>
  );
}
