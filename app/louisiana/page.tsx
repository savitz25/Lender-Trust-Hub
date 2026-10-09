import { StateCountyLinks } from '@/components/mortgage/state-county-links';
import type { Metadata } from 'next';
import { LOUISIANA_SNAPSHOT as la } from '@/lib/louisiana-intelligence/snapshot';
import { SITE_URL } from '@/lib/directory/categories';

export const metadata: Metadata = {
  title: 'Louisiana Mortgage Licensing, HMDA & OFI Evidence | LenderTrustHub',
  description: 'Louisiana OFI originator-under-lender row items, license classes not separately counted, 2025 Louisiana-property HMDA activity, and complaint intake.',
  alternates: { canonical: `${SITE_URL}/louisiana` },
  robots: { index: true, follow: true },
};

const fmt = (n: number) => n.toLocaleString('en-US');

export default function LouisianaPage() {
  return <main className="mx-auto max-w-5xl px-5 py-12 text-slate-900">
    <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">State intelligence · Louisiana OFI</p>
    <h1 className="mt-3 text-4xl font-bold tracking-tight">Louisiana mortgage licensing and lending evidence</h1>
    <p className="mt-5 text-lg text-slate-700">The Louisiana Office of Financial Institutions (OFI), Residential Mortgage Lending, publishes mortgage licensing tables. An OFI row, an NMLS identity, and HMDA property activity are separate facts. This page does not rank lenders and does not publish a combined Louisiana lender total.</p>

    <section className="mt-10 grid gap-4 sm:grid-cols-3" aria-label="Louisiana evidence summary">
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">Originator-under-lender row items</p><p className="mt-2 text-2xl font-bold">{fmt(la.licensing.originatorUnderLenderRowItems)}</p><p className="mt-2 text-sm">Printed {la.licensing.originatorUnderLenderClock}. The same lender name repeats once per originator. Not a lender, broker, or distinct-person census.</p></div>
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">2025 HMDA applications</p><p className="mt-2 text-2xl font-bold">{fmt(la.hmda.applications)}</p><p className="mt-2 text-sm">Louisiana-property market observations, not an OFI license count.</p></div>
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">License class counts</p><p className="mt-2 text-2xl font-bold">NOT_ACQUIRED</p><p className="mt-2 text-sm">Lender, broker, branch, person, and servicer classes stay separate. OFI did not print separate class counts.</p></div>
    </section>

    <section className="mt-12" id="licenses"><h2 className="text-2xl font-semibold">OFI mortgage license tables</h2>
      <p className="mt-3 text-slate-700"><a className="underline" href={la.sources.originatorsByLender}>OFI’s Active Residential Mortgage Lender Originators by Lender table</a> (the same items also appear on <a className="underline" href={la.sources.originatorsByLenderAlias}>Originators by Lender</a>) printed “Last updated: October 05, 2026 at 06:26 AM – {fmt(la.licensing.originatorUnderLenderRowItems)} total items.” Those are row items. Columns are the company name and address, a phone, and the originator’s name and status. There is no NMLS ID column. Distinct companies and distinct persons were not deduped and stay unknown, not zero.</p>
      <p className="mt-3 text-slate-700"><a className="underline" href={la.sources.licenseesWithExamDates}>A separate licensees-with-exam-dates table</a> printed 920 items at the same clock under “Active Residential Mortgage Lender Licensees.” That table has no lender, broker, or branch column, so 920 is not a class count and is not added to the {fmt(la.licensing.originatorUnderLenderRowItems)} originator rows. The <a className="underline" href={la.sources.fees}>OFI fee schedule</a> prices a combined lender/broker application and an originator license. It does not print separate lender, broker, branch, or servicer counts. No separate servicer license count was published.</p>
      <p className="mt-3 text-slate-700"><a className="underline" href={la.sources.nmls}>NMLS Consumer Access</a> is search-only license verification. It is not a bulk Louisiana roster. An NMLS ID does not itself establish an OFI license. Mortgage lender, mortgage broker, branch, and person counts are <strong>NOT_ACQUIRED</strong>. HMDA applications are not a license count.</p>
    </section>

    <section className="mt-12" id="hmda"><h2 className="text-2xl font-semibold">2025 HMDA Louisiana-property activity</h2>
      <p className="mt-3 text-slate-700">{fmt(la.hmda.applications)} applications; {fmt(la.hmda.originations)} originations; {fmt(la.hmda.denials)} denials ({la.hmda.denialApplicationPct}% of applications). {fmt(la.hmda.distinctLeis)} reporting LEIs across {la.hmda.counties} parish rows in the county-market file. Purchase {fmt(la.hmda.purchase)}, refinance {fmt(la.hmda.refinance)}, other purpose {fmt(la.hmda.otherPurpose)}. Application loan types: conventional {fmt(la.hmda.conventional)}, FHA {fmt(la.hmda.fha)}, VA {fmt(la.hmda.va)}, USDA/other {fmt(la.hmda.usdaOther)}.</p>
      <p className="mt-2 text-sm text-slate-600">These figures sum the accepted Louisiana-property 2025 HMDA county slice. They are market observations, not lenders. The national HMDA spine was reused. The denial/application ratio is not a lender quality score or a license measure, and it is not added to OFI row items.</p>
    </section>

    <section className="mt-12" id="enforcement"><h2 className="text-2xl font-semibold">OFI enforcement</h2>
      <p className="mt-3 text-slate-700">A bounded OFI residential-mortgage enforcement corpus was <strong>NOT_ACQUIRED</strong>. {la.enforcement.scope} Exact canonical attachments: {la.enforcement.exactCanonicalAttachments}. Name-only adverse joins: {la.enforcement.nameOnlyAdverseJoins}. CFPB complaints are not OFI orders.</p>
    </section>

    <section className="mt-12" id="complaints"><h2 className="text-2xl font-semibold">Complaints and source clocks</h2>
      <p className="mt-3 text-slate-700"><a className="underline" href={la.sources.complaints}>OFI accepts written residential mortgage complaints</a> for lenders, brokers, and originators by mail or fax. Intake is known. Public provider-level complaint rows were NOT_ACQUIRED; outcomes are REQUEST_ONLY/NOT_ACQUIRED. A complaint is not an enforcement finding.</p>
      <p className="mt-3 text-sm text-slate-600">Originator-under-lender table clock {la.licensing.originatorUnderLenderClock}; pages retrieved {la.retrievedAt}. HMDA vintage {la.hmda.year}. Enforcement corpus NOT_ACQUIRED. Page data generated {la.generatedAt}. No universal Louisiana as-of date. Net-new canonical organizations 0; graph writes {la.graphWrites}; claim eligibility changes 0. New Orleans, Baton Rouge, Shreveport, and Lafayette are geographic context only; no parish or city intelligence pages.</p>
    </section>
    <StateCountyLinks stateSlug="louisiana" stateName="Louisiana" />
  </main>;
}
