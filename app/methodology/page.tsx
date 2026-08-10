import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BadgeCheck,
  Database,
  Scale,
  Shield,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { ASK_TRUST_HUB } from '@/lib/network/ask-trust-hub';
import { TrustMark } from '@/components/network/trust-mark';

export const metadata: Metadata = {
  title: 'Methodology — How Lender Trust Hub Researches Mortgage Lenders',
  description:
    'Lender Trust Hub methodology under The Ask Trust Hub Standard: NMLS context, Trust Score inputs and limits, CFPB signals, close-time honesty, coverage scope. No paid rankings. Not a lender.',
  alternates: { canonical: 'https://www.lendertrusthub.com/methodology' },
};

const PIPELINE = [
  {
    verb: 'SOURCE',
    title: 'Public licensing and risk sources',
    body: 'Primary orientation is NMLS Consumer Access. Where used, CFPB complaint transparency, state licensing context, and FDIC bank directories (separate vertical) provide additional public signals. Public review platforms may add reputation context when attributed.',
  },
  {
    verb: 'VERIFY',
    title: 'What is verified vs third-party volume',
    body: '“Verified” means we surface NMLS-related company/individual identifiers and licensing context when available. Review counts and star ratings from Google or similar platforms are third-party signals — not NMLS fields. Official NMLS records always win over our summary.',
  },
  {
    verb: 'DISCLOSE',
    title: 'Independence and educational limits',
    body: 'We are not a lender, broker, or loan originator. Calculators are educational estimates. Trust Scores and County Experience Scores are research aids — not credit decisions, rate quotes, or approvals.',
  },
  {
    verb: 'SCORE',
    title: 'Research Score + Data Confidence + NMLS status',
    body: 'See scoring section below. Scores are not for sale. Near-identical high scores were a product bug — Research Score is recalibrated per entity. It never predicts approval, rate, or closing speed.',
  },
  {
    verb: 'UPDATE',
    title: 'Refresh when sources allow',
    body: 'Directory and enrichment overlays refresh through data and editorial workflows. Re-check NMLS Consumer Access and written Loan Estimates before you apply.',
  },
  {
    verb: 'YOU DECIDE',
    title: 'Compare offers; confirm licenses',
    body: 'Use this hub to shortlist and compare. Confirm company and MLO licenses on NMLS and state regulators, read the Loan Estimate, and choose on total cost and fit — not a single directory rank.',
  },
] as const;

