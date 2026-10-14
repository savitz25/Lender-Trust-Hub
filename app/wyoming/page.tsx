import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/directory/categories";

const banking = "https://wyomingbankingdivision.wyo.gov/mortgage-lending/licensing-and-renewal";
const originators = "https://wyomingbankingdivision.wyo.gov/mortgage-lending/mortgage-loan-originators";
const consumerLending = "https://wyomingbankingdivision.wyo.gov/consumer-lending/license-and-registration";
const licenseeList = "https://wyomingbankingdivision.wyo.gov/consumer-lending/licensee-list";
const mortgagePage = "https://wyomingbankingdivision.wyo.gov/mortgage-lending/mortgage-loan-originator-and-mortgage-lenderbroker-licensees";
const nmls = "https://www.nmlsconsumeraccess.org/";
const hmda = "https://ffiec.cfpb.gov/data-publication/modified-lar";

export const metadata: Metadata = {
  title: "Wyoming mortgage and consumer finance licensing evidence",
  description: "Wyoming Division of Banking mortgage and consumer finance licensing sources, with company, branch, person, and HMDA grains kept separate.",
  alternates: { canonical: `${SITE_URL}/wyoming` },
  robots: { index: true, follow: true },
};

export default function WyomingLenderPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm"><Link href="/" className="underline">Home</Link> / Wyoming</nav>
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">State financial regulation · Wyoming Division of Banking</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Wyoming mortgage and consumer finance licensing evidence</h1>
      <p className="mt-5 text-lg text-slate-700">The Wyoming Division of Banking administers mortgage licensing, with mortgage activities handled through NMLS. Current mortgage company, branch, and MLO-person bulk populations were not acquired as dated free statewide extracts.</p>
      <section className="mt-10 rounded-xl border p-5">
        <h2 className="text-2xl font-semibold">Licensing populations</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-sm">
          <li>Mortgage lenders and brokers: company license cohort; current dated roster NOT_ACQUIRED.</li>
          <li>Branches: distinct licensed locations, not companies; current dated roster NOT_ACQUIRED.</li>
          <li>Mortgage loan originators: individual persons, not companies; current dated roster NOT_ACQUIRED.</li>
          <li>Mortgage servicers and other consumer-lending license classes are separate populations; no combined finance total is published.</li>
          <li>UCCC consumer-credit licensee listings do not represent a mortgage-lender census.</li>
        </ul>
        <p className="mt-3 text-sm">NMLS and regulator pages are live search sources; no large-scale individual search scraping was performed.</p>
      </section>
      <section className="mt-10" id="hmda">
        <h2 className="text-2xl font-semibold">Existing 2025 HMDA evidence</h2>
        <p className="mt-3 text-slate-700">The repository already holds a 2025 HMDA Wyoming slice with 1,149 lender-county activity observations across 11 county markets, 356 LEI state-summary rows, and 122 high-confidence LEI-to-directory mappings. These are source-vintage market-activity and identity-mapping observations, not licensing records. The existing evidence was reused without reloading.</p>
        <p className="mt-2 text-sm text-slate-600">HMDA vintage 2025. Company licenses, branches, MLO persons, and LEIs remain different grains.</p>
        <p className="mt-2"><a className="underline" href={hmda} target="_blank" rel="noopener noreferrer">CFPB/FFIEC HMDA data publication</a></p>
      </section>
      <section className="mt-10 border-t pt-6">
        <h2 className="text-xl font-semibold">Authority and lookup sources</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-sm">
          <li><a className="underline" href={banking} target="_blank" rel="noopener noreferrer">Mortgage lending licensing and renewal</a></li>
          <li><a className="underline" href={originators} target="_blank" rel="noopener noreferrer">Mortgage loan originators</a></li>
          <li><a className="underline" href={mortgagePage} target="_blank" rel="noopener noreferrer">Mortgage lender/broker and MLO licensee page</a></li>
          <li><a className="underline" href={consumerLending} target="_blank" rel="noopener noreferrer">Consumer lending licenses and registrations</a></li>
          <li><a className="underline" href={licenseeList} target="_blank" rel="noopener noreferrer">Consumer lending licensee list</a></li>
          <li><a className="underline" href={nmls} target="_blank" rel="noopener noreferrer">NMLS Consumer Access</a></li>
        </ul>
        <p className="mt-4 text-sm">Regulator and NMLS source pages checked October 14, 2026; live lookup sources rather than dated statewide roster extracts. HMDA reports activity, not licensure.</p>
      </section>
    </main>
  );
}
