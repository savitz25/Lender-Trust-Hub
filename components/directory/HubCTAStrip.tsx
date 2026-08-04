import Link from 'next/link';
import { ArrowRight, Calculator, Landmark, Car, Building2 } from 'lucide-react';
import { FDIC_CATEGORY, MORTGAGE_CATEGORY, AUTO_CATEGORY } from '@/lib/directory/categories';

const CTAS = [
  {
    icon: Landmark,
    label: 'FDIC Banks',
    href: FDIC_CATEGORY.hubPath,
    copy: 'Verify deposit insurance',
  },
  {
    icon: Building2,
    label: 'Mortgage Lenders',
    href: MORTGAGE_CATEGORY.hubPath,
    copy: 'NMLS verified directory',
  },
  {
    icon: Car,
    label: 'Auto Loans',
    href: AUTO_CATEGORY.hubPath,
    copy: 'Compare APR ranges',
  },
  {
    icon: Calculator,
    label: 'Calculators',
    href: '/calculators',
    copy: 'Free payment tools',
  },
] as const;

/** Conversion strip — light Trust Hub surface (no black mid-page band) */
export function HubCTAStrip() {
  return (
    <section
      aria-labelledby="hub-cta-heading"
      className="lth-hero-wash border-t border-zinc-200 py-10 text-[#0A2540]"
    >
      <div className="container mx-auto px-4">
        <h2 id="hub-cta-heading" className="text-center text-xl font-bold md:text-2xl">
          Explore every lending vertical
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-zinc-600">
          One trusted platform — banks, mortgages, auto loans, and free calculators.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CTAS.map((cta) => (
            <Link
              key={cta.href}
              href={cta.href}
              prefetch
              className="group flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <cta.icon className="h-5 w-5 text-emerald-700" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-[#0A2540]">{cta.label}</p>
                  <p className="text-xs text-zinc-500">{cta.copy}</p>
                </div>
              </div>
              <ArrowRight
                className="h-4 w-4 text-zinc-400 transition group-hover:text-emerald-700"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
