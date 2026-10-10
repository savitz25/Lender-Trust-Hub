import { StateCountyLinks } from '@/components/mortgage/state-county-links';
import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/directory/categories";
import { WEST_VIRGINIA_LENDER_SNAPSHOT as s } from "@/lib/west-virginia-intelligence/snapshot";

const fmt = (n: number) => n.toLocaleString("en-US");

export const metadata: Metadata = {
  title: "West Virginia licensed mortgage companies",
  description:
    "The West Virginia Division of Financial Institutions FY2025 annual report lists licensed mortgage companies. That named list is not loan originators, branches, examinations, or HMDA.",
  alternates: { canonical: `${SITE_URL}/west-virginia` },
  robots: { index: true, follow: true },
};

export default function WestVirginiaLenderPage() {
  const companies = s.licensedMortgageCompanies;
  const exams = s.examinations;
  return (
    <main className="mx-auto max-w-5xl px-5 py-12 text-slate-900">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
        State intelligence · West Virginia
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">
        West Virginia licensed mortgage companies
      </h1>
      <p className="mt-5 text-lg text-slate-700">
        The West Virginia Division of Financial Institutions is the mortgage
        regulator in this report. Commissioner {s.commissionerNamedOnReport} signed
        the {s.reportTitle} for the fiscal year ending June 30, 2025. A licensed
        mortgage company row, a mortgage loan originator, a branch, an NMLS
        identity, a state-chartered bank, an examination, and HMDA market activity
        are different records. Charleston, Morgantown, and Huntington are not
        local pages.
      </p>

      <section className="mt-10 grid gap-4 sm:grid-cols-3" aria-label="West Virginia mortgage evidence">
        <div className="rounded-xl border p-5">
          <p className="text-sm text-slate-600">Licensed mortgage company rows</p>
          <p className="mt-2 text-2xl font-bold">{fmt(companies.namedRows)}</p>
          <p className="mt-2 text-sm">
            Named rows on printed pages {companies.printedPages}. The report does not print a total.
            Lender, broker, and servicer are {companies.lenderBrokerServicerSplit}.
          </p>
        </div>
        <div className="rounded-xl border p-5">
          <p className="text-sm text-slate-600">Mortgage examinations, FY2025</p>
          <p className="mt-2 text-2xl font-bold">{exams.fy2025}</p>
          <p className="mt-2 text-sm">
            {exams.label}. FY2024 printed {exams.fy2024}. An examination is not a license.
          </p>
        </div>
        <div className="rounded-xl border p-5">
          <p className="text-sm text-slate-600">Mortgage loan originators</p>
          <p className="mt-2 text-2xl font-bold">{s.notAcquired.mortgageLoanOriginatorRoster}</p>
          <p className="mt-2 text-sm">A person roster was not acquired. Missing is not zero.</p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">The company list is one grain</h2>
        <p className="mt-3 text-slate-700">
          The <a className="underline" href={s.reportUrl}>{s.reportTitle}</a>, filed under {s.authority},
          prints “{companies.heading}.” This page counted {fmt(companies.namedRows)} named rows.
          The report itself does not print that total. The heading does not split mortgage lender,
          mortgage broker, and mortgage servicer. A listed city and state are the office printed
          on the row. They are not a second license population, and a West Virginia office is not
          required for a row to be on the list. NMLS identifiers are not printed on the list.
        </p>
        <p className="mt-3 text-sm text-slate-600">
          File {s.filename}. HTTP Last-Modified {s.httpLastModified}. Retrieved {s.retrievedAt}.
          HTTP Date {s.httpDate}. SHA-256 {s.sha256}. Bytes {fmt(s.bytes)}. The PDF text layer is {s.textLayer}.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Examinations, banks, and people stay separate</h2>
        <p className="mt-3 text-slate-700">
          The Division Activities table prints {exams.fy2025} mortgage lender/broker/servicer
          examinations and visitations for FY2025 and {exams.fy2024} for FY2024. The same table’s
          all-class examination totals are {exams.allClassTotalFy2025} for FY2025 and {exams.allClassTotalFy2024} for
          FY2024. Those totals cover every examination class on the table. They are not mortgage
          licenses and they are not added to the {fmt(companies.namedRows)} company rows.
        </p>
        <p className="mt-3 text-slate-700">
          Mortgage loan originators, a separate broker roster, a separate servicer roster, branches,
          and a current NMLS Consumer Access bulk roster are {s.notAcquired.mortgageLoanOriginatorRoster}.
          State-chartered bank rows in the same report were not counted here. FDIC institutions
          were {s.notAcquired.fdicInstitutionRecount}. A bank charter is not a mortgage company row.
          Money transmitter and regulated consumer lender rosters were not acquired.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">HMDA is market activity</h2>
        <p className="mt-3 text-slate-700">
          LenderTrustHub already holds a {s.hmda.vintage} West Virginia HMDA slice at {s.hmda.productSlice}: {s.hmda.countyMarketRows} county
          market rows, {fmt(s.hmda.lenderCountyActivity)} lender–county activity rows, {fmt(s.hmda.leiStateSummaries)} LEI
          state summaries, {s.hmda.highConfidenceLeiMaps} high-confidence LEI maps, and {s.hmda.majorMarketsWithNames} named
          major markets. That slice was not reloaded and was not summed into the company list.
          A single accepted statewide application aggregate is {s.hmda.acceptedStatewideAggregate}.
          HMDA is not licensing, and an LEI is not an NMLS ID.
        </p>
        <p className="mt-3 text-slate-700">
          No company names from the annual-report list were republished. New canonical organizations: {s.newCanonicalOrganizations}.
          Graph writes: {s.graphWrites}. Name-only adverse joins: {s.nameOnlyAdverseJoins}. A complaint is not a finding.
          This page does not rank mortgage companies.
        </p>
        <p className="mt-3">
          <Link className="underline" href="/ask?q=West%20Virginia%20licensed%20mortgage%20companies">
            Ask about West Virginia mortgage evidence
          </Link>
        </p>
      </section>
      <StateCountyLinks stateSlug="west-virginia" stateName="West Virginia" />
    </main>
  );
}