export default function MethodologyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 pb-16 pt-10">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
        Vertical methodology · Lending
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#0A2540] sm:text-4xl">
        Lender Trust Hub methodology
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-zinc-600">
        How we apply The Ask Trust Hub Standard to mortgage research: NMLS context, scores, sources,
        updates, and hard limits. Part of the Ask Trust Hub network — common ownership, separated
        research and listing order, no paid placements. Not a lender.
      </p>
      <div className="mt-4">
        <TrustMark />
      </div>

      <aside className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm sm:px-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Parent standard
        </p>
        <p className="mt-1.5 leading-relaxed text-zinc-600">
          This hub inherits{' '}
          <strong className="text-[#0A2540]">The Ask Trust Hub Standard</strong>
          {' — '}
          SOURCE → VERIFY → DISCLOSE → SCORE → UPDATE → YOU DECIDE.
        </p>
        <p className="mt-2">
          <a
            href={ASK_TRUST_HUB.methodologyUrl}
            className="font-semibold text-[#059669] underline-offset-2 hover:underline"
            rel="noopener noreferrer"
          >
            Read the Ask Trust Hub Standard
          </a>
          {' · '}
          <a
            href={ASK_TRUST_HUB.promiseUrl}
            className="font-medium text-zinc-700 underline-offset-2 hover:underline"
            rel="noopener noreferrer"
          >
            Independence
          </a>
          {' · '}
          <a
            href={ASK_TRUST_HUB.revenueUrl}
            className="font-medium text-zinc-700 underline-offset-2 hover:underline"
            rel="noopener noreferrer"
          >
            How we make money
          </a>
        </p>
      </aside>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#0A2540]">
          <Scale className="h-5 w-5 text-[#059669]" aria-hidden />
          Pipeline on this hub
        </h2>
        <ol className="mt-6 space-y-4">
          {PIPELINE.map((step, i) => (
            <li
              key={step.verb}
              className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#059669] text-sm font-bold text-white">
                {i + 1}
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#059669]">
                  {step.verb}
                </p>
                <h3 className="mt-0.5 font-semibold text-[#0A2540]">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12" id="scores">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#0A2540]">
          <BadgeCheck className="h-5 w-5 text-emerald-600" aria-hidden />
          Research Score honesty
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          We separate signals that used to be overloaded into one inflated number:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-600">
          <li>
            <strong className="text-[#0A2540]">Research Score (0–100)</strong> — recomputed per NMLS
            entity from re-checkable NMLS identity, third-party reputation volume, CFPB pattern
            context, BBB grade when listed, locality completeness, and loan-menu disclosure. Seed
            “90s” are not used as-is.
          </li>
          <li>
            <strong className="text-[#0A2540]">Data Confidence</strong> — how complete the listing
            fields are for research (not a quality grade).
          </li>
          <li>
            <strong className="text-[#0A2540]">NMLS / License Status</strong> — ID verified / on file
            / incomplete (Phase 0 rules).
          </li>
          <li>
            <strong className="text-[#0A2540]">Local Market Evidence</strong> — only when HQ locality
            is derived from city/ZIP/county — not statewide license alone.
          </li>
        </ul>
        <h3 className="mt-6 font-semibold text-[#0A2540]">Research Score factor weights</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600">
          <li>NMLS identity evidence — up to 28 points</li>
          <li>Third-party reputation (volume-weighted) — up to 26</li>
          <li>CFPB complaint pattern (not a finding of fault; not size-normalized) — up to 16</li>
          <li>BBB grade when listed — up to 12</li>
          <li>Licensed locality completeness — up to 12</li>
          <li>Loan type disclosure — up to 6</li>
        </ul>
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/50 p-5">
          <h3 className="font-semibold text-[#0A2540]">What Research Score does not mean</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-700">
            It does not predict approval, rate, closing speed, or future service quality. Nearby
            lenders never outrank true in-county HQ by score cosmetics alone. Prefer Loan Estimates
            and re-check NMLS before you apply.
          </p>
        </div>
      </section>

      <section className="mt-12" id="ranking">
        <h2 className="text-2xl font-semibold text-[#0A2540]">How lists are ordered</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-600">
          <li>In-county HQ first, then nearby / serving from elsewhere (geographic honesty).</li>
          <li>
            Within each band: Research Score, then Data Confidence, then NMLS status, then listed
            review volume.
          </li>
          <li>No paid relationships in organic ranking.</li>
        </ol>
      </section>

      <section className="mt-12" id="close-metrics">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#0A2540]">
          <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden />
          Closing performance &amp; third-party metrics
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          Closing performance is not displayed without a documented observed dataset. Seed
          Google/BBB/Trustpilot snapshots and volume ranks are suppressed until independently
          retrieved. CFPB counts, when shown, are raw catalog fields — not size-normalized and not a
          finding of wrongdoing.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#0A2540]">
          <Database className="h-5 w-5 text-[#059669]" aria-hidden />
          Data sources
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-600">
          <li>
            <strong className="text-[#0A2540]">NMLS Consumer Access</strong> — primary licensing
            registry (
            <a
              href="https://www.nmlsconsumeraccess.org/"
              className="text-[#059669] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              nmlsconsumeraccess.org
            </a>
            )
          </li>
          <li>
            <strong className="text-[#0A2540]">CFPB</strong> — public complaint transparency where
            used (pattern signal only)
          </li>
          <li>
            <strong className="text-[#0A2540]">State licensing</strong> — varies by jurisdiction;
            always re-confirm with state regulators
          </li>
          <li>
            <strong className="text-[#0A2540]">FDIC</strong> — deposit-insurance public data for the
            bank directory vertical (separate from mortgage Trust Score)
          </li>
          <li>
            <strong className="text-[#0A2540]">Attributed public reviews / BBB</strong> — only when
            a confirmed listing exists
          </li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#0A2540]">
          <RefreshCw className="h-5 w-5 text-[#059669]" aria-hidden />
          Coverage
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          Lender Trust Hub is a <strong className="text-[#0A2540]">national research directory</strong>{' '}
          with state hubs, county market pages, and HMDA evidence where matched. We still do not claim
          a complete inventory of every U.S. county or every licensed originator. Absence from our
          directory is not a regulatory finding. County pages may be tiered for quality (some remain
          noindex until inventory gates pass).
        </p>
      </section>

      <section className="mt-12 rounded-xl border border-zinc-200 bg-zinc-50 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[#0A2540]">
          <Shield className="h-5 w-5" aria-hidden />
          Verify with the primary regulator
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          Confirm company and individual licenses on NMLS Consumer Access and any applicable state
          regulator before you apply. Lender Trust Hub does not originate loans, set rates, or
          accept payment for ranking position.
        </p>
      </section>

      <div className="mt-10 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <Link href="/about" className="font-medium text-zinc-700 hover:underline">
          Trust &amp; transparency
        </Link>
        <Link href="/local-lenders" className="font-medium text-zinc-700 hover:underline">
          Lender directory
        </Link>
        <Link href="/contact" className="font-medium text-zinc-700 hover:underline">
          Contact
        </Link>
      </div>
    </div>
  );
}
