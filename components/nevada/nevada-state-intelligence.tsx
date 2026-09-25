import Link from 'next/link';
import { fmtInt, fmtPct, type NevadaIntelligenceSnapshot } from '@/lib/nevada-intelligence/snapshot';

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

function LicenseTable({ rows, system }: { rows: NevadaIntelligenceSnapshot['licenses']['nmls_classes']; system: string }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm text-slate-700">
        <thead className="text-xs uppercase text-slate-500">
          <tr>
            <th className="py-2 pr-3">License</th>
            <th className="py-2 pr-3">Unit</th>
            <th className="py-2">Nevada roster in this hub</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id} className="border-t border-slate-100">
              <td className="py-2 pr-3">{c.label}</td>
              <td className="py-2 pr-3">{c.grain}</td>
              <td className="py-2">Not acquired — verify on {system}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const CODE_LABEL: Record<string, string> = {
  '645A': 'NRS 645A (escrow agencies and agents)',
  '645B': 'NRS 645B (mortgage companies and loan originators)',
  '645E': 'NRS 645E (as printed; chapter no longer in the current NRS index)',
  '645F': 'NRS 645F (mortgage lending and related professions, incl. servicers)',
};

export function NevadaStateIntelligenceUnavailable({ reason }: { reason: string }) {
  return (
    <div className="th-shell mx-auto w-full max-w-[880px] overflow-x-clip px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-bold text-[#0A2540]">Nevada Mortgage Licensing &amp; Lending Intelligence</h1>
      <p className="mt-3 text-sm text-slate-600">{reason}</p>
    </div>
  );
}

