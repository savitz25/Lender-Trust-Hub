import Link from 'next/link';
import { fmtInt, fmtPct, type TennesseeIntelligenceSnapshot } from '@/lib/tennessee-intelligence/snapshot';

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

const CLASS_LABEL: Record<string, string> = {
  MORTGAGE_LENDER: 'Mortgage lender (from order text)',
  LICENSE_CLASS_NOT_DETERMINED: 'License class not determined',
  NON_MORTGAGE_BY_TITLE: 'Not mortgage (check cashing or similar, by title)',
};

export function TennesseeStateIntelligenceUnavailable({ reason }: { reason: string }) {
  return (
    <div className="th-shell mx-auto w-full max-w-[880px] overflow-x-clip px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-bold text-[#0A2540]">Tennessee Mortgage Licensing &amp; Lending Intelligence</h1>
      <p className="mt-3 text-sm text-slate-600">{reason}</p>
    </div>
  );
}

export function TennesseeStateIntelligence({ snapshot }: { snapshot: TennesseeIntelligenceSnapshot }) {
  const s = snapshot;
  const E = s.enforcement;
  const H = s.hmda;
  const A = s.existing_coverage_audit;
  const mortgageOrders = E.orders.filter((o) => o.licenseClass.startsWith('MORTGAGE'));
  const undetermined = E.orders.filter((o) => o.licenseClass === 'LICENSE_CLASS_NOT_DETERMINED');
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
          <li className="text-slate-800">Tennessee research</li>
        </ol>
      </nav>
      <header className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#047857]">Independent research · Tennessee · statewide</p>
        <h1 className="mt-1 break-words text-2xl font-bold text-[#0A2540] sm:text-3xl">
          Tennessee Mortgage Licensing &amp; Lending Intelligence
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          The Tennessee Department of Financial Institutions (TDFI) regulates mortgage lenders, mortgage loan brokers,
          mortgage loan servicers, and mortgage loan originators under the Tennessee Residential Lending, Brokerage and
          Servicing Act. Companies apply and renew through NMLS, and TDFI sends the public to NMLS Consumer Access to verify
          a mortgage company or loan originator. NMLS is the licensing system, not the Tennessee regulator. A lender license,
          a broker license, and a servicer license are different licenses; a loan originator is a person; a branch is not a
          company. There is no single “Tennessee lenders” number on this page. Not a ranking, recommendation, or Trust Score.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Snapshot {s.contract_name} · fingerprint {s.fingerprint.slice(0, 12)} · HMDA vintage 2025 · TDFI enforcement index
          retrieved {s.source_as_of.tdfi_enforcement.slice(-20, -10)} · page generated {s.generated_at}.
          Retrieval dates are not license or order dates.
        </p>
      </header>

      <section className="mt-8" aria-labelledby="licenses-heading">
        <h2 id="licenses-heading" className="text-lg font-semibold text-[#0A2540]">
          Tennessee mortgage licenses
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm text-slate-700">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-3">License</th>
                <th className="py-2 pr-3">Unit</th>
                <th className="py-2">Tennessee roster in this hub</th>
              </tr>
            </thead>
            <tbody>
              {s.licenses.classes.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="py-2 pr-3">{c.label}</td>
                  <td className="py-2 pr-3">{c.grain}</td>
                  <td className="py-2">Not acquired — verify on NMLS Consumer Access</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          TDFI does not publish a downloadable list of licensed mortgage companies or loan originators, and this hub does
          not copy NMLS Consumer Access. So there is no Tennessee licensee count here — unknown, not zero. One company can
          hold more than one Tennessee license; it stays one company, identified by its NMLS ID. Reverse-mortgage authority
          and the nonprofit exemption are separate TDFI categories and are not included.{' '}
          <Official href={s.regulators.nmls} label="Verify on NMLS Consumer Access" /> ·{' '}
          <Official href={s.regulators.mortgage} label="TDFI mortgage company licensing" />
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          For context, the hub&apos;s curated list of Tennessee HMDA reporters links {fmtInt(A.curatedRows)} rows to{' '}
          {fmtInt(A.distinctNmls)} NMLS IDs; {fmtInt(A.exactIdentityPublicProfile + A.exactIdentityUnpublishedResearch)} of
          those are exact company identities in LenderTrustHub. That is a list of lenders active in Tennessee HMDA data, not a
          list of Tennessee licensees.
        </p>
      </section>

      <section className="mt-10" aria-labelledby="enf-heading">
        <h2 id="enf-heading" className="text-lg font-semibold text-[#0A2540]">
          TDFI enforcement orders
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          TDFI says: “{E.indexStatement}” Its Enforcement Actions page links {fmtInt(E.ordersListed)} order documents
          (2011, 2014, and 2019–2023). It also lists 2024, 2025, and 2026, but those years have no published pages, so
          orders for them are unknown, not zero. Coverage is PARTIAL.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
          {Object.entries(E.licenseClassCounts).map(([k, n]) => (
            <li key={k}>
              {CLASS_LABEL[k] ?? k}: {n}
            </li>
          ))}
        </ul>
        {mortgageOrders.map((o) => (
          <div key={o.id} className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <p className="font-semibold text-[#0A2540]">
              <Official href={o.sourceUrl ?? s.regulators.enforcement} label={o.titleAsPublished ?? o.orderTypeFromTitle} />
            </p>
            <p className="mt-1">
              Listed under {o.indexYear}. Tennessee license No. {o.tennesseeLicenseNumber} as a mortgage lender (from the order
              text). APD docket {o.apdDocket}. Order entered {o.orderEntered}.
            </p>
            {o.initialOrderLanguage ? (
              <p className="mt-1 text-xs text-slate-500">
                The document is an Initial Order, which states it is not a Final Order but becomes one unless a party seeks
                reconsideration or appeal. TDFI lists it as a Final Order.
              </p>
            ) : null}
            <p className="mt-1 text-xs text-slate-500">
              No NMLS ID is printed, so this order is not linked to an NMLS profile. It is a standalone TDFI record.
            </p>
          </div>
        ))}
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          {undetermined.length} other orders could not be classified: scanned documents have no text layer and were not
          OCR&apos;d, and dismissals do not state a license type. Two are agreed or initial orders of dismissal; a dismissal is
          not a finding. Individual respondents are not named here. Check cashing and similar orders are outside mortgage
          research and are counted only. <Official href={s.regulators.enforcement} label="TDFI Enforcement Actions" />
        </p>
      </section>

      <section className="mt-10" aria-labelledby="complaints-heading">
        <h2 id="complaints-heading" className="text-lg font-semibold text-[#0A2540]">
          Complaints
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          TDFI&apos;s Consumer Resources section takes formal written complaints, including mortgage matters, through an
          online form. TDFI does not publish complaint records by company, so none are shown (request only). That is not a
          zero-complaint finding, and a complaint is not a violation.{' '}
          <Official href={s.regulators.complaintForm} label="File a complaint with TDFI" />
        </p>
      </section>

      <section className="mt-10" aria-labelledby="hmda-heading">
        <h2 id="hmda-heading" className="text-lg font-semibold text-[#0A2540]">
          HMDA 2025 Tennessee activity
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Metric value={fmtInt(H.applications)} label="Applications" hint="For properties in Tennessee. Not lenders." />
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
          application is not a lender and an LEI is not a Tennessee license. Nashville, Memphis, Knoxville, and Chattanooga are
          places in this data, not separate licensing systems.
        </p>
      </section>

      <section className="mt-10" aria-labelledby="limits-heading">
        <h2 id="limits-heading" className="text-lg font-semibold text-[#0A2540]">
          What these numbers do not mean
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Lender ≠ broker ≠ servicer ≠ loan originator ≠ branch. No combined Tennessee lender total.</li>
          <li>No Tennessee licensee roster was acquired. Missing is not zero.</li>
          <li>An Initial Order is not final until it becomes final. A dismissal is not a finding. Unlisted years are unknown.</li>
          <li>HMDA application ≠ licensed lender. HMDA LEI ≠ NMLS ID. Banks are not in mortgage license counts.</li>
          <li>Complaint ≠ violation. No ranking, recommendation, or Trust Score.</li>
        </ul>
      </section>
    </div>
  );
}
