import Link from 'next/link';
import type { CountyQualityAssessment } from '@/lib/mortgage/county-quality-score';
import { getStateHousingResources } from '@/lib/mortgage/state-housing-resources';
import { isDpaGuidanceState } from '@/lib/programs/location-notes';
import type { Lender } from '@/lib/mockData';

const LOAN_PROGRAMS = [
  {
    id: 'conventional',
    label: 'Conventional',
    href: '/programs/conventional',
    note: 'Baseline purchase & refinance themes — educational overview',
  },
  {
    id: 'fha',
    label: 'FHA',
    href: '/programs/fha',
    note: 'Lower down-payment research themes — not an eligibility tool',
  },
  {
    id: 'va',
    label: 'VA',
    href: '/programs/va',
    note: 'Military / veteran program themes — confirm with VA sources',
  },
  {
    id: 'dpa',
    label: 'Down-payment assistance',
    href: '/programs/down-payment-assistance',
    note: 'State/local assistance concepts — not a complete local inventory',
  },
  {
    id: 'finder',
    label: 'Program finder',
    href: '/tools/program-finder',
    note: 'Short guided shortlist with clear disclaimers',
  },
] as const;

type Props = {
  stateSlug: string;
  countySlug: string;
  countyName: string;
  assessment: CountyQualityAssessment;
  inCounty: Lender[];
};

/**
 * Real research modules for Tier 1 / strong Tier 2 counties.
 * No invented rates, branch density, or local market essays.
 */
export function CountyIntelligenceModules({
  stateSlug,
  countySlug,
  countyName,
  assessment,
  inCounty,
}: Props) {
  if (assessment.tier === 3) return null;

  const housing = getStateHousingResources(stateSlug);
  const loanTypesPresent = new Set(inCounty.flatMap((l) => l.loanTypes ?? []));
  const showPrograms = assessment.tier === 1 || assessment.metadata.loanTypeDiversity >= 2;

  return (
    <div className="mb-12 space-y-8">
      {assessment.tier === 1 ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-950">
          Premium county research surface (quality score {assessment.score}/100). Inventory and
          tools below use real catalog signals only — not fabricated local market color.
        </p>
      ) : null}

      {showPrograms ? (
        <section aria-labelledby="loan-programs-heading">
          <h2 id="loan-programs-heading" className="text-xl font-semibold text-[#0A2540]">
            Loan-program research entry points
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Educational pathways only. Confirm product eligibility and pricing with any company and
            primary sources — these are not live lender quotes.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {LOAN_PROGRAMS.map((p) => {
              const inventoryKey =
                p.id === 'fha'
                  ? 'FHA'
                  : p.id === 'va'
                    ? 'VA'
                    : p.id === 'conventional'
                      ? 'Conventional'
                      : null;
              const inInventory = inventoryKey
                ? loanTypesPresent.has(inventoryKey)
                : false;
              const href =
                p.id === 'finder' && stateSlug
                  ? `${p.href}?state=${encodeURIComponent(stateSlug)}`
                  : p.id === 'dpa' && isDpaGuidanceState(stateSlug)
                    ? `${p.href}#${stateSlug}`
                    : p.href;
              return (
                <li
                  key={p.id}
                  className="rounded-xl border border-zinc-200 bg-white p-4 text-sm"
                >
                  <Link
                    href={href}
                    className="font-semibold text-[#0A2540] hover:text-[#059669]"
                  >
                    {p.label}
                  </Link>
                  <p className="mt-1 text-xs text-zinc-500">{p.note}</p>
                  {inInventory ? (
                    <p className="mt-1 text-[11px] text-emerald-700">
                      At least one in-county listing shows this loan type
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="research-paths-heading">
        <h2 id="research-paths-heading" className="text-xl font-semibold text-[#0A2540]">
          Compare, calculate, verify
        </h2>
        <ul className="mt-3 flex flex-wrap gap-3 text-sm">
          <li>
            <Link
              href="/compare"
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 font-medium text-[#0A2540] hover:border-[#059669]"
            >
              Compare companies →
            </Link>
          </li>
          <li>
            <Link
              href="/calculators"
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 font-medium text-[#0A2540] hover:border-[#059669]"
            >
              Educational calculators →
            </Link>
          </li>
          <li>
            <a
              href="https://www.nmlsconsumeraccess.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 font-medium text-[#0A2540] hover:border-[#059669]"
            >
              NMLS Consumer Access ↗
            </a>
          </li>
          <li>
            <Link
              href={`/local-lenders/${stateSlug}`}
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 font-medium text-[#0A2540] hover:border-[#059669]"
            >
              {countyName} state hub →
            </Link>
          </li>
          <li>
            <Link
              href="/fdic-insured-banks"
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 font-medium text-[#0A2540] hover:border-[#059669]"
            >
              FDIC bank research →
            </Link>
          </li>
        </ul>
      </section>

      <section aria-labelledby="housing-resources-heading">
        <h2 id="housing-resources-heading" className="text-xl font-semibold text-[#0A2540]">
          Official housing &amp; licensing handoffs
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Primary sources only. Program availability and eligibility change — confirm on the
          official site.
        </p>
        <ul className="mt-4 space-y-2">
          {housing.map((r) => (
            <li key={r.href} className="text-sm">
              <a
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#059669] hover:underline"
              >
                {r.label} ↗
              </a>
              <span className="text-zinc-500"> — {r.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-zinc-400">
        County quality score {assessment.score}/100 · Tier {assessment.tier} ({assessment.tierLabel}
        ). See{' '}
        <Link href="/methodology" className="text-[#059669] hover:underline">
          methodology
        </Link>
        . Path: /local-lenders/{stateSlug}/{countySlug}
      </p>
    </div>
  );
}