export function NevadaStateIntelligence({ snapshot }: { snapshot: NevadaIntelligenceSnapshot }) {
  const s = snapshot;
  const E = s.enforcement;
  const H = s.hmda;
  const A = s.existing_coverage_audit;
  const R = s.regulators;
  const years = Object.entries(E.rowsByYear).sort((a, b) => Number(b[0]) - Number(a[0]));
  const orders = [...E.orders].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || b.indexYear - a.indexYear);
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
          <li className="text-slate-800">Nevada research</li>
        </ol>
      </nav>
      <header className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#047857]">Independent research · Nevada · statewide</p>
        <h1 className="mt-1 break-words text-2xl font-bold text-[#0A2540] sm:text-3xl">
          Nevada Mortgage Licensing &amp; Lending Intelligence
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          The Nevada Division of Mortgage Lending (MLD), part of the Department of Business &amp; Industry, licenses
          mortgage companies, mortgage loan originators, mortgage servicers, and supplemental mortgage servicers through
          NMLS, and commercial-only mortgage companies and originators, escrow agencies and agents, covered service
          providers, and exempt company registrations through its own SRS portal. NMLS is the licensing system, not the
          Nevada regulator. A mortgage company, a servicer, an escrow agency, and a commercial-only company hold different
          licenses; a loan originator and an escrow agent are people; a branch is not a company. There is no single
          “Nevada lenders” number on this page. Not a ranking, recommendation, or Trust Score.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Snapshot {s.contract_name} · fingerprint {s.fingerprint.slice(0, 12)} · HMDA vintage 2025 · MLD enforcement index
          retrieved {E.indexRetrievedAt.slice(0, 10)} · page generated {s.generated_at}. Retrieval dates are not license or
          order dates.
        </p>
      </header>

      <section className="mt-8" aria-labelledby="regulation-heading">
        <h2 id="regulation-heading" className="text-lg font-semibold text-[#0A2540]">
          Nevada mortgage regulation
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {R.name} administers {R.nrs['645B'].replace('NRS 645B — ', 'NRS 645B (')}), {R.nrs['645F'].replace('NRS 645F — ', 'NRS 645F (')}
          ), and {R.nrs['645A'].replace('NRS 645A — ', 'NRS 645A (')}). {R.nmls_role} {R.srs_role}{' '}
          <Official href={R.home} label="MLD" /> · <Official href={R.searchLicensees} label="MLD: Search Licensees" />
        </p>
      </section>

      <section className="mt-10" aria-labelledby="nmls-heading">
        <h2 id="nmls-heading" className="text-lg font-semibold text-[#0A2540]">
          NMLS mortgage companies, loan originators, and servicers
        </h2>
        <LicenseTable rows={s.licenses.nmls_classes} system="NMLS Consumer Access" />
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          MLD publishes no downloadable list of these licensees, NMLS Consumer Access is a search tool with no bulk file,
          and this hub does not copy it. So there is no Nevada licensee count here — unknown, not zero. A mortgage company
          license covers both lending and brokering in Nevada (older orders print the former Mortgage Broker class); a
          mortgage loan originator is an individual; a Mortgage Servicer license and the Supplemental Mortgage Servicer
          license for companies that already hold a mortgage company license are separate from the company license. One
          company can hold several Nevada licenses; it stays one company, identified by its NMLS ID.{' '}
          <Official href={R.nmls} label="Verify on NMLS Consumer Access" />
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          For context, the hub&apos;s curated list of Nevada HMDA reporters links {fmtInt(A.curatedRows)} rows to{' '}
          {fmtInt(A.distinctNmls)} NMLS IDs; {fmtInt(A.exactIdentityPublicProfile + A.exactIdentityUnpublishedResearch)} of
          those are exact company identities in LenderTrustHub ({fmtInt(A.exactIdentityPublicProfile)} with public profiles)
          and {fmtInt(A.noConfidentMatch)} have no confident match. That is a list of lenders active in Nevada HMDA data,
          not a list of Nevada licensees.
        </p>
      </section>

      <section className="mt-10" aria-labelledby="srs-heading">
        <h2 id="srs-heading" className="text-lg font-semibold text-[#0A2540]">
          Nevada SRS classes: commercial-only, escrow, and exempt registrations
        </h2>
        <LicenseTable rows={s.licenses.srs_classes} system="the MLD SRS public search" />
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          These classes are searched on MLD&apos;s SRS portal, not NMLS Consumer Access. A commercial-only license is not
          consumer mortgage authority. Escrow agencies are companies and escrow agents are individuals under NRS 645A; neither
          is a mortgage company. The SRS search has no export or public API, so no roster was acquired and none of these
          classes is added to any mortgage company figure.{' '}
          <Official href={R.srsPublicSearch} label="MLD SRS public search" />
        </p>
      </section>

      <section className="mt-10" aria-labelledby="hmda-heading">
        <h2 id="hmda-heading" className="text-lg font-semibold text-[#0A2540]">
          HMDA 2025 Nevada activity
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Metric value={fmtInt(H.applications)} label="Applications" hint="For properties in Nevada. Not lenders." />
          <Metric value={fmtInt(H.originations)} label="Originations" hint="Loans made. Not a company count." />
          <Metric
            value={fmtInt(H.denials)}
            label="Denials"
            hint={`${fmtPct(H.denials_as_pct_of_total_applications)} of all applications.`}
          />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {fmtInt(H.county_count)} counties, {fmtInt(H.distinct_leis)} reporting LEIs. Purchase {fmtInt(H.purchase_applications)},
          refinance {fmtInt(H.refinance_applications)}; conventional {fmtInt(H.apps_conventional)}, FHA {fmtInt(H.apps_fha)},
          VA {fmtInt(H.apps_va)}, USDA/other {fmtInt(H.apps_usda_other)}. HMDA is loan activity, not a license list: an
          application is not a lender and an LEI is not a Nevada license. Las Vegas, Reno, and Henderson are places in this
          data, not separate licensing systems. The Nevada partition was reused as accepted, not re-ingested.
        </p>
      </section>

      <section className="mt-10" aria-labelledby="enf-heading">
        <h2 id="enf-heading" className="text-lg font-semibold text-[#0A2540]">
          MLD enforcement orders
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          MLD publishes a Summary of Enforcement Actions with one page per year. The {years.length} pages for 2012–2026 list{' '}
          {fmtInt(E.indexRows)} rows and link {fmtInt(E.documentsLinked)} order documents ({E.rowsWithoutDocumentLink} row has
          no link). Each row is an order document under the name MLD gave it: a consent order is a settlement, a cease-and-desist
          order is not a final adjudication, and an index row is not a finding on its own. Order text was read for{' '}
          {E.documentScopeYears[0]}–{E.documentScopeYears[E.documentScopeYears.length - 1]} only ({fmtInt(E.rowsInDocumentScope)}{' '}
          rows, {fmtInt(E.documentsWithTextLayerInScope)} with a text layer; no OCR). Individual respondents are not named here
          and their document links are withheld.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <p className="font-semibold text-[#0A2540]">By License Type column (NRS chapter as printed)</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {Object.entries(E.licenseCodeCounts).map(([k, n]) => (
                <li key={k}>
                  {CODE_LABEL[k] ?? k}: {n}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <p className="font-semibold text-[#0A2540]">By action type in the published name</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {Object.entries(E.actionTypeFromNameCounts).map(([k, n]) => (
                <li key={k}>
                  {k === 'NOT_STATED_IN_INDEX' ? 'Not stated in the index name' : k}: {n}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Respondents: {E.respondentClassCounts.COMPANY} rows name only a company, {E.respondentClassCounts.COMPANY_AND_PERSON}{' '}
          a company and an individual, {E.respondentClassCounts.PERSON} only an individual. Rows by year:{' '}
          {years.map(([y, n]) => `${y}: ${n}`).join(' · ')}. In {E.documentScopeYears[0]}–
          {E.documentScopeYears[E.documentScopeYears.length - 1]}, {E.rowsWithCompanyCredentialsPrintedInScope} rows print a
          company&apos;s MLD license or NMLS ID ({E.distinctCompanyNmlsPrintedInScope} distinct company NMLS IDs) and{' '}
          {E.individualCredentialsWithheldInScope} individual credentials were withheld. {E.exactNmlsAttachments} row
          {E.exactNmlsAttachments === 1 ? ' matches' : 's match'} an exact LenderTrustHub identity by printed NMLS ID; no row
          is attached by name. Proposed consent orders and settlement agreements: MLD lists “{s.proposed_consent_orders.statement}”
          (retrieved {s.proposed_consent_orders.retrieved_at.slice(0, 10)}); a proposed order is not final discipline.{' '}
          <Official href={R.enforcement} label="MLD Summary of Enforcement Actions" /> ·{' '}
          <Official href={R.proposedConsentOrders} label="Proposed consent orders" />
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm text-slate-700">
            <caption className="sr-only">MLD enforcement index rows, newest first</caption>
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Order No.</th>
                <th className="py-2 pr-3">Chapter</th>
                <th className="py-2 pr-3">Action</th>
                <th className="py-2 pr-3">Respondent as listed</th>
                <th className="py-2">Document</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const doc = o.documents[0];
                return (
                  <tr key={o.id} className="border-t border-slate-100 align-top">
                    <td className="py-2 pr-3 whitespace-nowrap">{o.date ?? o.dateAsPublished}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{o.orderNumber}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{o.licenseCode}</td>
                    <td className="py-2 pr-3">{o.actionTypeFromName === 'NOT_STATED_IN_INDEX' ? '—' : o.actionTypeFromName}</td>
                    <td className="py-2 pr-3">
                      {o.respondentAsPublished ?? 'Individual respondent (name withheld)'}
                      {o.companyCredentialsPrinted
                        ? o.companyCredentialsPrinted.map((c) => (
                            <span key={`${c.nmls}-${c.nevadaLicenseNumber}`} className="block text-xs text-slate-500">
                              {c.licenseClass ? `${c.licenseClass} license No. ${c.nevadaLicenseNumber}` : 'Company'}
                              {c.nmls ? ` · NMLS ${c.nmls}` : ''}
                            </span>
                          ))
                        : null}
                      {o.attachment === 'EXACT_NMLS' ? (
                        <span className="block text-xs text-[#047857]">Exact NMLS match to a LenderTrustHub research identity</span>
                      ) : null}
                    </td>
                    <td className="py-2">
                      {doc?.url ? <Official href={doc.url} label="Order (PDF)" /> : doc ? 'Link withheld' : 'No link'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="complaints-heading">
        <h2 id="complaints-heading" className="text-lg font-semibold text-[#0A2540]">
          Complaints
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {s.complaints.intakeNote} MLD does not publish complaint records by company, so none are shown (request only).
          That is not a zero-complaint finding, and a complaint is not a violation.{' '}
          <Official href={R.complaints} label="Submit a complaint to MLD" />
        </p>
      </section>

      <section className="mt-10" aria-labelledby="limits-heading">
        <h2 id="limits-heading" className="text-lg font-semibold text-[#0A2540]">
          What these numbers do not mean
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Mortgage company ≠ loan originator ≠ servicer ≠ escrow agency ≠ escrow agent ≠ commercial-only ≠ branch. No combined Nevada lender total.</li>
          <li>No Nevada licensee roster was acquired from NMLS or SRS. Missing is not zero.</li>
          <li>A consent order is a settlement, a proposed consent order is not final, and an index row is not a finding. The License Type column is the chapter MLD printed.</li>
          <li>HMDA application ≠ licensed lender. HMDA LEI ≠ NMLS ID. The {fmtInt(s.depository.fdic_rows)} FDIC-insured Nevada banks are not in mortgage license counts.</li>
          <li>Complaint ≠ violation. No ranking, recommendation, or Trust Score.</li>
        </ul>
      </section>
    </div>
  );
}
