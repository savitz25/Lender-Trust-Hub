import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/directory/categories";
import { UTAH_HMDA_SNAPSHOT as snapshot } from "@/lib/utah-intelligence/snapshot";

const fmt = (n: number) => n.toLocaleString("en-US");

export const metadata: Metadata = {
  title: "Utah Mortgage Regulation and HMDA Market Evidence | LenderTrustHub",
  description:
    "Utah DFI and DRE regulate different mortgage activities. Statewide licensing rosters were not acquired. 2025 HMDA market activity is reported separately.",
  alternates: { canonical: `${SITE_URL}/utah` },
  robots: { index: true, follow: true },
};

export default function UtahLenderPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12 text-slate-900">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
        State intelligence · Utah
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">
        Utah mortgage regulation and market activity
      </h1>
      <p className="mt-5 text-lg text-slate-700">
        Utah does not have one mortgage regulator or one mortgage-license
        population. The Department of Financial Institutions (DFI) administers
        Title 70D activities such as certain servicing and wholesale-lending
        activity. The Division of Real Estate (DRE) primarily regulates
        brokering and retail origination of closed-end residential first
        mortgages. HMDA counts below describe lending activity on Utah property,
        not state authority.
      </p>

      <section
        className="mt-10 grid gap-4 sm:grid-cols-3"
        aria-label="Utah mortgage evidence"
      >
        <div className="rounded-xl border p-5">
          <p className="text-sm text-slate-600">2025 HMDA applications</p>
          <p className="mt-2 text-2xl font-bold">
            {fmt(snapshot.applications)}
          </p>
          <p className="mt-2 text-sm">
            Utah-property county aggregate across {snapshot.countyRows} county
            rows.
          </p>
        </div>
        <div className="rounded-xl border p-5">
          <p className="text-sm text-slate-600">2025 HMDA originations</p>
          <p className="mt-2 text-2xl font-bold">
            {fmt(snapshot.originations)}
          </p>
          <p className="mt-2 text-sm">
            Market activity, not Utah-licensed companies or MLOs.
          </p>
        </div>
        <div className="rounded-xl border p-5">
          <p className="text-sm text-slate-600">Mortgage license census</p>
          <p className="mt-2 text-2xl font-bold">NOT_ACQUIRED</p>
          <p className="mt-2 text-sm">
            No DFI, DRE, or NMLS jurisdiction-filtered license rows were loaded.
          </p>
        </div>
      </section>

      <section className="mt-12" id="jurisdiction">
        <h2 className="text-2xl font-semibold">
          Which Utah authority applies?
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
          <li>
            <a
              className="underline"
              href="https://dfi.utah.gov/non-depository/mortgage-lending/"
            >
              Utah DFI
            </a>{" "}
            says Title 70D commonly covers servicing of closed-end first
            mortgages, wholesale lenders, and mortgage lenders as defined by
            statute. A Residential First Mortgage Notification (RFMN) does not
            authorize retail brokering or origination. DFI says it does not keep
            a separate mortgage-company and MLO list and directs the public to
            NMLS Consumer Access.
          </li>
          <li>
            <a
              className="underline"
              href="https://commerce.utah.gov/realestate/mortgage/"
            >
              Utah DRE
            </a>{" "}
            primarily regulates brokering and retail origination of closed-end
            residential first mortgages. DRE licenses mortgage companies, DBAs,
            branches, mortgage loan originators, and lending managers. DRE and
            DFI MLO classes are not interchangeable.
          </li>
          <li>
            <a className="underline" href="https://www.nmlsconsumeraccess.org/">
              NMLS Consumer Access
            </a>{" "}
            is an identity and verification system. An NMLS identity alone does
            not establish the exact Utah authority or current status. Company,
            branch, and individual MLO records remain separate.
          </li>
        </ul>
        <p className="mt-3 text-slate-700">
          DFI, DRE, and NMLS license populations, status dates, branches,
          servicers, and broker/company classes: NOT_ACQUIRED. No Utah
          mortgage-license total is inferred. HMDA reporter LEIs are not NMLS
          IDs.
        </p>
      </section>

      <section className="mt-12" id="hmda">
        <h2 className="text-2xl font-semibold">
          HMDA reports Utah-property activity
        </h2>
        <p className="mt-3 text-slate-700">
          The accepted 2025 county aggregate has {fmt(snapshot.applications)}{" "}
          applications, {fmt(snapshot.originations)} originations, and{" "}
          {fmt(snapshot.denials)} reported denials across {snapshot.countyRows}{" "}
          county rows. These observations are not a licensing roster, a lender
          ranking, or a finding of discrimination. The separate lender summary
          has {fmt(snapshot.distinctLeiReportingIds)} unique LEIs and{" "}
          {fmt(snapshot.leiSummaryApplications)} applications; its application
          total is 206 lower than the county aggregate. Because those files do
          not reconcile exactly, the page uses only the county aggregate for the
          statewide market figure.
        </p>
        <p className="mt-3 text-sm text-slate-600">
          Source vintage: 2025. HMDA filing data is published by the{" "}
          <a
            className="underline"
            href="https://ffiec.cfpb.gov/data-publication/"
          >
            FFIEC HMDA Platform
          </a>
          . The county aggregate SHA-256 is{" "}
          <code>{snapshot.countyFileSha256}</code>. The lender summary SHA-256
          is <code>{snapshot.leiSummarySha256}</code>. A file retrieval
          timestamp was not retained with these existing Utah summary files. The
          date of HMDA activity is not a current license-status date.
        </p>
      </section>

      <section className="mt-12" id="limits">
        <h2 className="text-2xl font-semibold">Other Utah evidence</h2>
        <p className="mt-3 text-slate-700">
          Bank and credit-union charters, branches, DFI consumer-lending
          classes, DRE orders, examinations, and current licensing records are
          separate evidence sets and were not acquired for this page. Complaints
          are not violations. No adverse record was joined by name. Existing
          canonical matches, new canonical entities, and production graph
          attachments were not re-read; no graph writes were made.
        </p>
        <p className="mt-3">
          <Link className="underline" href="/ask?q=Utah%20mortgage%20licensing">
            Ask about Utah mortgage evidence
          </Link>
        </p>
      </section>
    </main>
  );
}
