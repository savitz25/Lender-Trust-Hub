import { StateCountyLinks } from '@/components/mortgage/state-county-links';
import type { Metadata } from 'next';
import { KENTUCKY_SNAPSHOT as ky } from '@/lib/kentucky-intelligence/snapshot';
import { SITE_URL } from '@/lib/directory/categories';

export const metadata: Metadata = {
  title: 'Kentucky Mortgage Licensing, HMDA & DFI Evidence | LenderTrustHub',
  description: 'Kentucky DFI mortgage company and broker license rows, originator registrations, complaint and examination counts, the public mortgage order index, and 2025 Kentucky-property HMDA activity.',
  alternates: { canonical: `${SITE_URL}/kentucky` },
  robots: { index: true, follow: true },
};

const fmt = (n: number) => n.toLocaleString('en-US');

export default function KentuckyPage() {
  const lic = ky.licensing;
  const exams = ky.examinations;
  const complaints = ky.complaints;
  const banks = ky.depository;
  const orders = ky.enforcement;
  return <main className="mx-auto max-w-5xl px-5 py-12 text-slate-900">
    <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">State intelligence · Kentucky Department of Financial Institutions</p>
    <h1 className="mt-3 text-4xl font-bold tracking-tight">Kentucky mortgage licensing and lending evidence</h1>
    <p className="mt-5 text-lg text-slate-700">The Department of Financial Institutions publishes mortgage company license rows, mortgage broker license rows, and mortgage loan originator registrations in the 2025 annual report. A company row, a branch row, an originator registration, an NMLS identity, an HMDA reporter, and an HMDA application are separate facts. This page does not rank lenders and does not publish one Kentucky lender total.</p>

    <section className="mt-10 grid gap-4 sm:grid-cols-3" aria-label="Kentucky evidence summary">
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">Mortgage company license rows</p><p className="mt-2 text-2xl font-bold">{fmt(lic.mortgageCompanies)}</p><p className="mt-2 text-sm">December 31, 2025. The report says this figure includes companies and branches. Distinct companies were not printed.</p></div>
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">Mortgage broker license rows</p><p className="mt-2 text-2xl font-bold">{fmt(lic.mortgageBrokers)}</p><p className="mt-2 text-sm">December 31, 2025. Includes companies and branches. Kept separate from the company rows and from originator registrations.</p></div>
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">2025 HMDA applications</p><p className="mt-2 text-2xl font-bold">{fmt(ky.hmda.applications)}</p><p className="mt-2 text-sm">Kentucky-property market observations across {ky.hmda.counties} county rows. Not a DFI license count.</p></div>
    </section>

    <section className="mt-12" id="licenses"><h2 className="text-2xl font-semibold">Non-depository licenses and registrations</h2>
      <p className="mt-3 text-slate-700">The <a className="underline" href={ky.sources.annualReport}>2025 annual report</a> licensing table is dated December 31, 2025. Mortgage companies {fmt(lic.mortgageCompanies)}. Mortgage brokers {fmt(lic.mortgageBrokers)}. The at-a-glance line prints {fmt(lic.companiesAndBrokersPrintedSum)} for mortgage companies and mortgage brokers together. That sum is those two license-row figures. The asterisk says it includes companies and branches. It is not a count of distinct companies, not a mortgage-banker class, and not a mortgage-servicer class.</p>
      <p className="mt-3 text-slate-700">Mortgage loan originator registrations: {fmt(lic.originatorRegistrations)}. The table places originators under Registration Type. An originator is a person. That registration count is not added here to the company rows or the broker rows.</p>
      <p className="mt-3 text-slate-700">The same license table includes classes that are not mortgage authority: check cashers and deferred-deposit companies {fmt(lic.checkCashersOrDeferredDeposit)}; limited check cashers {fmt(lic.limitedCheckCashers)}; consumer loan companies {fmt(lic.consumerLoanCompanies)}; federal student loan servicers {fmt(lic.federalStudentLoanServicers)}; student loan servicers {fmt(lic.studentLoanServicers)}; money transmitters {fmt(lic.moneyTransmitters)}. Student loan servicers are not mortgage servicers. The license-type total is {fmt(lic.licenseTypeTotal)}. Adding the originator registrations produces the table grand total of {fmt(lic.grandTotal)}. The commissioner letter uses “licensed institutions” for that same {fmt(lic.grandTotal)}. The table itself is licenses plus registrations, and it includes the non-mortgage classes above. This page does not adopt {fmt(lic.grandTotal)} as a Kentucky lender census or as a count of distinct institutions.</p>
      <p className="mt-3 text-slate-700">A mortgage-banker class count was not printed. A mortgage-servicer class count was not printed. Missing class counts stay unknown. <a className="underline" href={ky.sources.licenseeSearch}>DFI licensee search</a> and <a className="underline" href={ky.sources.nmls}>NMLS Consumer Access</a> are search interfaces. A bulk roster was <strong>NOT_ACQUIRED</strong>. Licensee rows are unknown. An NMLS ID does not itself establish a Kentucky DFI license. HMDA applications are not a license count.</p>
    </section>

    <section className="mt-12" id="examinations"><h2 className="text-2xl font-semibold">Mortgage examinations</h2>
      <p className="mt-3 text-slate-700">The Mortgage Examination Branch reported examinations for the year ended December 31, 2025: mortgage companies {fmt(exams.mortgageCompanies)}; mortgage brokers {fmt(exams.mortgageBrokers)}; student loan servicers {fmt(exams.studentLoanServicers)}; printed total {fmt(exams.total)}. An examination count is not a violation count. Findings were not printed. The student-loan-servicer examinations stay out of the mortgage company and broker figures.</p>
    </section>

    <section className="mt-12" id="complaints"><h2 className="text-2xl font-semibold">Consumer Protection complaints</h2>
      <p className="mt-3 text-slate-700">The Consumer Protection Branch printed complaint counts for the year ended December 31, 2025. Mortgage companies and brokers are one combined row: {fmt(complaints.mortgageCompaniesAndBrokers)}. The report does not split that row into companies and brokers, and it does not print outcomes. A complaint count is not an enforcement finding.</p>
      <p className="mt-3 text-slate-700">Other printed rows, kept separate: check cashers and deferred-deposit companies {fmt(complaints.checkCashersOrDeferredDeposit)}; consumer loan companies {fmt(complaints.consumerLoanCompanies)}; money transmitters {fmt(complaints.moneyTransmitters)}; student loan servicers {fmt(complaints.studentLoanServicers)}. Licensed-type total {fmt(complaints.licensedTypeTotal)}. Unlicensed internet payday or installment {fmt(complaints.unlicensedInternetPaydayOrInstallment)}; other unlicensed {fmt(complaints.otherUnlicensed)}; unlicensed total {fmt(complaints.unlicensedTotal)}. Grand total {fmt(complaints.grandTotal)}. {complaints.unlicensedInternetNote} The mortgage companies/brokers figure is the printed 164 and is not that unlicensed note.</p>
    </section>

    <section className="mt-12" id="orders"><h2 className="text-2xl font-semibold">Mortgage enforcement index</h2>
      <p className="mt-3 text-slate-700">The public <a className="underline" href={ky.sources.mortgageEnforcementIndex}>mortgage enforcement index</a>, retrieved {orders.indexRetrievedAt}, contains {fmt(orders.indexLinks)} document links and {fmt(orders.distinctDocumentHrefs)} distinct document addresses. Some documents are linked more than once. The index mixes company and person respondents and was not split. An index link is not a finding. An agreed order is not automatically an admitted violation. No order was attached to a canonical organization. Exact canonical attachments: {orders.exactCanonicalAttachments}. Name-only adverse joins: {orders.nameOnlyAdverseJoins}. Securities Division orders are a different page and are not in this count.</p>
      <ul className="mt-4 columns-2 text-sm text-slate-700 md:columns-3">{Object.entries(orders.yearLinks).map(([year, count]) => <li key={year}>{year}: {fmt(count)} links</li>)}</ul>
    </section>

    <section className="mt-12" id="hmda"><h2 className="text-2xl font-semibold">2025 HMDA Kentucky-property activity</h2>
      <p className="mt-3 text-slate-700">{fmt(ky.hmda.applications)} applications; {fmt(ky.hmda.originations)} originations; {fmt(ky.hmda.denials)} denials ({ky.hmda.denialApplicationPct}% of applications). {ky.hmda.counties} county rows in the county-market file. {fmt(ky.hmda.leiSummaryRows)} LEI summary rows in the state summary file. A LEI summary row is a reporting identity, not a Kentucky license. Purchase {fmt(ky.hmda.purchase)}, refinance {fmt(ky.hmda.refinance)}, other purpose {fmt(ky.hmda.otherPurpose)}. Application loan types: conventional {fmt(ky.hmda.conventional)}, FHA {fmt(ky.hmda.fha)}, VA {fmt(ky.hmda.va)}, USDA/other {fmt(ky.hmda.usdaOther)}.</p>
      <p className="mt-2 text-sm text-slate-600">These figures sum the accepted Kentucky-property 2025 HMDA county file. They are market observations. The denial/application ratio is not a lender quality score and is not added to DFI license rows.</p>
    </section>

    <section className="mt-12" id="banks"><h2 className="text-2xl font-semibold">State-chartered depositories</h2>
      <p className="mt-3 text-slate-700">At December 31, 2025 the Division of Depository Institutions reported {banks.stateCharteredBanks} state-chartered banks, {banks.stateCharteredCreditUnions} state-chartered credit unions, and {banks.stateCharteredTrustCompanies} state-chartered non-depository trust companies. These are charter counts. They are not mortgage company licenses, not broker licenses, and not originator registrations.</p>
    </section>

    <section className="mt-12" id="clocks"><h2 className="text-2xl font-semibold">Source clocks and limits</h2>
      <p className="mt-3 text-sm text-slate-600">License, examination, complaint, and depository clocks {lic.clock}. Report retrieved {ky.retrievedAt}. Report SHA-256 {ky.sources.annualReportSha256}. Mortgage order index retrieved {orders.indexRetrievedAt}. HMDA vintage {ky.hmda.year}. Page data generated {ky.generatedAt}. No universal Kentucky as-of date. Net-new canonical organizations {ky.newCanonicalOrganizations}; graph writes {ky.graphWrites}; claim eligibility changes {ky.claimEligibilityChanges}. Louisville and Lexington are geographic context. This page does not add a city route. County HMDA pages that already exist under local lender geography stay HMDA geography.</p>
    </section>
    <StateCountyLinks stateSlug="kentucky" stateName="Kentucky" />
  </main>;
}
