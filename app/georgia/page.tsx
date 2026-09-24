import type { Metadata } from "next";
import { SITE_URL } from "@/lib/directory/categories";
import {
  GA_DBF_ENFORCEMENT,
  GA_DBF_MLO,
  GA_DBF_MORTGAGE,
  GA_DBF_VERIFY,
  GA_NMLS_ACCESS,
  GEORGIA_INTELLIGENCE_GATE,
} from "@/lib/georgia-intelligence/publication";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const url = `${SITE_URL}${GEORGIA_INTELLIGENCE_GATE.path}`;
  return {
    title: GEORGIA_INTELLIGENCE_GATE.title,
    description: GEORGIA_INTELLIGENCE_GATE.description,
    robots: { index: true, follow: true },
    alternates: { canonical: url },
    openGraph: {
      title: GEORGIA_INTELLIGENCE_GATE.title,
      description: GEORGIA_INTELLIGENCE_GATE.description,
      url,
    },
  };
}

const CLASSES = [
  {
    label: "Mortgage broker",
    grain: "Company license",
    coverage: "NOT_ACQUIRED as a Georgia-only extract",
    note: "DBF licenses this class through NMLS. Verify the company NMLS ID. A broker license is not a lender license and not a branch.",
  },
  {
    label: "Mortgage lender",
    grain: "Company license",
    coverage: "NOT_ACQUIRED as a Georgia-only extract",
    note: "Same NMLS identity spine. Do not add broker and lender rows together and call the sum Georgia lenders.",
  },
  {
    label: "Mortgage loan originator",
    grain: "Person",
    coverage: "NOT_ACQUIRED as a public person directory",
    note: "An MLO is not a company. This hub does not publish a Georgia MLO census.",
  },
  {
    label: "Branch",
    grain: "Location under a company",
    coverage: "NOT_ACQUIRED as a Georgia branch census",
    note: "A Georgia branch surrender is filed in NMLS with the company. A branch is not an extra lender.",
  },
];

export default function GeorgiaLenderPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Georgia · statewide</p>
      <h1 className="mt-2 text-3xl font-bold text-[#0A2540]">Georgia mortgage licensing</h1>
      <p className="mt-4 text-sm leading-relaxed text-zinc-700">
        The Georgia Department of Banking and Finance licenses mortgage brokers, mortgage lenders, and mortgage loan originators under the Georgia Residential Mortgage Act. The department uses NMLS to license and manage those companies and individuals. NMLS is the system state regulators use. It is not a federal-only list, and it is not a second identity beside a Georgia license number when the regulator&apos;s public instruction is to look up the NMLS ID.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        This page does not publish a count of Georgia lenders. No parallel Georgia roster was loaded. Federal HMDA research stays on the existing national HMDA pipeline and is not rebuilt here.
      </p>
      <p className="mt-3 text-xs text-slate-500">
        Regulator pages retrieved 2026-09-23. No license effective date, expiration date, or order date is stored on this page because no Georgia license or final-order extract was acquired. generated_at 2026-09-23.
      </p>
      <p className="mt-4 flex flex-wrap gap-3 text-sm">
        <a className="text-emerald-800 underline" href={GA_NMLS_ACCESS}>NMLS Consumer Access</a>
        <a className="text-emerald-800 underline" href={GA_DBF_VERIFY}>DBF: verify a license or final order</a>
        <a className="text-emerald-800 underline" href={GA_DBF_MORTGAGE}>DBF: mortgage brokers and lenders</a>
        <a className="text-emerald-800 underline" href={GA_DBF_MLO}>DBF: mortgage loan originators</a>
      </p>

      <h2 className="mt-10 text-xl font-semibold text-[#0A2540]">Credential grains</h2>
      <ul className="mt-4 space-y-4">
        {CLASSES.map((row) => (
          <li key={row.label} className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="font-semibold">{row.label}</p>
            <p className="mt-1 text-sm">Grain: {row.grain}</p>
            <p className="mt-1 text-sm">Coverage: {row.coverage}. {row.note}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-xl font-semibold text-[#0A2540]">Enforcement</h2>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        DBF states that final orders against licensed mortgage companies and individuals are published on NMLS Consumer Access, under Regulatory Actions, and that administrative-action search was removed from the department website. This hub did not download those orders into a Georgia table and did not attach any order by name. Coverage of a Georgia final-order extract is NOT_ACQUIRED. Confirm a specific NMLS ID on Consumer Access.
      </p>
      <p className="mt-3 text-sm">
        <a className="text-emerald-800 underline" href={GA_DBF_ENFORCEMENT}>DBF non-depository enforcement notice</a>
      </p>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        Unauthorized-banking cease-and-desist orders on the DBF site are about unchartered banks and restricted words such as &quot;bank.&quot; They are not a mortgage-license enforcement list and are not ingested here.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-[#0A2540]">Complaints</h2>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        DBF says confidentiality laws prevent it from disclosing or discussing specific complaints against licensees. Complaint-level rows are NOT_PUBLIC. BBB or review sites are not a substitute. CFPB mortgage complaints, where this hub already holds them, remain a federal complaint grain and are not DBF findings.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-[#0A2540]">Out of scope</h2>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        Installment lenders, money transmitters, and check cashers are DBF classes. They are not added to the mortgage company population in this sprint. County deeds, foreclosures, UCC filings, and corporate-officer graphs are not part of this page.
      </p>
    </main>
  );
}
