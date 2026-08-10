import type { Metadata } from 'next';
import Link from 'next/link';
import { GuidedPlanSetup } from '@/components/my-lending/guided-plan-setup';

export const metadata: Metadata = {
  title: 'Guided financing plan setup — My Lending',
  description:
    'Build a guest-saved financing research plan on Lender Trust Hub. Educational only — not a loan application or offer.',
  alternates: { canonical: 'https://www.lendertrusthub.com/my-lending/setup' },
  robots: { index: false, follow: false },
};

export default function MyLendingSetupPage() {
  return (
    <div className="lth-hero-wash border-b border-zinc-200">
      <div className="container mx-auto max-w-2xl px-4 py-10 md:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          My Lending · Guided setup
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#0A2540]">
          Build your financing research plan
        </h1>
        <p className="mt-3 text-base text-zinc-600">
          Guest-saved on this device. Updates your active plan without clearing your shortlist.
          Research only — re-verify on NMLS Consumer Access.
        </p>
        <p className="mt-2 text-sm">
          <Link href="/my-lending" className="font-medium text-emerald-800 hover:underline">
            Back to My Lending
          </Link>
        </p>
        <div className="mt-8">
          <GuidedPlanSetup />
        </div>
      </div>
    </div>
  );
}
