import type { Metadata } from 'next';
import Link from 'next/link';
import { CoverageReport } from '@/components/my-lending/coverage-report';

export const metadata: Metadata = {
  title: 'Financing research report — My Lending',
  description:
    'Takeaway summary of your guest-saved financing plan, shortlist, and calculator snapshots. Research only — not a loan offer.',
  alternates: { canonical: 'https://www.lendertrusthub.com/my-lending/report' },
};

export default function MyLendingReportPage() {
  return (
    <div className="lth-hero-wash border-b border-zinc-200 print:bg-white">
      <div className="container mx-auto max-w-2xl px-4 py-10 md:py-14 print:max-w-none print:px-0 print:py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800 print:hidden">
          My Lending · Report-ready
        </p>
        <p className="mt-2 text-sm print:hidden">
          <Link href="/my-lending" className="font-medium text-emerald-800 hover:underline">
            Back to My Lending
          </Link>
          {' · '}
          <Link href="/my-lending/setup" className="font-medium text-emerald-800 hover:underline">
            Setup
          </Link>
        </p>
        <div className="mt-6">
          <CoverageReport />
        </div>
      </div>
    </div>
  );
}
