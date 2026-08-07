import { Shield, Building2, MapPin, Database } from 'lucide-react';
import { TRUST_STATS } from '@/lib/mockData';

const stats = [
  {
    icon: Shield,
    value: TRUST_STATS.verifiedLenders.toLocaleString(),
    label: 'NMLS ID verified entities',
  },
  {
    icon: Building2,
    value:
      TRUST_STATS.branchListings > TRUST_STATS.distinctEntities
        ? `${TRUST_STATS.distinctEntities} / ${TRUST_STATS.branchListings}`
        : TRUST_STATS.distinctEntities.toLocaleString(),
    label:
      TRUST_STATS.branchListings > TRUST_STATS.distinctEntities
        ? 'Lenders / branch listings'
        : 'Distinct lenders in directory',
  },
  {
    icon: MapPin,
    value: TRUST_STATS.countiesCoveredLabel,
    label: 'County coverage',
  },
  {
    icon: Database,
    value: TRUST_STATS.dataSources.join(' · '),
    label: 'Data source classes',
  },
];

export function TrustBar() {
  return (
    <section aria-label="Trust statistics" className="border-y border-zinc-200 bg-white">
      <div className="container mx-auto grid grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4 md:py-10">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <stat.icon className="mx-auto mb-2 h-6 w-6 text-[#14B8A6]" aria-hidden="true" />
            <div className="text-2xl font-bold text-[#0A2540] md:text-3xl">{stat.value}</div>
            <div className="mt-1 text-xs font-medium text-zinc-500 md:text-sm">{stat.label}</div>
          </div>
        ))}
      </div>
      <p className="container mx-auto px-4 pb-4 text-center text-[11px] text-zinc-500">
        Research directory signals — distinct NMLS entities, not inflated geo rows. See{' '}
        <a href="/methodology" className="font-medium text-[#059669] hover:underline">
          methodology
        </a>
        .
      </p>
    </section>
  );
}
