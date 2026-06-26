'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { FDICBank } from '@/lib/fdic/types';
import { isHeadquarteredInState } from '@/lib/fdic/utils';

type Preference = 'any' | 'hq' | 'legacy' | 'occ';

export function BankMatchPanel({
  banks,
  stateAbbr,
  stateName,
  onApplyHqOnly,
  onApplyLegacy,
  onApplyRegulator,
  onReset,
}: {
  banks: FDICBank[];
  stateAbbr: string;
  stateName: string;
  onApplyHqOnly: () => void;
  onApplyLegacy: () => void;
  onApplyRegulator: (reg: 'OCC' | 'FED' | 'FDIC') => void;
  onReset: () => void;
}) {
  const [preference, setPreference] = useState<Preference>('any');

  const hqCount = banks.filter((b) => isHeadquarteredInState(b.headquarters_address, stateAbbr)).length;
  const legacyCount = banks.filter((b) => {
    const y = parseInt(b.fdic_insured_since.split('/')[2] ?? '0', 10);
    return y > 0 && y < 2000;
  }).length;

  function apply() {
    onReset();
    if (preference === 'hq') onApplyHqOnly();
    else if (preference === 'legacy') onApplyLegacy();
    else if (preference === 'occ') onApplyRegulator('OCC');
  }

  return (
    <div className="rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-br from-amber-50/80 to-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-[#D4AF37]" aria-hidden="true" />
        <h3 className="font-semibold text-[#0A2540]">Quick Bank Match</h3>
      </div>
      <p className="mb-4 text-sm text-zinc-600">
        Tell us what you prefer and we&apos;ll filter the {stateName} directory instantly.
      </p>
      <fieldset className="space-y-2">
        <legend className="sr-only">Bank preferences</legend>
        {[
          { id: 'any', label: 'Show all FDIC banks', detail: `${banks.length} institutions` },
          { id: 'hq', label: `Headquartered in ${stateName}`, detail: `${hqCount} banks` },
          { id: 'legacy', label: 'Established before 2000', detail: `${legacyCount} banks` },
          { id: 'occ', label: 'OCC-regulated (national banks)', detail: 'National bank charter' },
        ].map((opt) => (
          <label
            key={opt.id}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-white p-3 has-[:checked]:border-[#00A3A1] has-[:checked]:ring-1 has-[:checked]:ring-[#00A3A1]/30"
          >
            <input
              type="radio"
              name="bank-match"
              value={opt.id}
              checked={preference === opt.id}
              onChange={() => setPreference(opt.id as Preference)}
              className="mt-1 accent-[#00A3A1]"
            />
            <span>
              <span className="block text-sm font-medium text-[#0A2540]">{opt.label}</span>
              <span className="text-xs text-zinc-500">{opt.detail}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <button
        type="button"
        onClick={apply}
        className="mt-4 w-full rounded-xl bg-[#00A3A1] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#008f8d]"
      >
        Apply Filters
      </button>
    </div>
  );
}