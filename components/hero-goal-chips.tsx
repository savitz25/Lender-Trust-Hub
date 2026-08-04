import Link from 'next/link';

/**
 * Hero goal chips — “What are you trying to accomplish?”
 * Internal research navigation only (no lead forms).
 */
const GOALS = [
  {
    label: 'Buy my first home',
    href: '/local-lenders',
    detail: 'NMLS lender research for first-time buyers',
  },
  {
    label: 'Buy a home',
    href: '/local-lenders',
    detail: 'Browse local lenders by state and county',
  },
  {
    label: 'Refinance',
    href: '/calculators#refinance',
    detail: 'Educational refinance breakeven tools',
  },
  {
    label: 'See what I can afford',
    href: '/calculators#affordability',
    detail: 'Affordability and payment calculators',
  },
  {
    label: 'Explore lenders in my area',
    href: '/local-lenders',
    detail: 'Directory by market',
  },
] as const;

export function HeroGoalChips() {
  return (
    <nav aria-label="What are you trying to accomplish?" className="w-full">
      <ul className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
        {GOALS.map((goal) => (
          <li key={goal.label}>
            <Link
              href={goal.href}
              title={goal.detail}
              className="inline-flex min-h-11 items-center rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#0A2540] shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2"
            >
              {goal.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
