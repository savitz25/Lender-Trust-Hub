import type { Metadata } from 'next';
import Link from 'next/link';
import { NATIONAL_PROFILE_COHORT, nationalProfilePath } from '@/lib/national-profile/cohort';
import { nationalProfileRobots } from '@/lib/national-profile/seo';

export const metadata: Metadata = {
  title: 'National lender research profiles (preview)',
  description:
    'Preview set of national lender research profiles built from official HMDA, CFPB, identifier, and enforcement evidence. Not a ranking.',
  robots: nationalProfileRobots(),
};

export default function NationalLenderIndexPage() {
  return (
    <div className="th-shell mx-auto max-w-[800px] px-4 py-10">
      <h1 className="text-2xl font-bold text-[#0A2540]">National lender research (preview)</h1>
      <p className="mt-3 text-sm text-slate-600">
        These pages present the internal evidence contract for a controlled cohort. They are not indexed, not a ranking,
        and not a recommendation. One institution has one profile.
      </p>
      <ul className="mt-6 space-y-2">
        {NATIONAL_PROFILE_COHORT.map((row) => (
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
    </div>
  );
}
