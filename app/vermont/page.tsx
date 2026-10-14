import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/directory/categories";

const DFR = "https://dfr.vermont.gov/banking/financial-services/lender";
const servicers =
  "https://dfr.vermont.gov/banking/financial-services/loan-servicers";
const NMLS = "https://www.nmlsconsumeraccess.org/";
const HMDA = "https://ffiec.cfpb.gov/data-publication/modified-lar";
const source = (url: string, label: string) => (
  <a
    className="underline underline-offset-2"
    href={url}
    rel="noopener noreferrer"
    target="_blank"
  >
    {label}
  </a>
);

export const metadata: Metadata = {
  title: "Vermont mortgage and financial licensing evidence",
  description:
    "Vermont Department of Financial Regulation licensing sources and separate HMDA market activity.",
  alternates: { canonical: `${SITE_URL}/vermont` },
  robots: { index: true, follow: true },
};

export default function VermontLenderPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm">
        <Link href="/" className="underline">
          Home
        </Link>{" "}
        / Vermont
      </nav>
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
        State financial regulation · Vermont DFR
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">
        Vermont mortgage and financial licensing evidence
      </h1>
      <p className="mt-5 text-lg text-slate-700">
        The Vermont Department of Financial Regulation administers mortgage
        lender licensing. Mortgage company licenses are processed through NMLS;
        each location requires a separate branch license. Company, branch, and
        mortgage loan originator person records remain distinct.
      </p>
      <section className="mt-10 rounded-xl border p-5">
        <h2 className="text-2xl font-semibold">
          Current licensing populations
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-sm">
          <li>
            Mortgage lenders and brokers: current Vermont-jurisdiction bulk rows
            and count NOT_ACQUIRED.
          </li>
          <li>
            Mortgage servicers: separate license class; current bulk rows
            NOT_ACQUIRED.
          </li>
          <li>Branches: separately licensed locations, not companies.</li>
          <li>
            MLOs: individual persons, not company records; current bulk rows
            NOT_ACQUIRED.
          </li>
          <li>
            Other financial licenses and state-chartered institutions are not
            included in a mortgage license total.
          </li>
        </ul>
        <p className="mt-3 text-sm">
          DFR and NMLS provide live lookup paths. No date-stamped free statewide
          company, branch, or person export was acquired in this pass.
        </p>
      </section>
      <section className="mt-10" id="hmda">
        <h2 className="text-2xl font-semibold">
          Existing 2025 Vermont HMDA evidence
        </h2>
        <p className="mt-3 text-slate-700">
          The repository already holds 2025 HMDA Vermont slices: 1,160
          lender/county activity observations, 278 LEI state-summary rows, and
          75 high-confidence LEI-to-directory mappings. The source file covers
          14 counties. These are market activity and matching observations, not
          state license counts; no HMDA data was reloaded.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          HMDA vintage 2025; existing source snapshot. LEI, company license,
          branch, and MLO person populations are different grains.
        </p>
        <p className="mt-2">
          {source(HMDA, "CFPB/FFIEC HMDA data publication")}
        </p>
      </section>
      <section className="mt-10 border-t pt-6">
        <h2 className="text-xl font-semibold">Authority and lookup sources</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-sm">
          <li>{source(DFR, "Vermont DFR lender licensing")}</li>
          <li>{source(servicers, "Vermont DFR loan servicers")}</li>
          <li>{source(NMLS, "NMLS Consumer Access live search")}</li>
        </ul>
        <p className="mt-4 text-sm">
          Regulator and NMLS pages checked October 14, 2026; live sources, not
          dated roster extracts. HMDA describes activity, not licensure.
        </p>
      </section>
    </main>
  );
}
