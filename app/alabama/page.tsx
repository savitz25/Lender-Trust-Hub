import type { Metadata } from 'next';
import { ALABAMA_SNAPSHOT as al } from '@/lib/alabama-intelligence/snapshot';
import { SITE_URL } from '@/lib/directory/categories';

export const metadata: Metadata = {
  title: 'Alabama Mortgage Licensing, HMDA & Banking Department Evidence | LenderTrustHub',
  description: 'Alabama Banking Department mortgage-broker and originator license counts, separate Bureau of Loans statutes, and 2025 Alabama-property HMDA activity.',
  alternates: { canonical: `${SITE_URL}/alabama` },
  robots: { index: true, follow: true },
};

const fmt = (n: number) => n.toLocaleString('en-US');

export default function AlabamaPage() {
  const loans = al.bureauOfLoans;
  const banks = al.bureauOfBanks;
  const books = al.mortgageBrokerFinancials2024;
  return <main className="mx-auto max-w-5xl px-5 py-12 text-slate-900">
    <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">State intelligence · Alabama State Banking Department</p>
    <h1 className="mt-3 text-4xl font-bold tracking-tight">Alabama mortgage licensing and lending evidence</h1>
    <p className="mt-5 text-lg text-slate-700">The Alabama State Banking Department publishes the Bureau of Banks and the Bureau of Loans in one annual report. A mortgage-broker licensee, a mortgage loan originator licensee, a depository bank, an NMLS identity, and HMDA property activity are separate facts. This page does not rank lenders and does not publish a combined Alabama mortgage-lender total.</p>

    <section className="mt-10 grid gap-4 sm:grid-cols-3" aria-label="Alabama evidence summary">
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">Mortgage Brokers Licensing Act</p><p className="mt-2 text-2xl font-bold">{fmt(loans.mortgageBrokersLicensingAct)}</p><p className="mt-2 text-sm">Active licensees at December 31, 2024. The June 30, 2025 composition prints the same 518. The source does not label these as companies or as persons.</p></div>
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">S.A.F.E. Act originator licensees</p><p className="mt-2 text-2xl font-bold">{fmt(loans.safeActOriginatorLicensees)}</p><p className="mt-2 text-sm">Mortgage loan originator licensees at December 31, 2024. The same 14,836 appears in the June 30, 2025 composition. Not added to the broker count.</p></div>
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">2025 HMDA applications</p><p className="mt-2 text-2xl font-bold">{fmt(al.hmda.applications)}</p><p className="mt-2 text-sm">Alabama-property market observations, not a Banking Department license count.</p></div>
    </section>

    <section className="mt-12" id="licenses"><h2 className="text-2xl font-semibold">Bureau of Loans licensees</h2>
      <p className="mt-3 text-slate-700">Superintendent Mike Hill’s December 31, 2025 letter submits the 2025 fiscal year-end annual report under {al.sources.statute}. <a className="underline" href={al.sources.annualReport}>That report</a> says that as of June 30, 2025, the Bureau of Loans’ {fmt(loans.compositionLicensees)} licensees are composed of six statutes. The December 31, 2024 class tables print the same six figures. This composition is not a mortgage-lender census.</p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
        <li>Alabama Small Loan Act: {fmt(loans.smallLoanAct)} licensees. Not a mortgage class.</li>
        <li>Alabama Consumer Credit Act (Mini-Code): {fmt(loans.consumerCreditAct)} licensees. The whole Mini-Code, not a mortgage-lender class.</li>
        <li>Alabama Pawn Shop Act: {fmt(loans.pawnShopAct)} active licensees. The act does not require financial reporting.</li>
        <li>Alabama Mortgage Brokers Licensing Act: {fmt(loans.mortgageBrokersLicensingAct)} active licensees. Business or person grain is NOT_LABELED.</li>
        <li>Alabama S.A.F.E. Act: {fmt(loans.safeActOriginatorLicensees)} mortgage loan originator licensees. The act does not require financial reporting.</li>
        <li>Alabama Deferred Presentment Services Act: {fmt(loans.deferredPresentmentServicesAct)} active licensees. Database transaction totals are a separate activity grain and are not added to this licensee count.</li>
      </ul>
      <p className="mt-3 text-slate-700">A mortgage-lender class count was <strong>NOT_ACQUIRED</strong>. A mortgage-servicer class count was <strong>NOT_ACQUIRED</strong>. Missing counts are not zero. The 518 broker licensees and the 14,836 originator licensees stay on their own statutes.</p>
      <p className="mt-3 text-slate-700">Mortgage-broker licensees submitted these 2024 calendar-year figures: total assets ${fmt(books.totalAssets)}; total net worth ${fmt(books.totalNetWorth)}; total loans closed {fmt(books.totalLoansClosedCount)} for ${fmt(books.totalLoansClosedAmount)}; net profit ${fmt(books.netProfit)}. Those are aggregate licensee reports, not a census and not HMDA. Operating income and operating expenses stay in the source PDF because the extracted glyphs for those two lines are spaced.</p>
      <p className="mt-3 text-slate-700"><a className="underline" href={al.sources.nmls}>NMLS Consumer Access</a> is search-only license verification. The Department points consumers there from <a className="underline" href={al.sources.verifyServiceProviders}>Verify Service Providers</a> and the <a className="underline" href={al.sources.nmlsResourceCenter}>NMLS Resource Center</a>. A bulk Alabama roster was <strong>NOT_ACQUIRED</strong>. Licensee rows are unknown. An NMLS ID does not itself establish a Banking Department license. HMDA applications are not a license count.</p>
    </section>

    <section className="mt-12" id="banks"><h2 className="text-2xl font-semibold">Bureau of Banks</h2>
      <p className="mt-3 text-slate-700">At fiscal year-end 2025 the Bureau of Banks supervised {banks.commercialBanksSupervised} commercial banks, with total assets {banks.totalAssetsPhrase}, and {fmt(banks.branchesInAlabamaAndHostStates)} branches in Alabama and {banks.hostStates} host states. The Department supervises {banks.independentTrustCompanies} independent state-chartered trust companies and {banks.bankManagedTrustDepartments} bank-managed trust departments, with total assets under administration {banks.assetsUnderAdministrationPhrase}. These are depository and trust facts. They are not mortgage-broker licensees and not originator licensees.</p>
    </section>

    <section className="mt-12" id="hmda"><h2 className="text-2xl font-semibold">2025 HMDA Alabama-property activity</h2>
      <p className="mt-3 text-slate-700">{fmt(al.hmda.applications)} applications; {fmt(al.hmda.originations)} originations; {fmt(al.hmda.denials)} denials ({al.hmda.denialApplicationPct}% of applications). {fmt(al.hmda.distinctLeis)} reporting LEIs across {al.hmda.counties} county rows in the county-market file. Purchase {fmt(al.hmda.purchase)}, refinance {fmt(al.hmda.refinance)}, other purpose {fmt(al.hmda.otherPurpose)}. Application loan types: conventional {fmt(al.hmda.conventional)}, FHA {fmt(al.hmda.fha)}, VA {fmt(al.hmda.va)}, USDA/other {fmt(al.hmda.usdaOther)}.</p>
      <p className="mt-2 text-sm text-slate-600">These figures sum the accepted Alabama-property 2025 HMDA county slice. They are market observations, not lenders. The national HMDA spine was reused. The denial/application ratio is not a lender quality score or a license measure, and it is not added to Banking Department licensees.</p>
    </section>

    <section className="mt-12" id="enforcement"><h2 className="text-2xl font-semibold">Enforcement</h2>
      <p className="mt-3 text-slate-700">A bounded Banking Department mortgage enforcement corpus was <strong>NOT_ACQUIRED</strong>. {al.enforcement.scope} Exact canonical attachments: {al.enforcement.exactCanonicalAttachments}. Name-only adverse joins: {al.enforcement.nameOnlyAdverseJoins}. CFPB complaints are not Banking Department orders.</p>
    </section>

    <section className="mt-12" id="complaints"><h2 className="text-2xl font-semibold">Complaints and source clocks</h2>
      <p className="mt-3 text-slate-700"><a className="underline" href={al.sources.complaints}>The Department accepts complaints</a> by mail. Bank complaints use {al.complaints.bankIntake}. Finance companies, mortgage companies and brokers, mortgage loan originators, pawn shops, and deferred-presentment lenders use {al.complaints.lendingIntake}. Intake is known. Public provider-level complaint rows were NOT_ACQUIRED. A complaint is not an enforcement finding.</p>
      <p className="mt-3 text-sm text-slate-600">Report letter December 31, 2025. Bureau of Banks clock {banks.clock}. Bureau of Loans composition {loans.compositionClock}. Class tables {loans.classTableClock}. Report retrieved {al.retrievedAt}. HMDA vintage {al.hmda.year}. Enforcement corpus NOT_ACQUIRED. Page data generated {al.generatedAt}. No universal Alabama as-of date. Net-new canonical organizations 0; graph writes {al.graphWrites}; claim eligibility changes 0. Birmingham, Montgomery, Huntsville, Tuscaloosa, and Mobile are geographic context only; no city or county intelligence pages.</p>
    </section>
  </main>;
}
