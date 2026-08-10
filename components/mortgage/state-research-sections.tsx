import Link from 'next/link';
import type { StateMeta } from '@/lib/fdic/types';
import type { StateMortgageStats } from '@/lib/mortgage/stateLenders';
import {
  getIndexableCountiesForState,
  getPremiumCountiesForState,
} from '@/lib/mortgage/county-quality-tiers';
import { getStateHousingResources } from '@/lib/mortgage/state-housing-resources';
import { RankingBasisPanel } from '@/components/research/ranking-basis-panel';
import { ProgramsToolsCta } from '@/components/programs/ProgramsToolsCta';
import { isDpaGuidanceState } from '@/lib/programs/location-notes';

type Props = {
  stateMeta: StateMeta;
  stats: StateMortgageStats;
};

/**
 * Phase 4 — state page research hub sections (honest counts + primary sources).
 */
export function StateResearchSections({ stateMeta, stats }: Props) {
  const slug = stateMeta.slug;
  const premium = getPremiumCountiesForState(slug);
  const indexable = getIndexableCountiesForState(slug);
  const housing = getStateHousingResources(slug);

  return (
    <div className="space-y-10">
      <section aria-labelledby="state-inventory-heading">
        <h2 id="state-inventory-heading" className="text-xl font-semibold text-[#0A2540]">
          Honest inventory in {stateMeta.fullName}
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
          <li className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-2xl font-bold text-[#0A2540]">{stats.total}</p>
            <p className="text-xs text-zinc-500">Distinct companies (NMLS entity)</p>
          </li>
          <li className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-2xl font-bold text-[#0A2540]">{stats.verified}</p>
            <p className="text-xs text-zinc-500">With NMLS ID verified</p>
          </li>
          <li className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-2xl font-bold text-[#0A2540]">{indexable.length}</p>
            <p className="text-xs text-zinc-500">Indexable county research pages (Tier 1–2)</p>
          </li>
        </ul>
      </section>

      <RankingBasisPanel
        localityNote="State lists are distinct companies. County pages put true in-county HQ first."
      />

      {premium.length > 0 ? (
        <section aria-labelledby="premium-counties-heading">
          <h2 id="premium-counties-heading" className="text-xl font-semibold text-[#0A2540]">
            Premium county research surfaces
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Highest quality scores from real in-county inventory and research usefulness — not
            population alone.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {premium.map((c) => (
              <li key={c.countySlug}>
                <Link
                  href={`/local-lenders/${slug}/${c.countySlug}`}
                  className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/40 px-4 py-3 text-sm hover:border-emerald-400"
                >
                  <span className="font-semibold text-[#0A2540]">
                    {c.countySlug
                      .split('-')
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ')}{' '}
                    County
                  </span>
                  <span className="text-xs text-emerald-800">
                    Tier 1 · score {c.score} · {c.metadata.inCountyCount} in-county
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {indexable.length > 0 ? (
        <section aria-labelledby="major-counties-heading">
          <h2 id="major-counties-heading" className="text-xl font-semibold text-[#0A2540]">
            Major counties (indexable)
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2 text-sm">
            {indexable.slice(0, 12).map((c) => (
              <li key={c.countySlug}>
                <Link
                  href={`/local-lenders/${slug}/${c.countySlug}`}
                  className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[#0A2540] hover:border-[#059669]"
                >
                  {c.countySlug
                    .split('-')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')}
                  <span className="ml-1 text-xs text-zinc-400">T{c.tier}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="loan-tools-heading">
        <h2 id="loan-tools-heading" className="text-xl font-semibold text-[#0A2540]">
          Loan programs &amp; tools
        </h2>
        <ul className="mt-3 flex flex-wrap gap-3 text-sm">
          <li>
            <Link
              href={`/tools/program-finder?state=${encodeURIComponent(slug)}`}
              className="font-medium text-[#059669] hover:underline"
            >
              Program / assistance finder →
            </Link>
          </li>
          <li>
            <Link
              href={
                isDpaGuidanceState(slug)
                  ? `/programs/down-payment-assistance#${slug}`
                  : '/programs/down-payment-assistance'
              }
              className="font-medium text-[#059669] hover:underline"
            >
              {isDpaGuidanceState(slug)
                ? `${stateMeta.fullName} DPA research starts →`
                : 'Down-payment assistance guide →'}
            </Link>
          </li>
          <li>
            <Link href="/calculators" className="font-medium text-[#059669] hover:underline">
              Educational calculators →
            </Link>
          </li>
          <li>
            <Link href="/compare" className="font-medium text-[#059669] hover:underline">
              Compare companies →
            </Link>
          </li>
          <li>
            <a
              href="https://www.nmlsconsumeraccess.org/"
              className="font-medium text-[#059669] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Verify on NMLS ↗
            </a>
          </li>
          <li>
            <Link
              href={`/fdic-insured-banks/${slug}`}
              className="font-medium text-[#059669] hover:underline"
            >
              FDIC banks in {stateMeta.fullName} →
            </Link>
          </li>
        </ul>
        {isDpaGuidanceState(slug) ? (
          <div className="mt-4">
            <ProgramsToolsCta stateSlug={slug} />
          </div>
        ) : null}
      </section>

      <section aria-labelledby="state-housing-heading">
        <h2 id="state-housing-heading" className="text-xl font-semibold text-[#0A2540]">
          Official housing &amp; licensing resources
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {housing.map((r) => (
            <li key={r.href}>
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
    </div>
  );
}
