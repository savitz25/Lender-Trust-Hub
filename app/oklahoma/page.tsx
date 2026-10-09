import { StateCountyLinks } from '@/components/mortgage/state-county-links';
import type { Metadata } from "next";
import { OK_ODCC_CLASSES, OKLAHOMA_SNAPSHOT as ok } from "@/lib/oklahoma-intelligence/snapshot";
import { SITE_URL } from "@/lib/directory/categories";

export const metadata: Metadata = {
  title: "Oklahoma Mortgage Evidence and Consumer Credit Rosters | LenderTrustHub",
  description:
    "Oklahoma mortgage broker, mortgage lender, and mortgage loan originator bulk rosters were not acquired. Department of Consumer Credit class counts as of October 1, 2026 stay separate from NMLS identities. The accepted 2025 HMDA jurisdiction aggregate is 136,810 Oklahoma-property applications.",
  alternates: { canonical: `${SITE_URL}/oklahoma` },
  robots: { index: true, follow: true },
};

const fmt = (n: number) => n.toLocaleString("en-US");

export default function OklahomaLenderPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12 text-slate-900">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">State intelligence · Oklahoma Department of Consumer Credit</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Oklahoma mortgage evidence and consumer-credit rosters</h1>
      <p className="mt-5 text-lg text-slate-700">
        Mortgage broker, mortgage lender, and mortgage loan originator bulk rosters were not acquired. The Department points those classes to NMLS Consumer Access. Its other consumer-credit rosters are a different population. A company, a branch, a person, an NMLS identity, and an HMDA application stay separate. This page does not rank lenders and does not publish one Oklahoma lender total.
      </p>

      <section className="mt-10 grid gap-4 sm:grid-cols-3" aria-label="Oklahoma evidence summary">
        <div className="rounded-xl border p-5">
          <p className="text-sm text-slate-600">Mortgage broker, lender, and originator rosters</p>
          <p className="mt-2 text-2xl font-bold">NOT_ACQUIRED</p>
          <p className="mt-2 text-sm">NMLS Consumer Access is the lookup. A missing bulk file is not zero licensees. Branches were not acquired as a separate roster.</p>
        </div>
        <div className="rounded-xl border p-5">
          <p className="text-sm text-slate-600">Consumer-credit rosters</p>
          <p className="mt-2 text-2xl font-bold">{ok.sources.printedAsOfLabel}</p>
          <p className="mt-2 text-sm">Nine Department classes print an in-Oklahoma count and an all-locations count. Those columns are not added. None of them is a mortgage census.</p>
        </div>
        <div className="rounded-xl border p-5">
          <p className="text-sm text-slate-600">Accepted 2025 HMDA applications</p>
          <p className="mt-2 text-2xl font-bold">{fmt(ok.hmda.applications)}</p>
          <p className="mt-2 text-sm">This is the jurisdiction aggregate already used by Ask. It is not a license count. The county file is a different sum and does not replace it.</p>
        </div>
      </section>

      <section className="mt-12" id="mortgage">
        <h2 className="text-2xl font-semibold">Mortgage identities</h2>
        <p className="mt-3 text-slate-700">
          The <a className="underline" href={ok.sources.rosterIndex}>Department of Consumer Credit license page</a> sends Mortgage Brokers/Lenders and mortgage loan originators to <a className="underline" href={ok.sources.nmlsConsumerAccess}>NMLS Consumer Access</a>. No bulk company roster, branch roster, or person roster was downloaded. An application is not an issued license. An NMLS identifier is not an HMDA filing.
        </p>
      </section>

      <section className="mt-12" id="odcc">
        <h2 className="text-2xl font-semibold">Other consumer-credit classes</h2>
        <p className="mt-3 text-slate-700">
          The same page links class rosters whose first page prints {ok.sources.printedAsOfLabel}. The file names use {ok.sources.filenameClock}. Each class has an in-Oklahoma file and an all-locations file. Pawn brokers print the same count in both files. The other classes do not. In-Oklahoma rows are not added to all-locations rows, and the classes are not added to each other. Supervised Lenders are not mortgage lenders. Health spas, pawn brokers, and precious-metal dealers are not mortgage companies.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="mb-2 text-left">Printed roster totals. Not a mortgage census. The two columns are not added.</caption>
            <thead>
              <tr>
                <th className="py-2 pr-3">Class</th>
                <th className="pr-3">In Oklahoma</th>
                <th>All locations</th>
              </tr>
            </thead>
            <tbody>
              {OK_ODCC_CLASSES.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="py-2 pr-3">{row.label}</td>
                  <td className="pr-3">{fmt(row.inOklahoma)}</td>
                  <td>{fmt(row.allLocations)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12" id="hmda">
        <h2 className="text-2xl font-semibold">2025 HMDA Oklahoma-property activity</h2>
        <p className="mt-3 text-slate-700">
          The accepted jurisdiction aggregate already used by Ask records {fmt(ok.hmda.applications)} applications, {fmt(ok.hmda.originations)} originations, and {fmt(ok.hmda.denials)} denials ({ok.hmda.denialApplicationPct}% of the accepted application count). The existing county file has {ok.hmda.countyFileCounties} county rows and sums to {fmt(ok.hmda.countyFileApplications)} applications and {fmt(ok.hmda.countyFileDenials)} denials, with the same {fmt(ok.hmda.countyFileOriginations)} originations. This page does not replace the accepted aggregate with that county-file sum. The difference is unresolved. {fmt(ok.hmda.leiSummaryRows)} LEI summary rows are reporting identities, not Department of Consumer Credit licenses and not NMLS records.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          A separate major-market slice has {ok.hmda.majorMarketSliceRows} county rows and is not the statewide file. The denial/application ratio is not a lender quality score. HMDA applications are not license rows. This page does not publish a county or city route.
        </p>
      </section>

      <section className="mt-12" id="other">
        <h2 className="text-2xl font-semibold">What was not acquired</h2>
        <p className="mt-3 text-slate-700">
          Mortgage enforcement orders were <strong>NOT_ACQUIRED</strong>. Complaints were <strong>NOT_ACQUIRED</strong>. A complaint is not a violation, and a missing order file is not zero orders. Exact canonical attachments: {ok.exactCanonicalAttachments}. Name-only adverse joins: {ok.nameOnlyAdverseJoins}. An FDIC Oklahoma institution file is already in this repository. It was not recounted here. Those institutions are banks, not mortgage licenses. None of those gaps is filled with zero.
        </p>
      </section>

      <section className="mt-12" id="clocks">
        <h2 className="text-2xl font-semibold">Source clocks and limits</h2>
        <p className="mt-3 text-sm text-slate-600">
          Roster index retrieved {ok.retrievedAt}. Printed roster date {ok.sources.printedAsOfLabel}. Filename clock {ok.sources.filenameClock}. HMDA vintage {ok.hmda.year}. The published application count is the accepted jurisdiction aggregate. The county file was not re-downloaded and was not substituted for that aggregate. Page data generated {ok.generatedAt}. No single clock covers consumer-credit rosters, NMLS identities, and HMDA. Net-new canonical organizations {ok.newCanonicalOrganizations}. Graph writes {ok.graphWrites}. Claim eligibility changes {ok.claimEligibilityChanges}. Oklahoma City, Tulsa, Norman, Edmond, Lawton, and Broken Arrow are geography only. This page publishes no city or county route.
        </p>
      </section>
      <StateCountyLinks stateSlug="oklahoma" stateName="Oklahoma" />
    </main>
  );
}
