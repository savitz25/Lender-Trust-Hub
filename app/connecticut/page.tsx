import type { Metadata } from 'next';
import { CONNECTICUT_SNAPSHOT as ct } from '@/lib/connecticut-intelligence/snapshot';
import rosters from '@/lib/connecticut-intelligence/rosters.json';
import { SITE_URL } from '@/lib/directory/categories';

export const metadata: Metadata = {
  title: 'Connecticut Mortgage Licenses, HMDA & Enforcement | LenderTrustHub',
  description: 'Connecticut Department of Banking mortgage company and branch license workbooks, 2025 HMDA property activity, and selected exact-NMLS enforcement orders.',
  alternates: { canonical: `${SITE_URL}/connecticut` },
  robots: { index: true, follow: true },
};

type Props = { searchParams: Promise<{ license?: string }> };
const fmt = (n: number) => n.toLocaleString('en-US');
const familyLabel: Record<string, string> = {
  lender: 'Mortgage lender', broker: 'Mortgage broker', correspondent_lender: 'Mortgage correspondent lender', servicer: 'Mortgage servicer',
};
const counts = rosters.files.map((file) => {
  const rows = rosters.records.filter((row) => row.family === file.family);
  return { ...file, companies: rows.filter((row) => row.holderGrain === 'company').length, branches: rows.filter((row) => row.holderGrain === 'branch').length };
});

