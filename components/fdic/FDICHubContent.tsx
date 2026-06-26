import Link from 'next/link';
import { Shield, MapPin, Search, Scale } from 'lucide-react';
import { US_STATES } from '@/lib/fdic/states';
import { stateData, DATA_UPDATED } from '@/lib/fdic/stateData';
import { statePagePath, buildHubTitle } from '@/lib/fdic/seo';

const REGIONS = [...new Set(US_STATES.map((s) => s.region))];

/**
 * National FDIC hub — server-rendered for SEO + fast LCP.
 * Interactive map/filters live in FDICBanksExplorer above this section.
 */
export function FDICHubContent({ totalBanks, stateCount }: { totalBanks: number; stateCount: number }) {
  return (
    <>
      <section className="border-b border-zinc-200 bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-[#0A2540] md:text-3xl">
              The Definitive FDIC Bank Directory
            </h2>
            <p className="mt-4 text-zinc-600">
              {totalBanks.toLocaleString()}+ verified institutions across {stateCount} U.S.
              jurisdictions. Every listing links to official FDIC BankFind records. No paid
              placements — ever.
            </p>
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Shield, label: 'FDIC Verified', sub: 'Official cert numbers' },
              { icon: MapPin, label: '51 Jurisdictions', sub: '50 states + DC' },
              { icon: Search, label: 'Live Filters', sub: 'Regulator, date, HQ' },
              { icon: Scale, label: 'Compare Tool', sub: 'Up to 3 banks' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-center"
              >
                <item.icon className="mx-auto mb-2 h-7 w-7 text-[#00A3A1]" aria-hidden="true" />
                <p className="font-semibold text-[#0A2540]">{item.label}</p>
                <p className="text-xs text-zinc-500">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-zinc-50 py-12">
        <div className="container mx-auto px-4">
          <h2 className="mb-2 text-2xl font-bold text-[#0A2540]">Browse FDIC Banks by State</h2>
          <p className="mb-8 max-w-3xl text-zinc-600">
            Select any state for a dedicated page with {buildHubTitle().includes('2026') ? '2026' : ''}{' '}
            filters, animated stats, bank comparison, and expanded FAQ schema.
          </p>
          {REGIONS.map((region) => (
            <div key={region} className="mb-8">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {region}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {US_STATES.filter((s) => s.region === region && s.hasData).map((s) => {
                  const count = stateData[s.code]?.banks.length ?? 0;
                  return (
                    <Link
                      key={s.code}
                      href={statePagePath(s.slug)}
                      prefetch
                      className="rounded-xl border border-zinc-200 bg-white px-4 py-3 transition hover:border-[#00A3A1] hover:shadow-sm"
                    >
                      <span className="font-semibold text-[#0A2540]">{s.fullName}</span>
                      <span className="mt-1 block text-xs text-zinc-500">
                        {count} institutions
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-[#0A2540] py-6 text-center text-xs text-zinc-400">
        Data last updated from FDIC {DATA_UPDATED}. Not financial advice.{' '}
        <a
          href="https://banks.data.fdic.gov/bankfind-suite/bankfind"
          className="text-[#00A3A1] underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Verify at FDIC BankFind
        </a>
        .
      </section>
    </>
  );
}