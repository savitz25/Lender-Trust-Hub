import { StateCountyLinks } from '@/components/mortgage/state-county-links';
import type { Metadata } from 'next';
import { INDIANA_SNAPSHOT as ind } from '@/lib/indiana-intelligence/snapshot';
import evidence from '@/lib/indiana-intelligence/evidence.json';
import { SITE_URL } from '@/lib/directory/categories';

export const metadata: Metadata = {
  title: 'Indiana Mortgage Lender & Loan Broker Licensing, HMDA & Enforcement | LenderTrustHub',
  description: 'Indiana splits mortgage regulation: DFI licenses mortgage lenders; the Securities Division licenses loan brokers. DFI roster, Loan Broker Act orders, 2025 Indiana-property HMDA and complaint intake.',
  alternates: { canonical: `${SITE_URL}/indiana` },
  robots: { index: true, follow: true },
};

const fmt = (n: number) => n.toLocaleString('en-US');
const usd = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

export default function IndianaPage() {
  const orders = [...evidence.sosLoanBrokerOrders.rows].sort((a, b) => b.indexDate.localeCompare(a.indexDate));
  const lenders = evidence.dfi.records;
  const multistate = evidence.multistate[0]!;
  return <main className="mx-auto max-w-5xl px-5 py-12 text-slate-900">
    <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">State intelligence · Indiana DFI + Securities Division</p>
    <h1 className="mt-3 text-4xl font-bold tracking-tight">Indiana mortgage lender and loan broker evidence</h1>
    <p className="mt-5 text-lg text-slate-700">Indiana splits mortgage licensing between two regulators. A DFI mortgage-lender license, a Securities Division loan-broker license, an NMLS identity and HMDA property activity are separate facts. This page does not rank lenders.</p>

    <section className="mt-8 grid gap-4 md:grid-cols-2" aria-label="Indiana regulatory split">
      <div className="rounded-xl border-2 border-teal-700 p-5"><p className="text-sm font-semibold text-teal-800">Department of Financial Institutions (DFI)</p><p className="mt-2 font-semibold">Mortgage Lenders · DFI-sponsored MLOs</p><p className="mt-2 text-sm text-slate-700">Consumer Credit Division: licensing, examinations, annual renewals, consumer complaints. Applications through NMLS.</p></div>
      <div className="rounded-xl border-2 border-indigo-700 p-5"><p className="text-sm font-semibold text-indigo-800">Secretary of State, Securities Division</p><p className="mt-2 font-semibold">Loan Brokers · Branch Offices · Loan Broker MLOs</p><p className="mt-2 text-sm text-slate-700">Indiana Loan Broker Act (IC 23-2.5): licensing, examinations, orders. Filings through NMLS.</p></div>
    </section>
    <p className="mt-3 text-sm text-slate-600">A DFI Mortgage Lender is not a Securities Division Loan Broker. No combined Indiana “lender” total is published; missing is not zero.</p>

    <section className="mt-10 grid gap-4 sm:grid-cols-3" aria-label="Indiana evidence summary">
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">DFI active Mortgage Lender licenses</p><p className="mt-2 text-2xl font-bold">{fmt(ind.dfi.mortgageLenderActiveLicenses)}</p><p className="mt-2 text-sm">Company licenses on DFI’s public listing; {fmt(ind.dfi.indianaAddressed)} list an Indiana address.</p></div>
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">Loan Broker Act orders, 2022–2026</p><p className="mt-2 text-2xl font-bold">{ind.loanBrokerEnforcement.loanBrokerActRows}</p><p className="mt-2 text-sm">Securities Division company orders; the Loan Broker roster itself is NOT_ACQUIRED.</p></div>
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">2025 HMDA applications</p><p className="mt-2 text-2xl font-bold">{fmt(ind.hmda.applications)}</p><p className="mt-2 text-sm">Indiana-property activity, not a licensing census.</p></div>
    </section>

    <section className="mt-12" id="dfi-lenders"><h2 className="text-2xl font-semibold">DFI Mortgage Lender roster</h2>
      <p className="mt-3 text-slate-700">The <a className="underline" href={ind.sources.dfiListing}>DFI Consumer Credit licensee listing (Mortgage Lender)</a> showed {fmt(ind.dfi.mortgageLenderListingRows)} rows for {fmt(ind.dfi.mortgageLenderActiveLicenses)} distinct companies (one company is listed twice). Each linked DFI entity page shows exactly one <em>Activated</em> Mortgage Lender license with its Indiana license number and issue date. Terminated licenses on those pages are history, not roster rows. DFI prints no NMLS ID, so rows with printed NMLS = 0 and exact NMLS bridges = 0. No company was matched by name. The listing has no DFI as-of date; it was retrieved {ind.dfi.rosterClock.retrievedAt}. Street addresses and phone numbers are not republished.</p>
      <p className="mt-3 text-slate-700">DFI also licenses mortgage loan originators (people) sponsored by a DFI-licensed or exempt lender (<a className="underline" href={ind.sources.dfiMloFaq}>MLO FAQ</a>). The DFI listing covers companies only. The DFI MLO roster is NOT_ACQUIRED, and no company profile is created from an MLO. The listing shows no separate mortgage-servicer license class.</p>
      <details className="mt-4 rounded-xl border p-4"><summary className="cursor-pointer font-semibold">All {fmt(lenders.length)} DFI Mortgage Lender licenses (company · license # · issued · HQ)</summary>
        <ul className="mt-3 divide-y text-sm">{lenders.map((r) => <li key={r.dfiEntityId} className="py-2 break-words"><span className="font-medium">{r.name}</span>{r.dba ? <span className="text-slate-600"> (dba {r.dba})</span> : null}<span className="block text-slate-600">License {r.licenseNumber} · issued {r.issued} · {r.status} · {r.city}{r.state ? `, ${r.state}` : ''}</span></li>)}</ul>
      </details>
    </section>

    <section className="mt-12" id="loan-brokers"><h2 className="text-2xl font-semibold">Securities Division Loan Brokers</h2>
      <p className="mt-3 text-slate-700">The <a className="underline" href={ind.sources.sosLoanBrokers}>Securities Division</a> licenses loan brokers, each branch office, and the mortgage loan originators and managers who work for loan brokers, all through NMLS. The Division’s <a className="underline" href={ind.sources.sosRegistrationSearch}>Registration Search</a> does not cover loan brokers and points to <a className="underline" href={ind.sources.nmls}>NMLS Consumer Access</a>. The Loan Broker company roster, branch-office roster and Loan Broker MLO roster are <strong>NOT_ACQUIRED</strong>; their counts are unknown, not zero. Verification through NMLS: KNOWN.</p>
    </section>

    <section className="mt-12" id="loan-broker-enforcement"><h2 className="text-2xl font-semibold">Loan Broker Act orders, 2022–2026</h2>
      <p className="mt-3 text-slate-700">The Division’s <a className="underline" href={ind.sources.sosAdminActions}>Administrative Action Search</a> held {fmt(ind.loanBrokerEnforcement.indexRows)} actions on {ind.loanBrokerEnforcement.retrievedAt}. {ind.loanBrokerEnforcement.taggedLoanBroker2022to2026} dated 2022–2026 carry the Loan Broker entity type; none of them is dated 2022 or 2023. Two of those orders cite only the Uniform Securities Act, so they are excluded here. That leaves {ind.loanBrokerEnforcement.loanBrokerActRows} Indiana Loan Broker Act orders, all against companies, each printing the company’s own NMLS ID. {ind.loanBrokerEnforcement.exactExistingResearchIdentities} of those NMLS IDs match an existing LenderTrustHub research identity exactly; none has a public profile, so public-profile adverse attachments = 0 and name-only adverse joins = 0. Individual co-respondents and control persons are withheld. Penalties are Indiana-only order terms. The Division says its index is not exhaustive.</p>
      <div className="mt-5 space-y-3">{orders.map((o) => <article key={o.cause} className="rounded-xl border p-4"><h3 className="font-semibold break-words">{o.respondent} <span className="font-normal text-slate-600">(company · NMLS {o.nmls})</span></h3><p className="mt-1 text-sm">Cause {o.cause} · index date {o.indexDate} · {o.actions.join(', ')}</p><p className="mt-1 text-sm text-slate-700">{o.basis}. Civil penalty {usd(o.civilPenaltyUsd)}{o.investigativeCostsUsd ? `; investigative costs ${usd(o.investigativeCostsUsd)}` : ''} ({o.scope}).</p></article>)}</div>
    </section>

    <section className="mt-12" id="dfi-enforcement"><h2 className="text-2xl font-semibold">DFI examinations and enforcement</h2>
      <p className="mt-3 text-slate-700">DFI says its <a className="underline" href={ind.sources.dfiDivision}>Consumer Credit Division</a> handles registration and licensing, examinations, annual renewals and consumer complaints. So examination capability is KNOWN, but provider-level examination results are NOT_ACQUIRED. DFI publishes no mortgage enforcement-order index; DFI order rows for 2022–2026 are NOT_ACQUIRED. Its revoked-license list shows no mortgage revocations in that window.</p>
      <article className="mt-4 rounded-xl border p-4"><h3 className="font-semibold">{multistate.respondent} <span className="font-normal text-slate-600">(company · NMLS {multistate.nmls})</span></h3><p className="mt-1 text-sm">{multistate.action}; executed {multistate.effectiveBy}. Indiana is listed as a Participating State with a per-state payment of {usd(multistate.indianaPerStatePaymentUsd)}. The {usd(multistate.multistateTotalUsd)} total is multistate, not an Indiana penalty. The Indiana signing agency is not in the extractable text.</p><a className="mt-2 inline-block text-sm underline" href={multistate.source}>Settlement agreement (CSBS copy)</a></article>
      <p className="mt-3 text-sm text-slate-600">No canonical adverse attachment was made for this row.</p>
    </section>

    <section className="mt-12" id="hmda"><h2 className="text-2xl font-semibold">2025 HMDA Indiana-property activity</h2>
      <p className="mt-3 text-slate-700">{fmt(ind.hmda.applications)} applications; {fmt(ind.hmda.originations)} originations; {fmt(ind.hmda.denials)} denials ({ind.hmda.denialApplicationPct}% of applications). {fmt(ind.hmda.distinctLeis)} reporting LEIs across {ind.hmda.counties} counties. Purchase {fmt(ind.hmda.purchase)}, refinance {fmt(ind.hmda.refinance)}, other purpose {fmt(ind.hmda.otherPurpose)}. Application loan types: conventional {fmt(ind.hmda.conventional)}, FHA {fmt(ind.hmda.fha)}, VA {fmt(ind.hmda.va)}, USDA/other {fmt(ind.hmda.usdaOther)}.</p>
      <p className="mt-2 text-sm text-slate-600">These figures sum the accepted national 2025 HMDA partition for Indiana-property counties; nothing was re-ingested. HMDA reporters are not DFI licensees or Securities Division loan brokers. Never add HMDA and licensing counts. The denial ratio is not a quality score.</p>
    </section>

    <section className="mt-12" id="complaints"><h2 className="text-2xl font-semibold">Complaints and source clocks</h2>
      <p className="mt-3 text-slate-700"><a className="underline" href={ind.sources.dfiComplaints}>DFI takes complaints</a> about lending and credit activity. The <a className="underline" href={ind.sources.sosComplaints}>Securities Division takes complaints</a> about loan-broker matters. Public provider-level complaint rows are NOT_ACQUIRED, and outcomes are REQUEST_ONLY/NOT_ACQUIRED. A complaint is not an enforcement finding.</p>
      <p className="mt-3 text-sm text-slate-600">DFI roster retrieved {ind.dfi.rosterClock.retrievedAt} (no DFI as-of date). Securities Division index retrieved {ind.loanBrokerEnforcement.retrievedAt}; order dates are the Division index dates shown above. Loan Broker roster clock: not applicable (NOT_ACQUIRED). NMLS verification is live at NMLS Consumer Access. HMDA vintage {ind.hmda.year}. Page data generated {ind.generatedAt}. There is no single Indiana as-of date. New canonical organizations 0; graph writes 0; claim eligibility changes 0. Indianapolis, Fort Wayne, Evansville and South Bend are geographic context only; there are no city pages.</p>
    </section>
    <StateCountyLinks stateSlug="indiana" stateName="Indiana" />
  </main>;
}