export default async function ConnecticutPage({ searchParams }: Props) {
  const params = await searchParams;
  const license = typeof params.license === 'string' && /^[A-Z0-9 -]{2,32}$/i.test(params.license) ? params.license.trim().toUpperCase() : '';
  const matches = license ? rosters.records.filter((row) => row.licenseNumber.toUpperCase() === license) : [];
  return <main className="mx-auto max-w-5xl px-5 py-12 text-slate-900">
    <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">State intelligence · Connecticut</p>
    <h1 className="mt-3 text-4xl font-bold tracking-tight">Connecticut mortgage licensing and lending evidence</h1>
    <p className="mt-5 text-lg text-slate-700">The Connecticut Department of Banking regulates mortgage lenders, brokers, correspondent lenders and servicers. A Connecticut license, an NMLS identity and HMDA lending activity are separate facts. No provider is ranked here.</p>

    <section className="mt-10 grid gap-4 sm:grid-cols-3" aria-label="Connecticut evidence summary">
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">DOB license workbooks</p><p className="mt-2 text-2xl font-bold">4 classes</p><p className="mt-2 text-sm">Company and branch licenses separately; published as of {ct.licensing.asOf}.</p></div>
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">2025 HMDA applications</p><p className="mt-2 text-2xl font-bold">{fmt(ct.hmda.applications)}</p><p className="mt-2 text-sm">Connecticut-property activity, not a licensee count.</p></div>
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">Reviewed DOB order respondents</p><p className="mt-2 text-2xl font-bold">{ct.enforcement.rows.length}</p><p className="mt-2 text-sm">Selected 2022–2026 bulletin rows; not a complete enforcement census.</p></div>
    </section>

    <section className="mt-12" id="licenses"><h2 className="text-2xl font-semibold">Department of Banking license lists</h2>
      <p className="mt-3 text-slate-700">DOB’s four downloadable September 2, 2026 workbooks contain {fmt(rosters.records.length)} distinct Connecticut license-number rows. The source calls these licensees, but its files include both main-company and branch licenses. Counts below are separate classes, not a deduplicated population of Connecticut lenders or mortgage companies.</p>
      <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[610px] text-left text-sm"><thead><tr><th className="py-2 pr-3">DOB workbook</th><th className="pr-3">Company licenses</th><th className="pr-3">Branch licenses</th><th>Source</th></tr></thead><tbody>{counts.map((row) => <tr key={row.family} className="border-t"><td className="py-2 pr-3">{familyLabel[row.family]}</td><td className="pr-3">{fmt(row.companies)}</td><td className="pr-3">{fmt(row.branches)}</td><td><a className="underline" href={row.url}>DOB XLSX</a></td></tr>)}</tbody></table></div>
      <p className="mt-3 text-sm text-slate-600">Every row retains the exact printed Connecticut license name/number and its company-or-branch grain. The files print no NMLS ID field: roster rows with an exact printed NMLS ID = 0; state-roster→NMLS bridges = 0; unmatched license rows = {fmt(rosters.records.length)}. This does not mean there is no overlap. Numeric suffixes are not guessed into NMLS IDs. Live status must be confirmed through <a className="underline" href={ct.sources.verification}>DOB’s NMLS Consumer Access instructions</a>. MLO/person and exempt-entity rosters are NOT_ACQUIRED.</p>
      <form action="/connecticut" className="mt-5 flex max-w-lg gap-2"><label className="sr-only" htmlFor="license">Full Connecticut license number</label><input className="min-w-0 flex-1 rounded-lg border px-3 py-2" id="license" name="license" defaultValue={license} placeholder="Exact CT license number"/><button className="rounded-lg bg-teal-700 px-4 py-2 text-white">Find</button></form>
      {license && <div className="mt-4 rounded-xl border p-5"><h3 className="font-semibold">Connecticut license {license}</h3>{matches.length ? matches.map((row) => <p key={`${row.family}-${row.licenseNumber}`} className="mt-2 text-sm">{row.companyName} · {row.licenseName} · {row.holderGrain} · {row.city}, {row.state} · listed as licensed {ct.licensing.asOf}. Confirm current status in NMLS Consumer Access.</p>) : <p className="mt-2 text-sm">No match in the four dated workbooks. That does not establish that an entity is unlicensed; verify in NMLS Consumer Access.</p>}</div>}
    </section>

    <section className="mt-12" id="hmda"><h2 className="text-2xl font-semibold">2025 HMDA Connecticut-property activity</h2><p className="mt-3 text-slate-700">{fmt(ct.hmda.applications)} applications; {fmt(ct.hmda.originations)} originations; {fmt(ct.hmda.denials)} denials ({ct.hmda.denialApplicationPct}% of applications). {fmt(ct.hmda.distinctLeis)} reporting LEIs across {ct.hmda.countyEquivalents} Census planning-region county-equivalents. Purchase {fmt(ct.hmda.purchase)}, refinance {fmt(ct.hmda.refinance)}, other purpose {fmt(ct.hmda.otherPurpose)}. Application loan types: conventional {fmt(ct.hmda.conventional)}, FHA {fmt(ct.hmda.fha)}, VA {fmt(ct.hmda.va)}, USDA/other {fmt(ct.hmda.usdaOther)}.</p><p className="mt-2 text-sm text-slate-600">{ct.hmda.note} The existing national HMDA partition was reused; no national population was re-ingested.</p></section>

    <section className="mt-12" id="enforcement"><h2 className="text-2xl font-semibold">Selected DOB mortgage orders</h2><p className="mt-3 text-slate-700">{ct.enforcement.scope} {ct.enforcement.rows.length} respondent rows: {ct.enforcement.rows.filter((row) => row.grain === 'company').length} company and {ct.enforcement.rows.filter((row) => row.grain === 'person/MLO').length} person/MLO. Every row prints an exact NMLS number in its official bulletin. One company respondent has an exact NMLS match to an existing hub identity; no name-only attachment or graph write occurred. No Connecticut state license number was printed in these reviewed summaries. A notice’s allegations are not presented as final findings.</p>
      <div className="mt-5 space-y-3">{ct.enforcement.rows.map((row) => <article key={`${row.date}-${row.nmls}`} className="rounded-xl border p-4"><h3 className="font-semibold">{row.respondent} <span className="font-normal text-slate-600">({row.grain})</span></h3><p className="mt-1 text-sm">{row.date} · {row.action} · {row.status}</p><p className="mt-1 text-sm">Printed NMLS {row.nmls}; Connecticut license number not printed in reviewed bulletin.</p><a className="mt-2 inline-block text-sm underline" href={row.url}>DOB bulletin #{row.bulletin}</a></article>)}</div>
      <p className="mt-3 text-sm text-slate-600">Order source review: {ct.enforcement.retrievedAt}; action dates are listed above. <a className="underline" href={ct.sources.ordersIndex}>DOB administrative-orders indexes</a> contain additional matters not counted here.</p></section>

    <section className="mt-12" id="complaints"><h2 className="text-2xl font-semibold">Complaints, source clocks and gaps</h2><p className="mt-3 text-slate-700">DOB accepts <a className="underline" href={ct.sources.complaints}>mortgage complaints</a>. Provider-level complaint rows are NOT_ACQUIRED; outcomes are REQUEST_ONLY. A complaint is not an enforcement finding.</p><p className="mt-3 text-sm text-slate-600">License workbook as-of {ct.licensing.asOf}; retrieved {rosters.retrievedAt}. HMDA vintage 2025. DOB order actions carry their own dates; order review {ct.enforcement.retrievedAt}; page evidence generated {ct.generated_at}. There is no universal Connecticut as-of clock. MLO/exempt rosters, an NMLS-ID field in the DOB workbooks, comprehensive enforcement outcomes, and provider complaint records remain gaps. Net-new canonical organizations 0; graph writes 0; claim eligibility unchanged.</p></section>
  </main>;
}
