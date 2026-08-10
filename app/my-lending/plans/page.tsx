import type { Metadata } from 'next';
import Link from 'next/link';
import { PlansLibrary } from '@/components/my-lending/plans-library';

export const metadata: Metadata = {
  title: 'Financing plans — My Lending',
  description:
    'Library of guest-saved financing research plans. Switch active plan, rename, archive, or open report-ready summaries. Research only.',
  alternates: { canonical: 'https://www.lendertrusthub.com/my-lending/plans' },
  robots: { index: false, follow: false },
};

export default function MyLendingPlansPage() {
  return (
    <div className="lth-hero-wash border-b border-zinc-200">
      <div className="container mx-auto max-w-3xl px-4 py-10 md:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          My Lending · Plans
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#0A2540] md:text-4xl">
          Financing plans
        </h1>
        <p className="mt-3 max-w-2xl text-base text-zinc-600">
          Keep multiple research plans (like My Move reports). Shortlist and calculator snapshots
          attach to the active plan only. Cap 3 shortlisted lenders per plan.
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          <Link href="/my-lending" className="font-medium text-emerald-800 hover:underline">
            My Lending HQ
          </Link>
          {' · '}
          <Link href="/my-lending/setup" className="font-medium text-emerald-800 hover:underline">
            Guided setup
          </Link>
          {' · '}
          <Link href="/my-lending/report" className="font-medium text-emerald-800 hover:underline">
            Report
          </Link>
        </p>
        <div className="mt-8">
          <PlansLibrary />
        </div>
      </div>
    </div>
  );
}
