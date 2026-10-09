import { StateCountyLinks } from '@/components/mortgage/state-county-links';
import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/directory/categories";
import { NEW_MEXICO_SNAPSHOT as nm } from "@/lib/new-mexico-intelligence/snapshot";

const fmt = (n: number) => n.toLocaleString("en-US");

export const metadata: Metadata = {
  title: "New Mexico Mortgage Limits and HMDA Slice | LenderTrustHub",
  description:
    "New Mexico mortgage loan company, branch, and originator bulk rosters were not acquired. The owned 2025 HMDA slice has 18 county rows, 2,556 lender-county rows, 513 LEI summaries, and 146 mappings. Bernalillo has 14,288 originations inside that slice, which is not a statewide total.",
  alternates: { canonical: `${SITE_URL}/new-mexico` },
  robots: { index: true, follow: true },
};

export default function NewMexicoLenderPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12 text-slate-900">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
        State intelligence · New Mexico Regulation and Licensing Department
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">
        New Mexico mortgage limits and market evidence
      </h1>
      <p className="mt-5 text-lg text-slate-700">
        The Financial Institutions Division uses NMLS for mortgage loan
        companies, mortgage company branches, and mortgage loan originators.
        Those bulk rosters were not acquired. Lender, broker, and servicer were
        not split, because no bulk file separates them. A company, a branch, a
        person, an NMLS search, and an HMDA observation stay separate. This page
        does not rank lenders and does not publish one New Mexico lender total.
      </p>

      <section
        className="mt-10 grid gap-4 sm:grid-cols-3"
        aria-label="New Mexico mortgage evidence"
      >
        <div className="rounded-xl border p-5">
          <p className="text-sm text-slate-600">Mortgage bulk rosters</p>
          <p className="mt-2 text-2xl font-bold">NOT_ACQUIRED</p>
          <p className="mt-2 text-sm">
            Company, branch, and originator person files were not downloaded.
            A missing bulk file is not zero licensees.
          </p>
        </div>
        <div className="rounded-xl border p-5">
          <p className="text-sm text-slate-600">Owned 2025 HMDA slice</p>
          <p className="mt-2 text-2xl font-bold">{fmt(nm.hmda.countyMarketRows)} counties</p>
          <p className="mt-2 text-sm">
            Eighteen major-market rows are not all {nm.hmda.allNewMexicoCounties}{" "}
            New Mexico counties and not a license census.
          </p>
        </div>
        <div className="rounded-xl border p-5">
          <p className="text-sm text-slate-600">Statewide HMDA aggregate</p>
          <p className="mt-2 text-2xl font-bold">{nm.hmda.statewideAcceptedAggregate}</p>
          <p className="mt-2 text-sm">
            The 18-county slice is not a substitute for a statewide accepted
            aggregate. County lines are not added together.
          </p>
        </div>
      </section>

      <section className="mt-12" id="licensing">
        <h2 className="text-2xl font-semibold">Mortgage identities</h2>
        <p className="mt-3 text-slate-700">
          The{" "}
          <a className="underline" href={nm.sources.mortgageIndustry}>
            Financial Institutions Division mortgage industry page
          </a>{" "}
          points mortgage lenders, brokers, and mortgage loan originators to
          NMLS.{" "}
          <a className="underline" href="https://www.nmlsconsumeraccess.org/">
            NMLS Consumer Access
          </a>{" "}
          is a search. No mortgage loan company roster, mortgage company branch
          roster, or mortgage loan originator person roster was downloaded.
          Lender versus broker versus servicer stays {nm.mortgage.lenderBrokerServicerSplit}.
          An application is not an issued license.
        </p>
        <p className="mt-3 text-slate-700">
          The{" "}
          <a className="underline" href={nm.sources.onlineServices}>
            department online services page
          </a>{" "}
          prints the host nmlsconsumeracess.org for mortgage loan
          companies, branches, originators, and several non-mortgage classes.
          That misspelled host is not a census and was not scraped. It is not
          zero licensees and not a count of any class.
        </p>
        <p className="mt-3 text-slate-700">
          The{" "}
          <a className="underline" href={nm.sources.strategicPlan}>
            NMRLD 2026 strategic plan
          </a>{" "}
          names the Mortgage Loan Company Act (NMSA 58-21) and the Mortgage Loan
          Originator Licensing Act (NMSA 58-21B). That is statutory
          authority, not a roster. Retrieved {nm.sources.strategicPlanRetrieved}.
          SHA-256 {nm.sources.strategicPlanSha256}.
        </p>
      </section>

      <section className="mt-12" id="other-fid">
        <h2 className="text-2xl font-semibold">Other division classes</h2>
        <p className="mt-3 text-slate-700">
          State-chartered banks, credit unions, small loan companies, collection
          agencies, escrow companies, endowed-care cemeteries, and money
          services were {nm.otherFidRosters.stateCharteredBanks} as rosters.
          None of those classes is a mortgage license. They are not blended into
          a mortgage count.
        </p>
      </section>

      <section className="mt-12" id="hmda">
        <h2 className="text-2xl font-semibold">Owned 2025 HMDA slice</h2>
        <p className="mt-3 text-slate-700">
          The file already in this repository has {fmt(nm.hmda.countyMarketRows)}{" "}
          county-market rows, {fmt(nm.hmda.lenderCountyActivityRows)}{" "}
          lender-county activity rows, {fmt(nm.hmda.leiSummaryRows)} LEI state
          summaries, and {fmt(nm.hmda.highConfidenceMappings)} high-confidence
          LEI mappings. {nm.hmda.largestPrintedCounty}, one county inside that
          slice, has {fmt(nm.hmda.largestPrintedCountyOriginations)} originations.
          That figure is not a statewide total. The other county origination
          lines are not added to it. A LEI row is not an FID license and not an
          NMLS record.
        </p>
        <p className="mt-3 text-sm text-slate-600">
          Source vintage {nm.hmda.year}. Slice folder {nm.hmda.ownedSlice}. The
          slice was not reloaded or rebuilt for this page. A statewide accepted
          HMDA aggregate for this page is {nm.hmda.statewideAcceptedAggregate}.
          Eighteen counties are not every New Mexico county. This page does not
          publish a city or county route.
        </p>
      </section>

      <section className="mt-12" id="limits">
        <h2 className="text-2xl font-semibold">What was not acquired</h2>
        <p className="mt-3 text-slate-700">
          Enforcement orders were <strong>{nm.notAcquired.enforcementOrders}</strong>.
          Complaints were <strong>{nm.notAcquired.complaints}</strong>. A
          complaint is not a violation, and a missing order file is not zero
          orders. Name-only adverse joins: {nm.nameOnlyAdverseJoins}. FDIC
          institutions were NOT_RECOUNTED. Banks are not mortgage licenses.
        </p>
        <p className="mt-3 text-sm text-slate-600">
          Page data generated {nm.generatedAt}. Net-new canonical organizations{" "}
          {nm.newCanonicalOrganizations}. Graph writes {nm.graphWrites}. Claim
          eligibility changes {nm.claimEligibilityChanges}. Albuquerque and Santa
          Fe are geography only. This page publishes no city or county route.
        </p>
        <p className="mt-3">
          <Link className="underline" href="/ask?q=New%20Mexico%20mortgage%20licensing">
            Ask about New Mexico mortgage evidence
          </Link>
        </p>
      </section>
      <StateCountyLinks stateSlug="new-mexico" stateName="New Mexico" />
    </main>
  );
}
