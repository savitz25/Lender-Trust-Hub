import Link from 'next/link';
import { Shield, Search, Building2, Calculator } from 'lucide-react';
import type { StateMeta } from '@/lib/fdic/types';

export function StateEducationSections({ stateMeta }: { stateMeta: StateMeta }) {
  return (
    <section aria-labelledby="education-heading" className="mt-10 space-y-6">
      <h2 id="education-heading" className="sr-only">
        Educational resources about FDIC insurance and banking in {stateMeta.fullName}
      </h2>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-zinc-200 bg-white p-6">
          <Shield className="mb-3 h-7 w-7 text-[#00A3A1]" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-[#0A2540]">FDIC Insurance Explained</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            The FDIC insures deposits at member banks up to $250,000 per depositor, per insured
            institution, for each ownership category — including checking, savings, CDs, and money
            market accounts. Coverage is automatic when you bank at an FDIC-insured institution.
          </p>
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-white p-6">
          <Search className="mb-3 h-7 w-7 text-[#00A3A1]" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-[#0A2540]">
            How to Choose a Bank in {stateMeta.fullName}
          </h3>
          <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm text-zinc-600">
            <li>Confirm FDIC insurance via certificate number on FDIC BankFind.</li>
            <li>Decide if you prefer a bank headquartered in {stateMeta.fullName} or a national chain.</li>
            <li>Compare regulators (OCC, Federal Reserve, FDIC) for charter type context.</li>
            <li>Review branch access, digital tools, and fee schedules on the bank website.</li>
            <li>Use our mortgage calculators to estimate payments before opening accounts.</li>
          </ol>
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-white p-6">
          <Building2 className="mb-3 h-7 w-7 text-[#00A3A1]" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-[#0A2540]">How We Verify These Banks</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            Every institution is sourced from official FDIC BankFind records. We publish certificate
            numbers, insurance dates, regulators, and headquarters with direct verification links.
            LenderTrustHub does not accept paid placements — rankings reflect data, not advertising.
          </p>
        </article>
      </div>

      <div className="rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-r from-amber-50/80 to-white p-6 md:flex md:items-center md:justify-between md:gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
            Free tools — no signup required
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[#0A2540]">
            Planning a home purchase in {stateMeta.fullName}?
          </h3>
          <p className="mt-1 text-sm text-zinc-600">
            Estimate monthly payments, compare loan scenarios, and explore verified mortgage lenders.
          </p>
        </div>
        <Link
          href="/calculators"
          className="mt-4 inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#00A3A1] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#008f8d] md:mt-0"
        >
          <Calculator className="h-4 w-4" aria-hidden="true" />
          Try Mortgage Calculators
        </Link>
      </div>
    </section>
  );
}