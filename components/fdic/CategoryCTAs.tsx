import Link from 'next/link';
import { Building2, Car, Calculator, Shield, Wrench } from 'lucide-react';
import type { StateMeta } from '@/lib/fdic/types';

export function CategoryCTAs({ stateMeta }: { stateMeta: StateMeta }) {
  const items = [
    {
      href: `/local-lenders/${stateMeta.slug}`,
      icon: Building2,
      title: `Mortgage Lenders in ${stateMeta.fullName}`,
      desc: 'Verified local mortgage brokers and companies',
      live: true,
    },
    {
      href: '/calculators',
      icon: Calculator,
      title: 'Mortgage Calculators',
      desc: 'Payment, affordability, and refinance tools',
      live: true,
    },
    {
      href: `/auto-loan-companies/${stateMeta.slug}`,
      icon: Car,
      title: `Auto Loan Companies in ${stateMeta.fullName}`,
      desc: 'Coming soon — same trusted directory framework',
      live: false,
    },
    {
      href: `/credit-repair/${stateMeta.slug}`,
      icon: Wrench,
      title: `Credit Repair in ${stateMeta.fullName}`,
      desc: 'Coming soon — transparent, verified listings',
      live: false,
    },
    {
      href: 'https://www.movetrusthub.com',
      icon: Shield,
      title: 'MoveTrustHub',
      desc: 'Trusted moving & relocation resources',
      live: true,
      external: true,
    },
  ];

  return (
    <section aria-labelledby="related-categories" className="mt-8">
      <h2 id="related-categories" className="mb-4 text-xl font-bold text-[#0A2540]">
        Explore More in {stateMeta.fullName}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const className = `rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-[#00A3A1] hover:shadow-sm ${
            !item.live ? 'opacity-80' : ''
          }`;
          const inner = (
            <>
              <item.icon className="mb-2 h-6 w-6 text-[#00A3A1]" aria-hidden="true" />
              <p className="text-sm font-semibold text-[#0A2540]">{item.title}</p>
              <p className="mt-1 text-xs text-zinc-500">{item.desc}</p>
              {!item.live && (
                <span className="mt-2 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-zinc-500">
                  Coming soon
                </span>
              )}
            </>
          );

          if (item.external) {
            return (
              <a
                key={item.title}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                {inner}
              </a>
            );
          }

          return (
            <Link key={item.title} href={item.href} className={className}>
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}