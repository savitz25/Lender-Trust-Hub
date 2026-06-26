import Link from 'next/link';
import { Building2, Car, Calculator, Shield, Wrench, Landmark } from 'lucide-react';
import type { StateMeta } from '@/lib/fdic/types';
import { FDIC_CATEGORY } from '@/lib/directory/categories';

const ICONS = [Building2, Calculator, Car, Wrench, Shield, Landmark] as const;

export function CategoryCTAs({ stateMeta }: { stateMeta: StateMeta }) {
  const items = [
    ...FDIC_CATEGORY.relatedVerticals.map((v, i) => ({
      href: v.href(stateMeta.slug),
      icon: ICONS[i] ?? Building2,
      title: v.label.includes('Calculator')
        ? v.label
        : `${v.label} in ${stateMeta.fullName}`,
      desc: v.description,
      live: v.live,
      external: false as boolean,
    })),
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