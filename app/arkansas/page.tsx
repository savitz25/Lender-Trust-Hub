import type { Metadata } from "next";
import { AR_COMPANY_LICENSES, AR_MLO_STATUSES, ARKANSAS_SNAPSHOT as ar } from "@/lib/arkansas-intelligence/snapshot";
import { SITE_URL } from "@/lib/directory/categories";

export const metadata: Metadata = {
  title: "Arkansas Mortgage Companies, Branches, and Loan Officers | LenderTrustHub",
  description: "The Arkansas Securities Department workbook, labeled as of September 1, 2026, has 683 approved company rows, 1,536 branch rows, and 11,239 mortgage loan officer persons. Those populations are not added. 2025 HMDA applications on Arkansas property are 116,797 across 75 counties and are not licenses.",
  alternates: { canonical: `${SITE_URL}/arkansas` },
  robots: { index: true, follow: true },
};

const fmt = (n: number) => n.toLocaleString("en-US");

export default function ArkansasLenderPage() {
  const companies = ar.companies;
  const branches = ar.branches;
  const officers = ar.mortgageLoanOfficers;
  return <main className="mx-auto max-w-5xl px-5 py-12 text-slate-900">
    <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">State intelligence · Arkansas Securities Department</p>
    <h1 className="mt-3 text-4xl font-bold tracking-tight">Arkansas mortgage licensing and lending evidence</h1>
    <p className="mt-5 text-lg text-slate-700">The Department licenses mortgage brokers, mortgage bankers, mortgage servicers, and mortgage loan officers under the Arkansas Fair Mortgage Lending Act. Its published workbook keeps company rows, branch locations, and loan officer persons on separate sheets. A company, a branch, a person, an NMLS identity, and an HMDA application stay separate. This page does not rank lenders and does not publish one Arkansas lender total.</p>

    <section className="mt-10 grid gap-4 sm:grid-cols-3" aria-label="Arkansas evidence summary">
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">Company license rows</p><p className="mt-2 text-2xl font-bold">{fmt(companies.rows)}</p><p className="mt-2 text-sm">{fmt(companies.companyIds)} company IDs. All {fmt(companies.licenseStatusApproved)} print Approved. Four license names stay split below. This is not a branch count and not a loan-officer count.</p></div>
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">Branch location rows</p><p className="mt-2 text-2xl font-bold">{fmt(branches.rows)}</p><p className="mt-2 text-sm">{fmt(branches.branchIds)} branch IDs across {fmt(branches.companyIds)} company IDs. A branch is not a company. The sheet has no license-status column.</p></div>
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">Mortgage loan officer persons</p><p className="mt-2 text-2xl font-bold">{fmt(officers.rows)}</p><p className="mt-2 text-sm">{fmt(officers.individualIds)} individual IDs. Persons are not companies. Names are not republished here.</p></div>
    </section>

    <section className="mt-12" id="companies"><h2 className="text-2xl font-semibold">Company sheet</h2>
      <p className="mt-3 text-slate-700">The <a className="underline" href={ar.sources.nmlsPage}>Arkansas Securities Department NMLS page</a> labels the list of licensed mortgage companies, branches, and loan officers {ar.sources.pageLabel}. The workbook is the Department media file <a className="underline" href={ar.sources.workbook}>Licensed Mortgage Companies, Branches, and MLOs</a>. The company sheet has {fmt(companies.rows)} data rows and {fmt(companies.companyIds)} company IDs. Every row prints License Status Approved. The four license names are the source&apos;s own classes. They are not added into a lender census, and they are not added to the branch or person sheets.</p>
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><caption className="mb-2 text-left">Company-sheet license names. Each row is one company ID. Not branches and not persons.</caption><thead><tr><th className="py-2 pr-3">License name</th><th>Company rows</th></tr></thead><tbody>
        {AR_COMPANY_LICENSES.map((row) => <tr key={row.licenseName} className="border-t"><td className="py-2 pr-3">{row.licenseName}</td><td>{fmt(row.rows)}</td></tr>)}
      </tbody></table></div>
      <p className="mt-3 text-slate-700">{fmt(companies.officeStateArkansas)} company rows list an Arkansas street state. That address fact is not the license count. A company can hold an Arkansas license and list an office in another state. The workbook tells readers to verify current license status at <a className="underline" href={ar.sources.nmlsConsumerAccess}>NMLS Consumer Access</a>. An application through Form MU1 is not a row on this approved list. Control-person Form MU2 records were <strong>NOT_ACQUIRED</strong>.</p>
    </section>

    <section className="mt-12" id="branches"><h2 className="text-2xl font-semibold">Branch locations</h2>
      <p className="mt-3 text-slate-700">The branch sheet has {fmt(branches.rows)} location rows, {fmt(branches.branchIds)} branch IDs, and {fmt(branches.companyIds)} company IDs. The license-name column repeats the company license name. It is not a second company census and it is not added to the {fmt(companies.rows)} company rows. The sheet does not print a branch license status. {fmt(branches.streetStateArkansas)} branch rows list an Arkansas street state. That is not the branch count. A branch address is not a service area. Form MU3 is the branch application form. An application is not this location list.</p>
    </section>

    <section className="mt-12" id="officers"><h2 className="text-2xl font-semibold">Mortgage loan officers</h2>
      <p className="mt-3 text-slate-700">The mortgage loan officer sheet has {fmt(officers.rows)} person rows and {fmt(officers.individualIds)} individual IDs. Every license name is {officers.licenseName}. Sponsoring-company IDs on this sheet number {fmt(officers.sponsoringCompanyIds)}. That sponsor count is not the {fmt(companies.rows)} company-sheet count, and this page does not join a person to a company. Person names are not republished. A person is not a company. Approved - Inactive is still a status on this sheet. It is not removed from the person count and it is not treated as a denial of the other statuses.</p>
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[420px] text-left text-sm"><caption className="mb-2 text-left">Mortgage loan officer license status. Persons, not companies.</caption><thead><tr><th className="py-2 pr-3">License status</th><th>Persons</th></tr></thead><tbody>
        {AR_MLO_STATUSES.map((row) => <tr key={row.status} className="border-t"><td className="py-2 pr-3">{row.status}</td><td>{fmt(row.persons)}</td></tr>)}
      </tbody></table></div>
    </section>

    <section className="mt-12" id="hmda"><h2 className="text-2xl font-semibold">2025 HMDA Arkansas-property activity</h2>
      <p className="mt-3 text-slate-700">{fmt(ar.hmda.applications)} applications; {fmt(ar.hmda.originations)} originations; {fmt(ar.hmda.denials)} denials ({ar.hmda.denialApplicationPct}% of applications). {ar.hmda.counties} county rows in the existing statewide county file. {fmt(ar.hmda.leiSummaryRows)} LEI summary rows. A LEI row is a reporting identity, not an Arkansas Securities Department license and not an NMLS company record. Purchase {fmt(ar.hmda.purchase)}, refinance {fmt(ar.hmda.refinance)}, other purpose {fmt(ar.hmda.otherPurpose)}. Application loan types: conventional {fmt(ar.hmda.conventional)}, FHA {fmt(ar.hmda.fha)}, VA {fmt(ar.hmda.va)}, USDA/other {fmt(ar.hmda.usdaOther)}.</p>
      <p className="mt-2 text-sm text-slate-600">These figures sum the existing 2025 Arkansas-property county file. A separate major-market slice has {ar.hmda.majorMarketSliceRows} county rows and is not this statewide total. The denial/application ratio is not a lender quality score. HMDA applications are not license rows. This page does not publish a county or city route.</p>
    </section>

    <section className="mt-12" id="other"><h2 className="text-2xl font-semibold">What this workbook does not contain</h2>
      <p className="mt-3 text-slate-700">Mortgage enforcement orders were <strong>NOT_ACQUIRED</strong>. Complaints were <strong>NOT_ACQUIRED</strong>. A complaint is not a violation, and a missing order file is not zero orders. Exact canonical attachments: {ar.exactCanonicalAttachments}. Name-only adverse joins: {ar.nameOnlyAdverseJoins}. State-chartered bank counts were <strong>NOT_ACQUIRED</strong> and are not mortgage licenses. Money-services licenses were <strong>NOT_ACQUIRED</strong>. None of those gaps is filled with zero.</p>
    </section>

    <section className="mt-12" id="clocks"><h2 className="text-2xl font-semibold">Source clocks and limits</h2>
      <p className="mt-3 text-sm text-slate-600">Department page label {ar.sources.pageLabel}. Workbook last modified {ar.sources.workbookLastModified}. Page dateModified {ar.sources.pageModified}. Retrieved {ar.retrievedAt}. Workbook SHA-256 {ar.sources.workbookSha256}. {fmt(ar.sources.workbookBytes)} bytes. HMDA vintage {ar.hmda.year}, from the existing statewide file, not a new HMDA download. Page data generated {ar.generatedAt}. The September 1 page label and the September 29 file clock are both kept. No single clock covers licenses and HMDA. Net-new canonical organizations {ar.newCanonicalOrganizations}. Graph writes {ar.graphWrites}. Claim eligibility changes {ar.claimEligibilityChanges}. Little Rock, Fayetteville, and Fort Smith are geography only. This page publishes no city or county route.</p>
    </section>
  </main>;
}
