'use client';

import { useRouter } from 'next/navigation';
import { MapPin, ChevronDown } from 'lucide-react';
import { US_STATES } from '@/lib/fdic/states';
import { statePagePath } from '@/lib/fdic/seo';
import type { StateMeta } from '@/lib/fdic/types';

const REGIONS = [...new Set(US_STATES.map((s) => s.region))];

export function StateSelectorBar({
  currentState,
  showGrid = false,
}: {
  currentState: StateMeta;
  showGrid?: boolean;
}) {
  const router = useRouter();

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-[#00A3A1]" aria-hidden="true" />
          <label htmlFor="state-switcher" className="text-sm font-semibold text-[#0A2540]">
            Switch State
          </label>
        </div>
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <select
            id="state-switcher"
            value={currentState.code}
            onChange={(e) => {
              const meta = US_STATES.find((s) => s.code === e.target.value);
              if (meta?.hasData) router.push(statePagePath(meta.slug));
            }}
            className="w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-4 pr-10 text-sm font-medium text-[#0A2540] focus:border-[#00A3A1] focus:outline-none focus:ring-2 focus:ring-[#00A3A1]/20"
            aria-label="Select a US state to view FDIC banks"
          >
            {US_STATES.filter((s) => s.hasData).map((s) => (
              <option key={s.code} value={s.code}>
                {s.fullName} ({s.code})
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden="true"
          />
        </div>
      </div>

      {showGrid && (
        <div className="mt-5 border-t border-zinc-100 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Quick select — all 50 states + DC
          </p>
          {REGIONS.map((region) => (
            <div key={region} className="mb-3">
              <p className="mb-1.5 text-[10px] font-semibold uppercase text-zinc-400">{region}</p>
              <div className="flex flex-wrap gap-1.5">
                {US_STATES.filter((s) => s.region === region && s.hasData).map((s) => (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => router.push(statePagePath(s.slug))}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                      s.code === currentState.code
                        ? 'bg-[#00A3A1] text-white shadow-sm'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-[#00A3A1]/15 hover:text-[#0A2540]'
                    }`}
                    aria-current={s.code === currentState.code ? 'true' : undefined}
                  >
                    {s.code}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}