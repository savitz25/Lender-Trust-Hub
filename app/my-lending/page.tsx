import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { GuestLendingHq } from '@/components/my-lending/guest-lending-hq';
import { HandoffStatusBanner } from '@/components/my-lending/handoff-status-banner';
import { TrustMark } from '@/components/network/trust-mark';
import { MyLendingReturnTracker } from '@/components/analytics/my-lending-return-tracker';

export const metadata: Metadata = {
  title: 'My Lending - Financing research HQ',
  description:
    'Guest-first financing research plan and saved lenders on Lender Trust Hub. Works without signing in. Research only - verify on NMLS Consumer Access. Not a lender.',
  alternates: { canonical: 'https://www.lendertrusthub.com/my-lending' },
  robots: { index: false, follow: false },
};

export default function MyLendingPage() {
  return (
    <div className="lth-hero-wash border-b border-zinc-200/80">
      <MyLendingReturnTracker />
      <div className="container mx-auto max-w-3xl px-4 py-10 md:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          My Lending
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#0A2540] md:text-4xl">
          Research passport for financing
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-600">
          Keep Loan Estimates, comparisons, lenders, and private notes in one calm workspace — then
          reopen Analyzer or Compare when you return. Guest mode stays on this device. Optional
          sign-in enables a multi-device foundation. Saving is never required to use free tools.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Research only · We show the public record. You decide. · Not a lead funnel · Guest =
          this device · Signed in = synced foundation when available
        </p>
        <div className="mt-2">
          <TrustMark />
        </div>
        <Suspense fallback={null}>
          <div className="mt-4">
            <HandoffStatusBanner />
          </div>
        </Suspense>
        <p className="mt-3 text-sm text-zinc-500">
          <Link
            href="/tools/loan-estimate-analyzer"
            className="font-medium text-[#059669] hover:underline"
          >
            Understand your Loan Estimate
          </Link>
          {' · '}
          <Link
            href="/tools/compare-loan-estimates"
            className="font-medium text-[#059669] hover:underline"
          >
            Compare offers side by side
          </Link>
          {' · '}
          <Link href="/tools/program-finder" className="font-medium text-[#059669] hover:underline">
            Explore programs
          </Link>
          {' · '}
          <Link href="/local-lenders" className="font-medium text-[#059669] hover:underline">
            Local lenders
          </Link>
          {' · '}
          <Link href="/calculators" className="font-medium text-[#059669] hover:underline">
            Calculators
          </Link>
          {' · '}
          <Link href="/about" className="font-medium text-[#059669] hover:underline">
            About
          </Link>
        </p>

        <div className="mt-8">
          <GuestLendingHq />
        </div>
      </div>
    </div>
  );
}
