import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/directory/categories";
import { MONTANA_LENDER_SNAPSHOT as snapshot } from "@/lib/montana-intelligence/snapshot";

const fmt = (value: number) => value.toLocaleString("en-US");
const source = (url: string, label: string) => (
  <a className="underline" href={url} rel="noopener noreferrer" target="_blank">{label}</a>
);

export const metadata: Metadata = {
  title: "Montana Mortgage Licensing and HMDA Evidence | Lender TrustHub",
  description: "Montana DBFI mortgage regulatory framework, separate licensing populations, bounded enforcement observations, and distinct HMDA market activity.",
  alternates: { canonical: `${SITE_URL}/montana` },
  robots: { index: true, follow: true },
};

export default function MontanaLenderPage() {
  return <main className="mx-auto max-w-5xl px-5 py-12 text-slate-900">
    <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Statewide evidence · Montana</p>
    <h1 className="mt-3 text-4xl font-bold tracking-tight">Montana mortgage regulation and market activity</h1>
    <p className="mt-5 text-lg text-slate-700">The Montana Division of Banking and Financial Institutions (DBFI) regulates non-depository mortgage activities. Mortgage lender, mortgage broker, and mortgage servicer authority are separate license classes. Company, branch, and mortgage loan originator person records are separate grains. Current Montana licensee rows and counts are <strong>{snapshot.licenseCensus}</strong>; no license census is inferred from enforcement or HMDA activity.</p>

    <section className="mt-10 grid gap-4 sm:grid-cols-3" aria-label="Montana lender evidence">
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">Current licensing census</p><p className="mt-2 text-2xl font-bold">{snapshot.licenseCensus}</p><p className="mt-2 text-sm">DBFI directs license verification to NMLS Consumer Access. No current jurisdiction-filtered NMLS rows were acquired.</p></div>
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">DBFI enforcement page observations</p><p className="mt-2 text-2xl font-bold">{fmt(snapshot.enforcementObservations)}</p><p className="mt-2 text-sm">Action-table rows, with latest visible order dated {snapshot.latestVisibleOrderDate}. Rows are actions, not licensees or unique entities.</p></div>
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">2025 HMDA applications</p><p className="mt-2 text-2xl font-bold">{fmt(snapshot.applications)}</p><p className="mt-2 text-sm">Montana-property activity summed from {snapshot.countyRows} county rows; not a licensing population.</p></div>
    </section>

    <section className="mt-12" id="regulatory-scope">
      <h2 className="text-2xl font-semibold">Licensing scope and source limits</h2>
      <p className="mt-3 text-slate-700">DBFI states that its licensing is handled through NMLS. A company applying for mortgage authority and a branch application follow separate paths; an NMLS identity alone does not establish a specific Montana license or current status. Mortgage lender, broker, and servicer classes are not added together here. Mortgage loan originators are people; branches are not companies. Consumer lending and state-chartered financial institutions are separate regulatory populations.</p>
      <p className="mt-3 text-slate-700">Current company, branch, lender, broker, servicer, MLO, and other consumer-finance row-level populations, status distributions, and distinct counts remain NOT_ACQUIRED. No record-by-record name search or name-only adverse match was used.</p>
      <p className="mt-3">{source("https://banking.mt.gov/BFID/mortgage-consumer-finance/mortgage", "Montana DBFI mortgage and consumer-finance licensing")}{" · "}{source("https://www.nmlsconsumeraccess.org/", "NMLS Consumer Access")}</p>
    </section>

    <section className="mt-12" id="enforcement">
      <h2 className="text-2xl font-semibold">Enforcement actions are a separate record set</h2>
      <p className="mt-3 text-slate-700">The DBFI enforcement page displayed {fmt(snapshot.enforcementObservations)} table observations; the latest visible order date was {snapshot.latestVisibleOrderDate}. These are enforcement-action rows. A row may involve a person or a firm, respondents may recur, and a case may involve multiple parties. The observation count is not a count of licensees, companies, or violations across the current license population.</p>
      <p className="mt-3">{source("https://banking.mt.gov/BFID/enforcement-actions", "Montana DBFI enforcement actions")}</p>
    </section>

    <section className="mt-12" id="hmda">
      <h2 className="text-2xl font-semibold">HMDA describes lending activity on Montana property</h2>
      <p className="mt-3 text-slate-700">The already-owned 2025 HMDA county partition contains {fmt(snapshot.applications)} applications, {fmt(snapshot.originations)} originations, and {fmt(snapshot.denials)} reported denials across {snapshot.countyRows} Montana county rows. These are market observations, not Montana licensees, lender rankings, or findings of discrimination. The separate HMDA LEI summary contains {fmt(snapshot.hmdaLeiRows)} reporting-identifier rows and {fmt(snapshot.leiApplications)} applications, 115 fewer applications than the county aggregate; because the files do not reconcile exactly, the page uses only the county aggregate for statewide market totals. LEIs are not NMLS IDs and were not joined to license records.</p>
      <p className="mt-3 text-sm text-slate-600">Source vintage: HMDA 2025. The existing TrustHub partition is {snapshot.countyFile}; SHA-256 <code>{snapshot.countyFileSha256}</code>. The LEI summary is {snapshot.leiFile}; SHA-256 <code>{snapshot.leiFileSha256}</code>. These data files were already in TrustHub and were reused without a new HMDA retrieval. The data foundation commit is August 10, 2026; no source-file retrieval timestamp is recorded. HMDA activity year is not a current license-status date.</p>
      <p className="mt-3">{source("https://ffiec.cfpb.gov/data-publication/", "FFIEC HMDA data publication")}</p>
    </section>

    <section className="mt-12 border-t border-slate-200 pt-5">
      <h2 className="text-xl font-semibold">Research notes and related tools</h2>
      <p className="mt-2 text-sm text-slate-700">DBFI source and enforcement observations were reviewed in the G-B3 Montana preflight. HMDA figures reuse the repository’s existing national 2025 foundation; no new state HMDA extract or licensee entities were loaded.</p>
      <p className="mt-3"><Link className="underline" href="/ask?q=Montana%20mortgage%20licensing%20and%20HMDA%20evidence">Ask about Montana mortgage evidence</Link></p>
    </section>
  </main>;
}
