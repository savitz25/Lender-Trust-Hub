import type { Metadata } from 'next';
import Link from 'next/link';
import { NATIONAL_PROFILE_COHORT, nationalProfilePath } from '@/lib/national-profile/cohort';
import { isNationalIndexingSlug } from '@/lib/national-profile/publication';
import { nationalProfileRobots } from '@/lib/national-profile/seo';

export const metadata: Metadata = {
  title: 'National lender research profiles',
  description:
    'Controlled set of national lender research profiles built from official HMDA, CFPB, identifier, and enforcement evidence. Not a ranking. Not a complete national directory.',
  robots: nationalProfileRobots(),
};

export default function NationalLenderIndexPage() {
  const indexed = NATIONAL_PROFILE_COHORT.filter((row) => isNationalIndexingSlug(row.slug));
  const held = NATIONAL_PROFILE_COHORT.filter((row) => !isNationalIndexingSlug(row.slug));

  return (
    <div className="th-shell mx-auto max-w-[800px] px-4 py-10">
      <h1 className="text-2xl font-bold text-[#0A2540]">National lender research</h1>
      <p className="mt-3 text-sm text-slate-600">
        These pages present the internal evidence contract for a controlled cohort. This page is not indexed, is not a
        ranking, and is not a recommendation. One institution has one profile. Catalog locality pages remain at{' '}
        <Link href="/lenders" className="text-[#0D9488] underline-offset-2 hover:underline">
          /lenders
        </Link>
        .
      </p>
      <p className="mt-2 text-xs text-slate-500">
        Indexing cohort: {indexed.length} profiles. Additional research routes on this page stay noindex.
      </p>
      <ul className="mt-6 space-y-2">
        {indexed.map((row) => (
          <li key={row.slug}>
            <Link
              href={nationalProfilePath(row.slug)}
              className="text-[#0D9488] underline-offset-2 hover:underline"
            >
              {row.displayName}
            </Link>
            <span className="mt-0.5 block text-xs text-slate-500">{row.stableKey}</span>
          </li>
        ))}
      </ul>
      {held.length ? (
        <section className="mt-10" aria-labelledby="noindex-heading">
          <h2 id="noindex-heading" className="text-lg font-semibold text-[#0A2540]">
            Research profiles not in the indexing cohort
          </h2>
          <p className="mt-2 text-sm text-slate-600">Rendered for research continuity. noindex, nofollow.</p>
          <ul className="mt-4 space-y-2">
            {held.map((row) => (
              <li key={row.slug}>
                <Link
                  href={nationalProfilePath(row.slug)}
                  className="text-[#0D9488] underline-offset-2 hover:underline"
                >
                  {row.displayName}
                </Link>
                <span className="mt-0.5 block text-xs text-slate-500">{row.stableKey} · noindex</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
