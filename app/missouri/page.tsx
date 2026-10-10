import { StateCountyLinks } from '@/components/mortgage/state-county-links';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import { SITE_URL } from '@/lib/directory/categories';
import snapshot from '@/data/missouri/mo-lend-001/accepted-snapshot.json';

export const metadata: Metadata = {
  title: 'Missouri Mortgage Licensing and HMDA Evidence',
  description: 'Missouri Division of Finance directory observations for mortgage broker companies, branches and MLO people, kept separate from 2025 HMDA market activity and orders.',
  alternates: { canonical: `${SITE_URL}/missouri` },
  robots: { index: true, follow: true },
};

const fmt = (value: number) => value.toLocaleString('en-US');

export default function MissouriLenderPage() {
  return <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebPage', name: 'Missouri mortgage licensing and HMDA evidence', url: `${SITE_URL}/missouri` }} />
    <header className="border-b pb-8"><p className="text-sm font-semibold uppercase tracking-wide text-blue-800">Missouri Division of Finance</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Missouri mortgage licensing and market evidence</h1><p className="mt-3 max-w-3xl text-slate-700">Missouri licenses residential mortgage broker companies and mortgage loan originators. A branch is a location record, an MLO is a person, and an HMDA LEI is a market-reporting institution. None of these is interchangeable.</p></header>

    <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="Division of Finance directory observations">
      <article className="rounded-xl border p-5"><strong className="text-3xl">{fmt(snapshot.brokerRows)}</strong><h2 className="mt-2 text-lg font-semibold">Mortgage broker company rows</h2><p className="text-sm text-slate-700">{fmt(snapshot.distinctBrokerLicenseNumbers)} distinct printed license numbers. A company row is not a branch or MLO.</p></article>
      <article className="rounded-xl border p-5"><strong className="text-3xl">{fmt(snapshot.branchRows)}</strong><h2 className="mt-2 text-lg font-semibold">Mortgage broker branch rows</h2><p className="text-sm text-slate-700">{fmt(snapshot.distinctPrintedBranchLicenseNumbers)} rows have distinct printed branch numbers; {fmt(snapshot.branchRowsWithoutPrintedLicenseNumber)} have no printed number. A branch is not another company.</p></article>
      <article className="rounded-xl border p-5"><strong className="text-3xl">{fmt(snapshot.mloPersonRows)}</strong><h2 className="mt-2 text-lg font-semibold">MLO person rows</h2><p className="text-sm text-slate-700">{fmt(snapshot.distinctPrintedMloLicenseNumbers)} distinct nonblank printed license numbers. Multiple rows can describe one person at different addresses; {fmt(snapshot.mloRowsWithoutPrintedLicenseNumber)} rows have no number.</p></article>
    </section>

    <section className="mt-10 max-w-3xl space-y-4 text-sm leading-relaxed text-slate-700"><h2 className="text-xl font-semibold text-slate-950">How to read the licensing evidence</h2>
      <p>The <a className="underline" href={snapshot.directoryUrl}>Division of Finance Bank &amp; Licensee Search</a> supplied all {fmt(snapshot.brokerRows + snapshot.branchRows)} company and branch observations under its Mortgage Broker filter and {fmt(snapshot.mloPersonRows)} person observations under its MLO filter. The pages were retrieved {snapshot.directoryRetrievedAt} and {snapshot.mloDirectoryRetrievedAt}. The directory is a search observation. It does not print a separate status or effective date on each row, so these counts are not a guaranteed live license census. Verify a named record directly with DoF and <a className="underline" href={snapshot.nmlsUrl}>NMLS Consumer Access</a>.</p>
      <p>The <a className="underline" href={snapshot.mortgageLicensingUrl}>Missouri mortgage licensing rules</a> cover brokering, funding, servicing or purchasing residential loans unless an exemption applies. The public list labels Mortgage Broker and Mortgage Broker Branch; it does not split lender and servicer classes into separate rows. We do not infer that class from a name, address or HMDA activity. Printed directory numbers were not independently verified as NMLS identities. Branch-to-company and MLO-to-company affiliations were not joined by name.</p>
      <h2 className="text-xl font-semibold text-slate-950">HMDA market observations</h2><p>The previously held {snapshot.hmdaYear} Missouri HMDA slice has {fmt(snapshot.hmdaLeiStateSummaryRows)} LEI state-summary rows and {fmt(snapshot.hmdaDistinctLei)} distinct LEIs. HMDA describes applications and originations tied to Missouri property; it is not a DoF license list. No HMDA LEI was promoted into state licensing by this page, and the HMDA slice was not reloaded.</p>
      <h2 className="text-xl font-semibold text-slate-950">Orders and complaints</h2><p>A bounded <a className="underline" href={snapshot.ordersUrl}>DoF removal and prohibition index</a> has {fmt(snapshot.orderIndexRows)} text summaries; {fmt(snapshot.orderRowsExplicitlyMentioningChapter443)} explicitly mention Chapter 443 mortgage activity. The index mixes banks, mortgage and other regulated entities. It is not a mortgage enforcement census. There are {snapshot.exactOrderAttachments} exact order attachments to company or MLO directory records because the index summaries lack a verified identifier bridge. A shared name is not an adverse match. A consumer complaint, if filed, is not a finding.</p>
      <h2 className="text-xl font-semibold text-slate-950">Coverage limits</h2><ul className="list-disc space-y-1 pl-5"><li>Company, branch and person rows stay separate; no combined provider total or rating.</li><li>Current per-license status, lender/servicer subclass, branch-parent links, NMLS identity confirmation and HMDA-license bridges: NOT_ACQUIRED.</li><li>Existing canonical matches: {snapshot.existingCanonicalMatches}. Net-new entities and evidence attachments: {snapshot.netNewEntities}. No city or county work.</li><li>DoF directory retrieval and 2025 HMDA reporting year are separate clocks. Neither is a license effective date.</li></ul>
    </section>
    <StateCountyLinks stateSlug="missouri" stateName="Missouri" />
  </main>;
}
