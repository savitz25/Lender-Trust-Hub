import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/directory/categories';

const banking = 'https://dlr.sd.gov/banking/';
const mortgage = 'https://dlr.sd.gov/banking/mortgage_licenses/default.aspx';
const lenderInfo = 'https://dlr.sd.gov/banking/mortgage_licenses/mortgage_lender_license_information.aspx';
const moneyLenders = 'https://dlr.sd.gov/banking/money_lenders/default.aspx';
const consumerInfo = 'https://dlr.sd.gov/banking/consumers/information_for_consumers.aspx';
const laws = 'https://dlr.sd.gov/banking/laws_rules.aspx';
const nmls = 'https://www.nmlsconsumeraccess.org/';
const hmda = 'https://ffiec.cfpb.gov/data-publication/modified-lar';
const hmdaRelease = 'https://www.consumerfinance.gov/about-us/newsroom/2025-hmda-data-on-mortgage-lending-now-available/';
const fdic = 'https://banks.data.fdic.gov/bankfind-suite/bankfind';

const source = (url: string, label: string) => (
  <a className="underline underline-offset-2" href={url} rel="noopener noreferrer" target="_blank">{label}</a>
);

export const metadata: Metadata = {
  title: 'South Dakota mortgage and financial licensing evidence | LenderTrustHub',
  description: 'South Dakota Division of Banking mortgage licensing framework, NMLS source limits, existing 2025 HMDA activity, and separate bank records.',
  alternates: { canonical: `${SITE_URL}/south-dakota` },
  robots: { index: true, follow: true },
};

export default function SouthDakotaLenderPage() {
  return <main className="mx-auto max-w-4xl px-4 py-10 text-slate-900">
    <nav aria-label="Breadcrumb" className="mb-4 text-sm"><Link href="/" className="underline">Home</Link> / South Dakota research</nav>
    <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">State financial regulation · South Dakota Division of Banking</p>
    <h1 className="mt-3 text-4xl font-bold tracking-tight">South Dakota mortgage and financial licensing evidence</h1>
    <p className="mt-5 text-lg text-slate-700">The South Dakota Department of Labor and Regulation, Division of Banking, supervises state-chartered banks and specified non-depository financial license classes. Its mortgage framework distinguishes company licenses and individual mortgage loan originator licenses. This page reports the regulatory structure and dated evidence available in TrustHub; it does not infer a license census from lending activity or bank records.</p>

    <section className="mt-10 rounded-xl border p-5" aria-labelledby="licensing-populations">
      <h2 id="licensing-populations" className="text-2xl font-semibold">Mortgage and consumer-finance populations</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-slate-700">
        <li>Mortgage lender/servicer companies: a company license class; current source-native rows and status counts <strong>NOT_ACQUIRED</strong>.</li>
        <li>Mortgage brokerage companies: a separate company class for placing loans with investors for a fee without servicing them; current rows <strong>NOT_ACQUIRED</strong>.</li>
        <li>Mortgage loan originators: licensed individuals, separate from companies; current person rows and status counts <strong>NOT_ACQUIRED</strong>.</li>
        <li>Branches and locations: separate from the licensed company. The current location population and counts are <strong>NOT_ACQUIRED</strong>.</li>
        <li>Exempt mortgage company registration: an optional registration class for qualifying exempt companies that employ MLOs; it is not the same as a mortgage lender license.</li>
        <li>Nonresidential-only mortgage lenders: a distinct license path outside NMLS under the state’s stated framework; current rows <strong>NOT_ACQUIRED</strong>.</li>
        <li>Money lenders are a separate consumer-finance class under SDCL Chapter 54-4; they are not added to mortgage company or MLO populations.</li>
      </ul>
      <p className="mt-3 text-sm text-slate-700">The Division links to NMLS Consumer Access for public licensee lookup. That lookup supports individual searches; no free current statewide bulk roster was acquired, and no record-by-record scrape or paid data order was used. A missing extract is NOT_ACQUIRED, not zero. The Division states mortgage licenses expire December 31 and renewal requests are filed through NMLS by December 1.</p>
    </section>

    <section className="mt-10 rounded-xl border p-5" aria-labelledby="hmda-activity">
      <h2 id="hmda-activity" className="text-2xl font-semibold">Existing 2025 HMDA market activity</h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-700">The existing TrustHub 2025 South Dakota HMDA slice contains 19 market rows, 1,280 lender–market activity observations, 333 LEI state-summary rows, and 119 high-confidence LEI-to-directory mappings across 15 named major markets. These are reporting-vintage market and identity-mapping observations, not licenses, branches, or MLO persons. The existing slice was reused without reloading.</p>
      <p className="mt-3 text-sm text-slate-700"><strong>Source clock:</strong> 2025 HMDA reporting vintage; CFPB announced the data release on March 31, 2026. HMDA activity does not establish South Dakota licensing status.</p>
      <p className="mt-3 text-sm">{source(hmda, 'CFPB/FFIEC HMDA data publication')} · {source(hmdaRelease, 'CFPB 2025 HMDA release')}</p>
    </section>

    <section className="mt-10 rounded-xl border p-5" aria-labelledby="bank-records">
      <h2 id="bank-records" className="text-2xl font-semibold">Bank records remain separate</h2>
      <p className="mt-3 text-sm text-slate-700">The retained TrustHub FDIC dataset contains 56 South Dakota bank records with 56 distinct FDIC certificate IDs. The retained file does not include a source refresh clock, so this is a stored federal bank-record observation, not a verified current Division of Banking charter roster. It includes institutions with different primary federal regulators and is not a mortgage-license population. State-chartered banks and trust companies remain distinct regulator populations.</p>
      <p className="mt-3 text-sm">{source(fdic, 'FDIC BankFind Suite')} · {source(banking, 'South Dakota Division of Banking')}</p>
    </section>

    <section className="mt-10 rounded-xl bg-slate-50 p-5" aria-label="Official sources and clocks">
      <h2 className="text-lg font-semibold">Official sources and clocks</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 text-sm">
        <li>{source(mortgage, 'Division of Banking mortgage-license classes and renewals')} — company, broker, exempt-company, nonresidential lender, MLO, and renewal distinctions; checked October 14, 2026.</li>
        <li>{source(lenderInfo, 'Mortgage lender license information')} — statutory scope and separate nonresidential application path; checked October 14, 2026.</li>
        <li>{source(moneyLenders, 'Division of Banking money-lender licensing')} and {source(laws, 'Division of Banking laws and regulated entity classes')} — separate consumer-finance and charter populations; checked October 14, 2026.</li>
        <li>{source(consumerInfo, 'Division of Banking consumer information')} and {source(nmls, 'NMLS Consumer Access')} — public licensee lookup paths; no statewide roster rows acquired.</li>
      </ul>
      <p className="mt-3 text-sm text-slate-600">Company, branch, MLO person, nonresidential lender, money lender, state-chartered institution, FDIC bank record, and HMDA observation remain separate. No combined licensing or finance total, status distribution, or enforcement count is inferred.</p>
    </section>
  </main>;
}
