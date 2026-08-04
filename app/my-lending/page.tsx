import type { Metadata } from 'next';
import Link from 'next/link';
import { GuestLendingHq } from '@/components/my-lending/guest-lending-hq';
import { TrustMark } from '@/components/network/trust-mark';

export const metadata: Metadata = {
  title: 'My Lending - Financing research HQ',
  description:
    'Guest-first financing research plan and saved lenders on Lender Trust Hub. Works without signing in. Research only - verify on NMLS Consumer Access. Not a lender.',
  alternates: { canonical: 'https://www.lendertrusthub.com/my-lending' },
};

export default function MyLendingPage() {
  return (
    <div className="lth-hero-wash border-b border-zinc-200/80">
      <div className="container mx-auto max-w-3xl px-4 py-10 md:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          My Lending
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#0A2540] md:text-4xl">
          Research passport for financing
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-600">
          Guest-saved on this device. Build a plan, shortlist NMLS-listed lenders, track research
          status - then verify on primary sources before you apply.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Research only · Not an endorsement · NMLS verification on primary sources · Part of the
          Ask Trust Hub network
        </p>
        <div className="mt-2">
          <TrustMark />
        </div>
        <p className="mt-3 text-sm text-zinc-500">
          <Link href="/local-lenders" className="font-medium text-[#059669] hover:underline">
            Local lenders
          </Link>
          {' · '}
          <Link href="/calculators" className="font-medium text-[#059669] hover:underline">
            Calculators
          </Link>
          {' · '}
          <Link href="/compare" className="font-medium text-[#059669] hover:underline">
            Compare
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
