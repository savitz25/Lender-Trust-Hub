import { Shield, Building2, MapPin, Database } from 'lucide-react';
import { getPublicTrustBarStats, formatExactCount } from '@/lib/directory/public-counts';

export function TrustBar() {
  const bar = getPublicTrustBarStats();

  const stats = [
    {
      icon: Shield,
      value: formatExactCount(bar.nmlsVerified.value),
      label: bar.nmlsVerified.label,
    },
    {
      icon: Building2,
      value: formatExactCount(bar.companies.value),
      label: bar.companies.label,
    },
    {
      icon: MapPin,
      value: bar.coverageLabel,
      label: 'County coverage',
    },
    {
      icon: Database,
      value: bar.sourcesLabel,
      label: 'Data source classes',
    },
  ];

  return (
    <section aria-label="Directory statistics" className="border-y border-zinc-200 bg-white">
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
        Counts are live catalog inventory (distinct companies by NMLS). Not a complete national
        census. See{' '}
        <a href="/methodology" className="font-medium text-[#059669] hover:underline">
          methodology
        </a>
        .
      </p>
    </section>
  );
}
