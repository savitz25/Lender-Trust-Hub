import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/directory/categories";
import { IDAHO_LENDER_SNAPSHOT as id } from "@/lib/idaho-intelligence/snapshot";

const fmt = (n: number) => n.toLocaleString("en-US");

export const metadata: Metadata = {
  title: "Idaho Mortgage License Lines and HMDA Slice | LenderTrustHub",
  description:
    "Idaho Department of Finance fiscal year 2025: 2,584 mortgage broker, lender, and servicing licenses and 8,641 mortgage loan originator licensees. Credit Code regulated lenders, collection-agency classes, banks, credit unions, and the owned HMDA slice stay separate.",
  alternates: { canonical: `${SITE_URL}/idaho` },
  robots: { index: true, follow: true },
};

export default function IdahoLenderPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12 text-slate-900">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
        State intelligence · Idaho Department of Finance
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">
        Idaho mortgage license lines
      </h1>
      <p className="mt-5 text-lg text-slate-700">
        The {id.sources.annualReportTitle} covers {id.sources.fiscalPeriod}. The
        letter is dated {id.sources.letterDate}. License lines below use that
        fiscal year. Company, branch, person, Credit Code lender, collection
        class, bank, credit union, NMLS identity, and HMDA activity stay
        separate. This page does not rank lenders and does not publish one
        Idaho lender total.
      </p>

      <section className="mt-10 grid gap-4 sm:grid-cols-3" aria-label="Idaho mortgage evidence">
        <div className="rounded-xl border p-5">
          <p className="text-sm text-slate-600">Mortgage broker, lender, and servicing licenses</p>
          <p className="mt-2 text-2xl font-bold">{fmt(id.mortgage.current)}</p>
          <p className="mt-2 text-sm">
            The report&apos;s own sentence. Prior year {fmt(id.mortgage.prior)}.
            Company versus branch is {id.mortgage.companyVersusBranch}.
          </p>
        </div>
        <div className="rounded-xl border p-5">
          <p className="text-sm text-slate-600">Mortgage loan originators</p>
          <p className="mt-2 text-2xl font-bold">{fmt(id.mortgageLoanOriginators.current)}</p>
          <p className="mt-2 text-sm">
            Individual licensees. Prior year {fmt(id.mortgageLoanOriginators.prior)}.
            Not added to the {fmt(id.mortgage.current)} company-side line.
          </p>
        </div>
        <div className="rounded-xl border p-5">
          <p className="text-sm text-slate-600">Named NMLS roster</p>
          <p className="mt-2 text-2xl font-bold">{id.mortgage.nmlsIds}</p>
          <p className="mt-2 text-sm">
            NMLS Consumer Access is a search. A missing roster is not zero
            licensees. Graph writes: {id.graphWrites}.
          </p>
        </div>
      </section>

      <section className="mt-12" id="irmpa">
        <h2 className="text-2xl font-semibold">Residential Mortgage Practices Act</h2>
        <p className="mt-3 text-slate-700">
          The{" "}
          <a className="underline" href={id.sources.annualReport}>
            fiscal year 2025 annual report
          </a>{" "}
          says the number of licensed mortgage brokers/lenders and servicing
          companies increased from {fmt(id.mortgage.prior)} to {fmt(id.mortgage.current)}.
          Servicing companies are inside that sentence. This page does not split
          them out. Licensed mortgage loan originators increased from{" "}
          {fmt(id.mortgageLoanOriginators.prior)} to {fmt(id.mortgageLoanOriginators.current)}{" "}
          individual licensees. Those persons are not companies. SHA-256{" "}
          {id.sources.annualReportSha256}. File size {fmt(id.sources.annualReportBytes)} bytes.
        </p>
        <p className="mt-3 text-slate-700">
          Department-wide licensing and registration filings rose from{" "}
          {fmt(id.allDepartmentFilings.prior)} to {fmt(id.allDepartmentFilings.current)}.
          That is every finance filing in the letter, not an Idaho mortgage count.
          Restitution of {fmt(id.restitutionUsd)} dollars and complaint recoveries
          of more than {fmt(id.complaintRecoveryUsdMoreThan)} dollars are money
          figures, not license populations and not a complaint count.
        </p>
      </section>

      <section className="mt-12" id="other-licenses">
        <h2 className="text-2xl font-semibold">Other department classes</h2>
        <p className="mt-3 text-slate-700">
          Idaho Credit Code Regulated Lender licensees decreased from{" "}
          {fmt(id.regulatedLenders.prior)} to {fmt(id.regulatedLenders.current)}.
          That statute is not the Residential Mortgage Practices Act. The{" "}
          {fmt(id.regulatedLenders.current)} are not added to the {fmt(id.mortgage.current)}.
        </p>
        <p className="mt-3 text-slate-700">
          Idaho Collection Agency Act, same report, not added to mortgage:
          collection agencies {fmt(id.collectionAgencyAct.collectionAgencies.prior)} to{" "}
          {fmt(id.collectionAgencyAct.collectionAgencies.current)}; debt buyers{" "}
          {fmt(id.collectionAgencyAct.debtBuyers.prior)} to {fmt(id.collectionAgencyAct.debtBuyers.current)};
          credit repair {fmt(id.collectionAgencyAct.creditRepair.prior)} to{" "}
          {fmt(id.collectionAgencyAct.creditRepair.current)}; debt settlement{" "}
          {fmt(id.collectionAgencyAct.debtSettlement.prior)} to{" "}
          {fmt(id.collectionAgencyAct.debtSettlement.current)}. Credit counselor
          licensees are printed as declining slightly to{" "}
          {id.collectionAgencyAct.creditCounselorsEnding}. That sentence does not
          give a clean prior count. Individuals registered to act for collection
          agencies went from {fmt(id.collectionAgencyAct.individualsRegistered.prior)} to{" "}
          {fmt(id.collectionAgencyAct.individualsRegistered.current)}. Those
          people are not mortgage loan originators.
        </p>
        <p className="mt-3 text-slate-700">
          As of June 30, 2025, the Bank Section reports{" "}
          {id.banks.stateCharteredUnderDirectSupervision} Idaho state-chartered
          banks under direct supervision and {id.banks.hostStateBanksCharteredElsewhere}{" "}
          host-state banks chartered elsewhere. Idaho-based banks on that date:{" "}
          {id.banks.idahoBasedBanks} ({id.banks.idahoBasedBanksComposition}). As of
          the same date, {id.creditUnions.stateCharteredUnderDirectSupervision} Idaho
          state-chartered credit unions are under direct supervision, plus{" "}
          {id.creditUnions.hostStateCreditUnions} host-state credit unions. The
          report&apos;s Idaho-based credit union line is a different clock, June 30,
          2024: {id.creditUnions.idahoBasedCreditUnions} (
          {id.creditUnions.idahoBasedComposition}). These charter counts are not
          mortgage licenses and are not added to each other.
        </p>
      </section>

      <section className="mt-12" id="hmda">
        <h2 className="text-2xl font-semibold">Owned 2025 HMDA slice</h2>
        <p className="mt-3 text-slate-700">
          The file already in this repository has {fmt(id.hmda.countyMarketRows)}{" "}
          county-market rows, {fmt(id.hmda.lenderCountyActivityRows)} lender-county
          activity rows, {fmt(id.hmda.leiSummaryRows)} LEI summaries, and{" "}
          {fmt(id.hmda.highConfidenceMappings)} high-confidence LEI mappings.{" "}
          {id.hmda.namedMajorMarkets} markets are named. {id.hmda.countyMarketRows}{" "}
          rows are not all {id.hmda.allIdahoCounties} Idaho counties.{" "}
          {id.hmda.largestPrintedCounty} County, one county, has{" "}
          {fmt(id.hmda.largestPrintedCountyOriginations)} originations. That figure
          is not a statewide total. County origination lines are not added. HMDA
          is not a license. The slice was not rebuilt for this page.
        </p>
      </section>

      <section className="mt-12" id="limits">
        <h2 className="text-2xl font-semibold">What was not acquired</h2>
        <p className="mt-3 text-slate-700">
          A named company roster, branch roster, and mortgage loan originator
          roster were <strong>{id.mortgage.namedRoster}</strong>. Exempt-entity
          registration and mortgage processor or underwriter rosters were{" "}
          <strong>{id.notAcquired.exemptEntityRegistrationRoster}</strong>.
          Enforcement orders were <strong>{id.notAcquired.enforcementOrderCorpus}</strong>.
          A complaint count was <strong>{id.notAcquired.complaintCount}</strong>.
          A complaint is not a violation. FDIC institutions were{" "}
          {id.notAcquired.fdicInstitutionRecount}. Name-only adverse joins:{" "}
          {id.nameOnlyAdverseJoins}. Net-new organizations:{" "}
          {id.newCanonicalOrganizations}.
        </p>
        <p className="mt-3 text-sm text-slate-600">
          Boise is geography only. This page publishes no city route.
        </p>
        <p className="mt-3">
          <Link className="underline" href="/ask?q=how%20many%20mortgage%20lenders%20in%20Idaho">
            Ask about Idaho mortgage evidence
          </Link>
        </p>
      </section>
    </main>
  );
}
