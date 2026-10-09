import { StateCountyLinks } from '@/components/mortgage/state-county-links';
import type { Metadata } from "next";
import { SC_LENDER_SNAPSHOT as sc, SC_MORTGAGE_ROSTER } from "@/lib/south-carolina-intelligence/snapshot";
import { SITE_URL } from "@/lib/directory/categories";

export const metadata: Metadata = {
  title: "South Carolina Mortgage Lender/Servicer Licenses | LenderTrustHub",
  description:
    "South Carolina Board of Financial Institutions mortgage lender/servicer license rows from the NMLS file approved as of September 3, 2026. Brokers, branches, originators, and HMDA stay separate.",
  alternates: { canonical: `${SITE_URL}/south-carolina` },
  robots: { index: true, follow: true },
};

const fmt = (n: number) => n.toLocaleString("en-US");
const lic = sc.licensing;

export default function SouthCarolinaPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12 text-slate-900">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">State intelligence · South Carolina Board of Financial Institutions</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">South Carolina mortgage lender/servicer licenses</h1>
      <p className="mt-5 text-lg text-slate-700">
        The Office of the Commissioner of Consumer Finance publishes one NMLS file of SC-BFI Mortgage Lender / Servicer licenses.
        That license name is not split into a lender count and a servicer count. A branch, a mortgage broker, a mortgage loan originator, a supervised consumer lender, and an HMDA observation are different facts.
        This page does not rank lenders and does not publish one South Carolina lender total.
      </p>

      <section className="mt-10 grid gap-4 sm:grid-cols-3" aria-label="South Carolina evidence summary">
        <div className="rounded-xl border p-5">
          <p className="text-sm text-slate-600">Lender/servicer license rows</p>
          <p className="mt-2 text-2xl font-bold">{fmt(lic.licenseRows)}</p>
          <p className="mt-2 text-sm">File clock {sc.sources.fileClock}. One row is one company ID on this license. It is not a broker license and not a branch.</p>
        </div>
        <div className="rounded-xl border p-5">
          <p className="text-sm text-slate-600">Distinct company IDs</p>
          <p className="mt-2 text-2xl font-bold">{fmt(lic.distinctCompanyIds)}</p>
          <p className="mt-2 text-sm">Every company ID on this file appears once. Branches of those companies were not in the file.</p>
        </div>
        <div className="rounded-xl border p-5">
          <p className="text-sm text-slate-600">Approved - Deficient</p>
          <p className="mt-2 text-2xl font-bold">{fmt(lic.approvedDeficientRows)}</p>
          <p className="mt-2 text-sm">{fmt(lic.approvedRows)} rows print Approved. Deficient is a different printed status. It is not repaired into Approved.</p>
        </div>
      </section>

      <section className="mt-12" id="licenses">
        <h2 className="text-2xl font-semibold">Mortgage lender/servicer license file</h2>
        <p className="mt-3 text-slate-700">
          The mortgage lending page links <a className="underline" href={sc.sources.rosterUrl}>{sc.sources.pageLinkLabel}</a>.
          That link label is {sc.sources.pageLinkLabel}. The PDF itself prints Approved as of 09/03/2026. Those are two clocks.
          The PDF title is the workbook name {sc.sources.rosterTitle}. Licenses are issued under the <a className="underline" href={sc.sources.statuteUrl}>Mortgage Lending Act</a>.
          Lookup for a single licensee is <a className="underline" href={sc.sources.licenseeLookup}>search only</a>, and <a className="underline" href={sc.sources.nmlsConsumerAccess}>NMLS Consumer Access</a> is search only.
        </p>
        <p className="mt-3 text-slate-700">
          {fmt(lic.licenseRows)} license rows. {fmt(lic.distinctCompanyIds)} distinct company IDs. Status Approved: {fmt(lic.approvedRows)}. Status Approved - Deficient: {fmt(lic.approvedDeficientRows)}.
          A separate mortgage-lender count was not printed. A separate mortgage-servicer count was not printed. Both stay unknown.
          {fmt(lic.officeAddressInSouthCarolina)} rows print an office address in South Carolina. An office address outside South Carolina does not remove the South Carolina license, and it is not a service area.
        </p>
        <p className="mt-3 text-slate-700">
          Mortgage broker licenses are a different statute and were {lic.brokerRoster}. Branch licenses were {lic.branchRoster}. Mortgage loan originator persons were {lic.originatorRoster}.
          Supervised consumer lenders, deferred presentment, and check cashing were {lic.supervisedLenderRoster}. They are not added to this license file.
          The surety-bond schedule on the mortgage page is a requirement. Current bond compliance was {lic.bondCompliance}.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr>
                <th className="py-2 pr-3">Company ID</th>
                <th className="pr-3">Company</th>
                <th className="pr-3">Office</th>
                <th className="pr-3">Status</th>
                <th>Original license date</th>
              </tr>
            </thead>
            <tbody>
              {SC_MORTGAGE_ROSTER.map((row) => (
                <tr key={row.companyId} className="border-t border-slate-200">
                  <td className="py-2 pr-3">{row.companyId}</td>
                  <td className="pr-3">{row.companyName}</td>
                  <td className="pr-3">{row.city}, {row.officeState}</td>
                  <td className="pr-3">{row.licenseStatus}</td>
                  <td>{row.originalLicenseDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12" id="hmda">
        <h2 className="text-2xl font-semibold">2025 HMDA slice already on file</h2>
        <p className="mt-3 text-slate-700">
          The existing South Carolina HMDA slice is property-market activity for {sc.hmda.year}. It has {fmt(sc.hmda.countyMarketRows)} county-market rows and {fmt(sc.hmda.leiSummaryRows)} LEI summary rows.
          Thirty county rows are not all South Carolina counties, so this page does not publish a statewide application total. A LEI summary row is a reporting identity, not an SC-BFI license.
          HMDA activity is not proof of this license. This license file is not an HMDA observation.
        </p>
      </section>

      <section className="mt-12" id="enforcement">
        <h2 className="text-2xl font-semibold">Examinations and enforcement</h2>
        <p className="mt-3 text-slate-700">
          An examination count was not acquired. An enforcement order corpus was not acquired. Exact canonical attachments: {sc.enforcement.exactCanonicalAttachments}. Name-only adverse joins: {sc.enforcement.nameOnlyAdverseJoins}.
          A missing order corpus is not zero orders. An examination is not an enforcement finding.
        </p>
      </section>

      <section className="mt-12" id="geography">
        <h2 className="text-2xl font-semibold">No city license route</h2>
        <p className="mt-3 text-slate-700">
          Charleston, Columbia, and Greenville are geographic context. This page does not add a city or county route. Existing local-lender marketing pages were not expanded and are not this license roster.
        </p>
      </section>

      <section className="mt-12" id="clocks">
        <h2 className="text-2xl font-semibold">Source clocks and limits</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Page link label: {sc.sources.pageLinkLabel}. PDF clock: {sc.sources.fileClock}. PDF created {sc.sources.pdfCreatedAt}. Retrieved {sc.retrievedAt}.</li>
          <li>Original license dates on the rows run from {lic.earliestOriginalLicenseDate} through {lic.latestOriginalLicenseDate}. An original license date is not the file clock.</li>
          <li>SHA-256 {sc.sources.rosterSha256}. {sc.sources.rosterBytes.toLocaleString("en-US")} bytes. {sc.sources.rosterPages} pages.</li>
          <li>Net-new canonical organizations {sc.newCanonicalOrganizations}. Graph writes {sc.graphWrites}. Claim eligibility changes {sc.claimEligibilityChanges}.</li>
        </ul>
      </section>
      <StateCountyLinks stateSlug="south-carolina" stateName="South Carolina" />
    </main>
  );
}
