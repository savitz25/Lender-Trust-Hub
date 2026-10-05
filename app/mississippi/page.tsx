import type { Metadata } from "next";
import { MS_BANK_FACILITIES, MS_CONSUMER_EXAMS, MISSISSIPPI_SNAPSHOT as ms } from "@/lib/mississippi-intelligence/snapshot";
import { SITE_URL } from "@/lib/directory/categories";

export const metadata: Metadata = {
  title: "Mississippi Mortgage Licensing, HMDA & DBCF Evidence | LenderTrustHub",
  description: "Mississippi DBCF prints 7,093 mortgage lenders, branches, and loan originators together and 2,092 consumer-finance companies. 9,185 is the report's own sum of those two sentences. State-chartered banks are 53. 2025 HMDA applications on Mississippi property are 102,491 across 82 counties. 102,491 is not a DBCF license count.",
  alternates: { canonical: `${SITE_URL}/mississippi` },
  robots: { index: true, follow: true },
};

const fmt = (n: number) => n.toLocaleString("en-US");
const money = (cents: number) => {
  const dollars = Math.floor(cents / 100);
  const frac = String(cents % 100).padStart(2, "0");
  return `$${dollars.toLocaleString("en-US")}.${frac}`;
};

export default function MississippiLenderPage() {
  const lic = ms.licensing;
  const exams = ms.examinations;
  const penalties = ms.penalties;
  const banks = ms.banks;
  return <main className="mx-auto max-w-5xl px-5 py-12 text-slate-900">
    <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">State intelligence · Mississippi Department of Banking and Consumer Finance</p>
    <h1 className="mt-3 text-4xl font-bold tracking-tight">Mississippi mortgage licensing and lending evidence</h1>
    <p className="mt-5 text-lg text-slate-700">The Department licenses mortgage brokers, mortgage lenders and servicers, and mortgage loan originators under the S.A.F.E. Mortgage Act. Its 2025 annual report prints those mortgage licenses in one combined sentence. A company, a branch, an originator, a consumer-finance license, a bank charter, an NMLS record, and an HMDA application stay separate. This page does not rank lenders and does not publish one Mississippi lender total.</p>

    <section className="mt-10 grid gap-4 sm:grid-cols-3" aria-label="Mississippi evidence summary">
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">Mortgage lenders, branches, and originators</p><p className="mt-2 text-2xl font-bold">{fmt(lic.mortgageLendersBranchesAndOriginators)}</p><p className="mt-2 text-sm">The commissioner&apos;s June 30, 2025 sentence. Lenders, branches, and loan originators are not split. This is not a company count and not an originator count.</p></div>
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">State-chartered commercial banks</p><p className="mt-2 text-2xl font-bold">{fmt(banks.stateCharteredCommercialBanks)}</p><p className="mt-2 text-sm">June 30, 2025. Charter count. Not a mortgage license and not the federal banks in the facility table.</p></div>
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">2025 HMDA applications</p><p className="mt-2 text-2xl font-bold">{fmt(ms.hmda.applications)}</p><p className="mt-2 text-sm">Mississippi-property observations across {ms.hmda.counties} county rows. Not a DBCF license count.</p></div>
    </section>

    <section className="mt-12" id="licenses"><h2 className="text-2xl font-semibold">What the annual report prints</h2>
      <p className="mt-3 text-slate-700">The <a className="underline" href={ms.sources.annualReport}>2025 annual report</a> is submitted under Miss. Code Ann. § 81-1-113 for fiscal year-end 2025. As of June 30, 2025, the Nonbank Division licensed {fmt(lic.consumerFinanceCompanies)} consumer finance companies and {fmt(lic.mortgageLendersBranchesAndOriginators)} mortgage lenders, branches, and loan originators. The consumer-finance figure covers ten industries and is not split into small loan, pawn, title pledge, check cashing, or the other consumer-finance classes. The mortgage figure mixes companies, branches, and persons. Mortgage broker, mortgage lender, mortgage servicer, branch, and mortgage loan originator counts were not printed. Missing splits stay unknown.</p>
      <p className="mt-3 text-slate-700">The nonbank section says the Division licenses and regulates {fmt(lic.printedLicenseesElevenIndustries)} licensees in eleven nonbank industries, which include mortgage and consumer lending. {fmt(lic.consumerFinanceCompanies)} plus {fmt(lic.mortgageLendersBranchesAndOriginators)} equals that printed {fmt(lic.printedLicenseesElevenIndustries)}. It is the report&apos;s own sum of those two sentences. It is not a mortgage census and not a count of distinct companies.</p>
      <p className="mt-3 text-slate-700">Licensing runs through NMLS. <a className="underline" href={ms.sources.nmls}>NMLS Consumer Access</a> is the public search. A bulk roster was <strong>NOT_ACQUIRED</strong>. A current separate roster of mortgage brokers, mortgage lenders and servicers, branches, and mortgage loan originators remains a public-records request to DBCF. An NMLS ID is not itself proof of a Mississippi license. HMDA applications are not a license count. Consumer-finance licensee PDFs dated February 9, 2026 were not counted here and are not added to the {fmt(lic.consumerFinanceCompanies)}.</p>
    </section>

    <section className="mt-12" id="examinations"><h2 className="text-2xl font-semibold">Examinations</h2>
      <p className="mt-3 text-slate-700">The report says examiners performed {fmt(exams.printedCombinedExams)} examinations of in-state and out-of-state licensees in FY2025. The consumer-finance assignment page totals {fmt(exams.consumerFinanceExams)}. The mortgage assignment page totals {fmt(exams.mortgageExams)} ({fmt(exams.mortgageFullExams)} full, {fmt(exams.mortgageLimitedExams)} limited). Those two pages add to the printed {fmt(exams.printedCombinedExams)}. An examination is not a violation. Findings were not printed.</p>
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[420px] text-left text-sm"><caption className="mb-2 text-left">Consumer-finance examination assignments, summed from the examiner tables. Not licensees.</caption><thead><tr><th className="py-2 pr-3">Industry</th><th>Examinations</th></tr></thead><tbody>
        {MS_CONSUMER_EXAMS.map((row) => <tr key={row.industry} className="border-t"><td className="py-2 pr-3">{row.industry}</td><td>{fmt(row.exams)}</td></tr>)}
      </tbody></table></div>
      <p className="mt-3 text-sm text-slate-600">Insurance premium finance and consumer loan broker are not rows on that examination page. Absence from the examination table is not a license count of zero. Mortgage examinations stay in the {fmt(exams.mortgageExams)} and are not in this table.</p>
    </section>

    <section className="mt-12" id="penalties"><h2 className="text-2xl font-semibold">Civil money penalties and refunds</h2>
      <p className="mt-3 text-slate-700">Consumer finance, one industry bucket: civil money penalties assessed {money(penalties.consumerFinanceCivilMoneyPenaltiesCents)}; refunds {money(penalties.consumerFinanceRefundsCents)}. Mortgage, a separate bucket: civil money penalties assessed {money(penalties.mortgageCivilMoneyPenaltiesCents)}; refunds {money(penalties.mortgageRefundsCents)}. These are dollar totals. The report does not print an action count, a respondent, or a disposition. No penalty was attached to a company. Exact canonical attachments: {penalties.exactCanonicalAttachments}. Name-only adverse joins: {penalties.nameOnlyAdverseJoins}. A penalty assessment is not a finding about a named party on this page.</p>
    </section>

    <section className="mt-12" id="hmda"><h2 className="text-2xl font-semibold">2025 HMDA Mississippi-property activity</h2>
      <p className="mt-3 text-slate-700">{fmt(ms.hmda.applications)} applications; {fmt(ms.hmda.originations)} originations; {fmt(ms.hmda.denials)} denials ({ms.hmda.denialApplicationPct}% of applications). {ms.hmda.counties} county rows. {fmt(ms.hmda.leiSummaryRows)} LEI summary rows. A LEI row is a reporting identity, not a DBCF license and not an NMLS company record. Purchase {fmt(ms.hmda.purchase)}, refinance {fmt(ms.hmda.refinance)}, other purpose {fmt(ms.hmda.otherPurpose)}. Application loan types: conventional {fmt(ms.hmda.conventional)}, FHA {fmt(ms.hmda.fha)}, VA {fmt(ms.hmda.va)}, USDA/other {fmt(ms.hmda.usdaOther)}.</p>
      <p className="mt-2 text-sm text-slate-600">These figures sum the 2025 Mississippi-property county file. A separate major-market slice has {ms.hmda.majorMarketSliceRows} county rows and is not this statewide total. The denial/application ratio is not a lender quality score. This page does not publish a county or city route.</p>
    </section>

    <section className="mt-12" id="banks"><h2 className="text-2xl font-semibold">Banks and thrifts</h2>
      <p className="mt-3 text-slate-700">As of June 30, 2025, DBCF regulated {fmt(banks.stateCharteredCommercialBanks)} state-chartered commercial banks, with assets {banks.assetsPhrase}. The asset ranking table prints {fmt(banks.assetsThousands)} in thousands and a grand count of {fmt(banks.stateCharteredCommercialBanks)}. The letter also says the Banking Division regulates credit unions and one non-depository trust company. A credit-union count was not printed. {banks.stateCharteredShareOfCharteredAssetsPhrase} of banking assets chartered in Mississippi reside in state-chartered institutions. No insolvent or liquidated banks were reported from July 1, 2024, through June 30, 2025. None of these charter facts is a mortgage license.</p>
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><caption className="mb-2 text-left">Banking facility statistics as of June 30, 2025. The branch sum is Mississippi branches plus out-of-state branches. Host-state branches are a separate row.</caption><thead><tr><th className="py-2 pr-3">Charter</th><th className="pr-3">Domiciles</th><th className="pr-3">Mississippi branches</th><th className="pr-3">Out-of-state branches</th><th className="pr-3">Branch sum</th><th>Host-state branches</th></tr></thead><tbody>
        {MS_BANK_FACILITIES.map((row) => <tr key={row.charter} className="border-t"><td className="py-2 pr-3">{row.charter}</td><td className="pr-3">{fmt(row.domiciles)}</td><td className="pr-3">{fmt(row.mississippiBranches)}</td><td className="pr-3">{fmt(row.outOfStateBranches)}</td><td className="pr-3">{fmt(row.branchSum)}</td><td>{fmt(row.hostStateBranches)}</td></tr>)}
      </tbody></table></div>
    </section>

    <section className="mt-12" id="clocks"><h2 className="text-2xl font-semibold">Source clocks and limits</h2>
      <p className="mt-3 text-sm text-slate-600">License and bank clocks {lic.clock}. Examination and penalty clocks {exams.clock}. Report retrieved {ms.retrievedAt}. Report SHA-256 {ms.sources.annualReportSha256}. {ms.sources.annualReportBytes.toLocaleString("en-US")} bytes. HMDA vintage {ms.hmda.year}. Page data generated {ms.generatedAt}. No universal Mississippi as-of date. Net-new canonical organizations {ms.newCanonicalOrganizations}. Graph writes {ms.graphWrites}. Claim eligibility changes {ms.claimEligibilityChanges}. Jackson, Gulfport, and Biloxi are geography only. This page publishes no city or county route. Confirm a current mortgage license on <a className="underline" href={ms.sources.mortgagePage}>the DBCF mortgage page</a> and in NMLS Consumer Access.</p>
    </section>
  </main>;
}
