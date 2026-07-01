import type { Metadata } from 'next';
import Link from 'next/link';
import { CalculatorHub } from '@/components/CalculatorHub';
import { JsonLd } from '@/components/directory/JsonLd';
import { TrustBar } from '@/components/TrustBar';
import { SearchBar } from '@/components/SearchBar';
import { calculatorsPageSchema } from '@/lib/seo/calculators';
import { CALC_DISCLAIMER } from '@/lib/calculators/registry';

export const metadata: Metadata = {
  title: 'Mortgage Payment Calculator with PMI & Charts – Verified Lenders',
  description:
    'Free mortgage calculators: PITI payment, affordability, refinance breakeven, amortization, rent vs buy, HELOC, down payment planner & rental cash flow. Match to NMLS-verified lenders.',
  keywords: [
    'mortgage payment calculator',
    'PITI calculator',
    'home affordability calculator',
    'refinance breakeven calculator',
    'amortization calculator',
    'rent vs buy calculator',
    'HELOC calculator',
    'mortgage calculators Florida',
    'local mortgage lenders',
  ],
  alternates: { canonical: 'https://www.lendertrusthub.com/calculators' },
  openGraph: {
    title: 'Mortgage Calculators Hub | Lender Trust Hub',
    description: 'Transparent Tools. Trusted Guidance. Nine free interactive calculators with verified lender matching.',
    url: 'https://www.lendertrusthub.com/calculators',
    type: 'website',
  },
};

const FAQ = [
  { q: 'Are these calculators free?', a: 'Yes — all tools are free, require no account, and update in real time as you adjust inputs.' },
  { q: 'How accurate are the estimates?', a: CALC_DISCLAIMER },
  { q: 'What does Match Me to Lenders do?', a: 'It filters our independent, NMLS-verified directory using your calculated loan profile — loan type, estimated amount, and credit tier. We never accept paid placements.' },
];

export default function CalculatorsPage() {
  return (
    <>
      <JsonLd data={calculatorsPageSchema()} />

      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0F172A]/5 via-white to-emerald-500/5 dark:from-zinc-900 dark:via-zinc-900 dark:to-emerald-950/20">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-600">
              Transparent Tools · Trusted Guidance · Confident Decisions
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-white md:text-5xl">
              Mortgage &amp; Home-Finance Calculators
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              Nine professional calculators with live charts, export options, and intelligent{' '}
              <strong className="font-semibold text-[#0F172A] dark:text-white">Match Me to Lenders</strong>{' '}
              integration — zero paid placements, always.
            </p>
            <div className="mt-8">
              <SearchBar className="mx-auto max-w-lg" />
            </div>
          </div>
        </div>
      </section>

      <div className="border-b border-zinc-200 bg-[#0F172A] py-2 text-center text-xs text-zinc-300">
        <strong className="text-white">Free</strong> · No sign-up · Educational tools · NMLS-verified lender matching
      </div>

      <div className="container mx-auto px-4 py-10 md:py-14">
        <CalculatorHub />
      </div>

      <TrustBar />

      <section className="container mx-auto px-4 py-14" aria-labelledby="how-calc-works">
        <h2 id="how-calc-works" className="mb-8 text-center text-2xl font-bold text-[#0F172A] dark:text-white">
          How Calculators Connect to Verified Lenders
        </h2>
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {[
            { step: '01', title: 'Calculate Your Numbers', desc: 'Use sliders and presets (including Florida first-time buyer examples) to model payments, affordability, refinance savings, and more.' },
            { step: '02', title: 'Match Your Profile', desc: 'Every tool ends with Match Me to Lenders — we pass your estimated loan amount, rate, and loan type to filter NMLS-verified brokers and lenders.' },
            { step: '03', title: 'Compare by County', desc: 'Enter your ZIP on any page to see county-level Trust and Experience scores. Cross-check FDIC banks for deposit safety.' },
          ].map((item) => (
            <div key={item.step} className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
              <span className="text-2xl font-bold text-emerald-500/40">{item.step}</span>
              <h3 className="mt-2 text-lg font-bold text-[#0F172A] dark:text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-zinc-50 py-14 dark:border-zinc-800 dark:bg-zinc-900/50" aria-labelledby="calc-faq">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 id="calc-faq" className="mb-8 text-center text-2xl font-bold text-[#0F172A] dark:text-white">
            Calculator FAQ
          </h2>
          <div className="space-y-4">
            {FAQ.map((f) => (
              <details key={f.q} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
                <summary className="cursor-pointer font-semibold text-[#0F172A] dark:text-white">{f.q}</summary>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-zinc-500">
            Explore county lenders:{' '}
            <Link href="/local-lenders/florida" className="font-medium text-emerald-600 hover:underline">Florida</Link>
            {' · '}
            <Link href="/local-lenders/texas" className="font-medium text-emerald-600 hover:underline">Texas</Link>
            {' · '}
            <Link href="/local-lenders/california" className="font-medium text-emerald-600 hover:underline">California</Link>
            {' · '}
            <Link href="/fdic-insured-banks" className="font-medium text-emerald-600 hover:underline">FDIC Banks</Link>
          </p>
        </div>
      </section>
    </>
  );
}