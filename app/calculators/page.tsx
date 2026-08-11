import type { Metadata } from 'next';
import Link from 'next/link';
import { CalculatorHub } from '@/components/CalculatorHub';
import { JsonLd } from '@/components/directory/JsonLd';
import { TrustBar } from '@/components/TrustBar';
import { SearchBar } from '@/components/SearchBar';
import { NetworkBelongingLine } from '@/components/network/network-belonging-line';
import { ContinueTrustJourney } from '@/components/network/continue-trust-journey';
import { FredRateBenchmarkStrip } from '@/components/rates/FredRateContextPanel';
import { getFredMortgageBenchmarks } from '@/lib/fred/server';
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
 description:
 'Transparent Tools. Trusted Guidance. Loan Estimate Analyzer, multi-LE compare, and free calculators — no lead forms.',
 url: 'https://www.lendertrusthub.com/calculators',
 type: 'website',
 },
};

const FAQ = [
 {
 q: 'Are these calculators free?',
 a: 'Yes — all tools are free, require no account, and update in real time as you adjust inputs.',
 },
 { q: 'How accurate are the estimates?', a: CALC_DISCLAIMER },
 {
 q: 'What does Match Me to Lenders do?',
 a: 'It filters our independent, NMLS-verified directory using your calculated loan profile — loan type, estimated amount, and credit tier. We never accept paid placements.',
 },
];

export default async function CalculatorsPage() {
 const mortgageBenchmarks = await getFredMortgageBenchmarks();

 return (
 <>
 <JsonLd data={calculatorsPageSchema()} />

 {/* Light Trust Hub hero — no black chrome */}
 <section className="lth-hero-wash border-b border-zinc-200">
 <div className="container mx-auto px-4 py-12 md:py-16">
 <div className="mx-auto max-w-3xl text-center">
 <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-700">
 Transparent tools · Trusted guidance · Confident decisions
 </p>
 <h1 className="text-3xl font-extrabold tracking-tight text-[#0A2540] md:text-5xl">
 Mortgage &amp; home-finance calculators
 </h1>
 <NetworkBelongingLine className="mt-3" />
 <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600">
 Educational calculators plus flagship Loan Estimate tools — understand fees, compare offers
 side by side, and match research to NMLS-oriented directory signals. Zero paid placements.
 </p>
 <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
 <Link
 href="/tools/loan-estimate-analyzer"
 className="inline-flex min-h-11 items-center rounded-xl bg-[#0A2540] px-4 py-2.5 font-semibold text-white hover:bg-[#0A2540]/90"
 >
 Understand your Loan Estimate
 </Link>
 <Link
 href="/tools/compare-loan-estimates"
 className="inline-flex min-h-11 items-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 font-semibold text-[#0A2540] hover:border-emerald-400"
 >
 Compare offers side by side
 </Link>
 </div>
 <p className="mt-3 text-center text-xs text-zinc-500">No phone number required</p>
 <div className="mx-auto mt-6 max-w-xl text-left">
 <FredRateBenchmarkStrip benchmarks={mortgageBenchmarks} />
 </div>
 <div className="mt-8">
 <SearchBar className="mx-auto max-w-lg" />
 </div>
 </div>
 </div>
 </section>

 {/* Light status strip (was solid navy/black) */}
 <div className="border-b border-zinc-200 bg-emerald-50 py-2.5 text-center text-xs text-emerald-900">
 <strong className="font-semibold">Free</strong>
 {' · '}
 No sign-up · Educational tools · NMLS-verified lender matching
 </div>

 <div className="container mx-auto px-4 py-10 md:py-14">
 <CalculatorHub />
 <div className="mx-auto mt-10 max-w-2xl">
 <ContinueTrustJourney
 currentHub="lender"
 context={{ src: 'lender', journey: 'purchase', intent: 'buy' }}
 title="After payment research"
 />
 </div>
 </div>

 <TrustBar />

 <section
 className="border-y border-zinc-100 bg-zinc-50/80 py-14"
 aria-labelledby="how-calc-works"
 >
 <div className="container mx-auto px-4">
 <h2
 id="how-calc-works"
 className="mb-8 text-center text-2xl font-bold text-[#0A2540]"
 >
 How calculators connect to verified lenders
 </h2>
 <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
 {[
 {
 step: '01',
 title: 'Calculate your numbers',
 desc: 'Use sliders and presets (including Florida first-time buyer examples) to model payments, affordability, refinance savings, and more.',
 },
 {
 step: '02',
 title: 'Match your profile',
 desc: 'Every tool ends with Match Me to Lenders — we pass your estimated loan amount, rate, and loan type to filter NMLS-verified brokers and lenders.',
 },
 {
 step: '03',
 title: 'Compare by county',
 desc: 'Enter your ZIP on any page to see county-level Trust and Experience scores. Cross-check FDIC banks for deposit safety.',
 },
 ].map((item) => (
 <div
 key={item.step}
 className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
 >
 <span className="text-2xl font-bold text-[#059669]/40">{item.step}</span>
 <h3 className="mt-2 text-lg font-bold text-[#0A2540]">{item.title}</h3>
 <p className="mt-2 text-sm text-zinc-600">{item.desc}</p>
 </div>
 ))}
 </div>
 </div>
 </section>

 <section className="border-t border-zinc-200 bg-white py-14" aria-labelledby="calc-faq">
 <div className="container mx-auto max-w-3xl px-4">
 <h2 id="calc-faq" className="mb-8 text-center text-2xl font-bold text-[#0A2540]">
 Calculator FAQ
 </h2>
 <div className="space-y-4">
 {FAQ.map((f) => (
 <details
 key={f.q}
 className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
 >
 <summary className="cursor-pointer font-semibold text-[#0A2540]">{f.q}</summary>
 <p className="mt-2 text-sm text-zinc-600">{f.a}</p>
 </details>
 ))}
 </div>
 <p className="mt-8 text-center text-sm text-zinc-500">
 Explore county lenders:{' '}
 <Link href="/local-lenders/florida" className="font-medium text-emerald-700 hover:underline">
 Florida
 </Link>
 {' · '}
 <Link href="/local-lenders/texas" className="font-medium text-emerald-700 hover:underline">
 Texas
 </Link>
 {' · '}
 <Link
 href="/local-lenders/california"
 className="font-medium text-emerald-700 hover:underline"
 >
 California
 </Link>
 {' · '}
 <Link href="/fdic-insured-banks" className="font-medium text-emerald-700 hover:underline">
 FDIC Banks
 </Link>
 </p>
 </div>
 </section>
 </>
 );
}
