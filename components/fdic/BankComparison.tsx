'use client';

import { X, Scale } from 'lucide-react';
import type { FDICBank } from '@/lib/fdic/types';
import {
  fdicBankFindUrl,
  formatInsuredDate,
  getRegulatorKey,
  getRegulatorLabel,
  isHeadquarteredInState,
} from '@/lib/fdic/utils';

export function BankComparison({
  banks,
  selectedCerts,
  stateAbbr,
  stateName,
  onRemove,
  onClear,
}: {
  banks: FDICBank[];
  selectedCerts: string[];
  stateAbbr: string;
  stateName: string;
  onRemove: (cert: string) => void;
  onClear: () => void;
}) {
  if (selectedCerts.length === 0) return null;

  const selected = selectedCerts
    .map((cert) => banks.find((b) => b.fdic_cert === cert))
    .filter((b): b is FDICBank => !!b);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 shadow-2xl backdrop-blur"
      role="region"
      aria-label="Bank comparison"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-[#00A3A1]" aria-hidden="true" />
            <h3 className="font-semibold text-[#0A2540]">
              Compare Banks ({selected.length}/3)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="text-sm font-semibold text-zinc-500 hover:text-[#0A2540]"
          >
            Clear all
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {selected.map((bank) => (
            <div
              key={bank.fdic_cert}
              className="relative rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm"
            >
              <button
                type="button"
                onClick={() => onRemove(bank.fdic_cert)}
                className="absolute right-2 top-2 rounded-md p-1 text-zinc-400 hover:bg-white hover:text-[#0A2540]"
                aria-label={`Remove ${bank.name} from comparison`}
              >
                <X className="h-4 w-4" />
              </button>
              <p className="pr-6 font-semibold text-[#0A2540]">{bank.name}</p>
              <dl className="mt-2 space-y-1 text-xs text-zinc-600">
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-400">Insured since</dt>
                  <dd>{formatInsuredDate(bank.fdic_insured_since)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-400">Regulator</dt>
                  <dd>{getRegulatorLabel(getRegulatorKey(bank.primary_regulator))}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-400">HQ in {stateName}</dt>
                  <dd>
                    {isHeadquarteredInState(bank.headquarters_address, stateAbbr) ? 'Yes' : 'No'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-400">FDIC Cert</dt>
                  <dd>
                    <a
                      href={fdicBankFindUrl(bank.fdic_cert)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[#00A3A1] hover:underline"
                    >
                      {bank.fdic_cert}
                    </a>
                  </dd>
                </div>
              </dl>
            </div>
          ))}
          {selected.length < 3 && (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-zinc-300 p-4 text-center text-xs text-zinc-500">
              Select up to 3 banks using the compare checkbox on any card
            </div>
          )}
        </div>
      </div>
    </div>
  );
}