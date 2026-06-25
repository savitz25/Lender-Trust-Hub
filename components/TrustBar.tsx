import { Shield, Star, MapPin, Database } from 'lucide-react';
import { TRUST_STATS } from '@/lib/mockData';

const stats = [
  {
    icon: Shield,
    value: `${TRUST_STATS.verifiedLenders.toLocaleString()}+`,
    label: 'Verified Lenders',
  },
  {
    icon: Star,
    value: `${(TRUST_STATS.totalReviews / 1_000_000).toFixed(1)}M`,
    label: 'Reviews Analyzed',
  },
  {
    icon: MapPin,
    value: TRUST_STATS.countiesCovered.toLocaleString(),
    label: 'Counties Covered',
  },
  {
    icon: Database,
    value: TRUST_STATS.dataSources.join(' • '),
    label: 'Data Sources',
  },
];

export function TrustBar() {
  return (
    <section
      aria-label="Trust statistics"
      className="border-y border-zinc-200 bg-white"
    >
      <div className="container mx-auto grid grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4 md:py-10">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <stat.icon
              className="mx-auto mb-2 h-6 w-6 text-[#14B8A6]"
              aria-hidden="true"
            />
            <div className="text-2xl font-bold text-[#0A2540] md:text-3xl">
              {stat.value}
            </div>
            <div className="mt-1 text-xs font-medium text-zinc-500 md:text-sm">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}