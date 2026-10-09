import { StateCountyLinks } from '@/components/mortgage/state-county-links';
import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/directory/categories";
import { NEBRASKA_LENDER_SNAPSHOT as s } from "@/lib/nebraska-intelligence/snapshot";

const fmt = (n: number) => n.toLocaleString("en-US");

export const metadata: Metadata = {
  title: "Nebraska Mortgage Banker Licenses and Separate Market Evidence | LenderTrustHub",
  description:
    "Nebraska Department of Banking and Finance reported 499 mortgage banker company licenses as of June 30, 2024. That count is not brokers, branches, loan originators, or HMDA.",
  alternates: { canonical: `${SITE_URL}/nebraska` },
  robots: { index: true, follow: true },
};

export default function NebraskaLenderPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12 text-slate-900">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
        State intelligence · Nebraska
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">
        Nebraska mortgage banker licenses and separate records
      </h1>
      <p className="mt-5 text-lg text-slate-700">
        The Nebraska Department of Banking and Finance is the primary state
        mortgage regulator in this report. A mortgage banker company license, a
        mortgage loan originator count, a branch, an NMLS identity, a
        state-chartered institution, and HMDA market activity are different
        records. Omaha and Lincoln are not published as local pages.
      </p>

      <section className="mt-10 grid gap-4 sm:grid-cols-3" aria-label="Nebraska mortgage evidence">
        <div className="rounded-xl border p-5">
          <p className="text-sm text-slate-600">Mortgage banker company licenses</p>
          <p className="mt-2 text-2xl font-bold">{fmt(s.mortgageBankerCompanyLicenses)}</p>
          <p className="mt-2 text-sm">As of 6/30/2024. Company licenses. Not brokers, branches, or people.</p>
        </div>
        <div className="rounded-xl border p-5">
          <p className="text-sm text-slate-600">Mortgage loan originators</p>
          <p className="mt-2 text-2xl font-bold">{fmt(s.mortgageLoanOriginators)}</p>
          <p className="mt-2 text-sm">Department table as of 6/30/2024. Not an acquired person roster and not the 499.</p>
        </div>
        <div className="rounded-xl border p-5">
          <p className="text-sm text-slate-600">Current NMLS roster</p>
          <p className="mt-2 text-2xl font-bold">NOT_ACQUIRED</p>
          <p className="mt-2 text-sm">Broker, servicer, branch, and NMLS identity lists were not loaded.</p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">The 2024 annual report is a clock, not a live roster</h2>
        <p className="mt-3 text-slate-700">
          The <a className="underline" href={s.reportUrl}>{s.reportTitle}</a> prints,
          “As of 6/30/24, Nebraska had 499 Mortgage Banker Company Licenses.”
          The same report’s Financial Institutions Division table, for the period
          ending June 30, 2024, prints {fmt(s.mortgageBankerCompanyLicenses)} mortgage
          bankers and {fmt(s.mortgageLoanOriginators)} mortgage loan originators.
          The table says numbers include main offices only. Trade names are not
          listed. This is not a current NMLS Consumer Access census, and the
          company count is not the originator count.
        </p>
        <p className="mt-3 text-sm text-slate-600">
          HTTP Last-Modified {s.httpLastModified}. Retrieved {s.retrievedAt}. SHA-256 {s.sha256}. File bytes {fmt(s.bytes)}.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">State-chartered institutions stay separate</h2>
        <p className="mt-3 text-slate-700">
          The same main-office table, same 6/30/2024 column, prints {fmt(s.stateCharteredBanks)} state-chartered
          banks, {s.savingsAndLoanAssociations} savings and loan associations, {fmt(s.creditUnions)} credit unions,
          and {fmt(s.trustCompanies)} trust companies. The savings and loan figure is a printed zero, not a missing
          count turned into zero. Bank holding companies print separately as {fmt(s.bankHoldingCompanies)} and are
          not added to the {fmt(s.stateCharteredBanks)} banks. None of these rows is a mortgage banker license.
        </p>
        <p className="mt-3 text-slate-700">
          A separate mortgage broker roster, mortgage servicer roster, branch roster, and NMLS identity roster
          are NOT_ACQUIRED. Fiscal-year branch approvals are activity, not a branch census. Company, branch, and
          person records are not combined.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">HMDA is market activity</h2>
        <p className="mt-3 text-slate-700">
          LenderTrustHub already holds a 2025 Nebraska HMDA product slice at {s.hmda.productSlice}: {s.hmda.majorCountyMarkets} major-county
          markets, {fmt(s.hmda.leiStateSummaries)} LEI state summaries, and {fmt(s.hmda.highConfidenceLeiMaps)} high-confidence
          LEI-to-directory maps. A single accepted statewide application aggregate was NOT_ACQUIRED for this page.
          County rows are not summed into a new statewide total. HMDA is not licensing, and an LEI is not an NMLS ID.
        </p>
        <p className="mt-3 text-slate-700">
          No mortgage-license name list was republished. New canonical organizations: {s.newCanonicalOrganizations}. Graph writes: {s.graphWrites}.
          No adverse record was joined by name. A complaint is not a finding.
        </p>
        <p className="mt-3">
          <Link className="underline" href="/ask?q=Nebraska%20mortgage%20banker%20licenses">Ask about Nebraska mortgage evidence</Link>
        </p>
      </section>
      <StateCountyLinks stateSlug="nebraska" stateName="Nebraska" />
    </main>
  );
}
