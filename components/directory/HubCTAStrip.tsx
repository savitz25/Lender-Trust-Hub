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

/** Conversion strip — place above footer on national hubs */
export function HubCTAStrip() {
  return (
    <section
      aria-labelledby="hub-cta-heading"
      className="border-t border-zinc-200 bg-gradient-to-r from-[#0A2540] to-[#0d3a5c] py-10 text-white"
    >
      <div className="container mx-auto px-4">
        <h2 id="hub-cta-heading" className="text-center text-xl font-bold md:text-2xl">
          Explore Every Lending Vertical
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-zinc-300">
          One trusted platform — banks, mortgages, auto loans, and free calculators.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CTAS.map((cta) => (
            <Link
              key={cta.href}
              href={cta.href}
              prefetch
              className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 transition hover:border-[#00A3A1]/50 hover:bg-white/10"
            >
              <div className="flex items-center gap-3">
                <cta.icon className="h-5 w-5 text-[#7ee8e6]" aria-hidden="true" />
                <div>
                  <p className="font-semibold">{cta.label}</p>
                  <p className="text-xs text-zinc-400">{cta.copy}</p>
                </div>
              </div>
              <ArrowRight
                className="h-4 w-4 text-zinc-500 transition group-hover:text-[#7ee8e6]"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}