'use client';

import { useState } from 'react';
import { X, Scale, Table2, LayoutGrid } from 'lucide-react';
import type { FDICBank } from '@/lib/fdic/types';
import {
  fdicBankFindUrl,
  formatInsuredDate,
  getRegulatorKey,
  getRegulatorLabel,
  isHeadquarteredInState,
} from '@/lib/fdic/utils';
import { trackDirectoryEvent } from '@/lib/directory/analytics';

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
  const [view, setView] = useState<'cards' | 'table'>('table');

  if (selectedCerts.length === 0) return null;

  const selected = selectedCerts
    .map((cert) => banks.find((b) => b.fdic_cert === cert))
    .filter((b): b is FDICBank => !!b);

  const rows = [
    { label: 'Insured since', get: (b: FDICBank) => formatInsuredDate(b.fdic_insured_since) },
    { label: 'Regulator', get: (b: FDICBank) => getRegulatorLabel(getRegulatorKey(b.primary_regulator)) },
    {
      label: `HQ in ${stateName}`,
      get: (b: FDICBank) =>
        isHeadquarteredInState(b.headquarters_address, stateAbbr) ? 'Yes' : 'No',
    },
    {
      label: 'FDIC Cert',
      get: (b: FDICBank) => b.fdic_cert,
      link: (b: FDICBank) => fdicBankFindUrl(b.fdic_cert),
    },
    { label: 'Headquarters', get: (b: FDICBank) => b.headquarters_address },
  ];

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 max-h-[70vh] overflow-y-auto border-t border-zinc-200 bg-white/95 shadow-2xl backdrop-blur"
      role="region"
      aria-label="Bank comparison"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-[#00A3A1]" aria-hidden="true" />
            <h3 className="font-semibold text-[#0A2540]">
              Compare Banks ({selected.length}/3)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-zinc-200 p-0.5">
              <button
                type="button"
                onClick={() => setView('table')}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${
                  view === 'table' ? 'bg-[#0A2540] text-white' : 'text-zinc-600'
                }`}
                aria-pressed={view === 'table'}
              >
                <Table2 className="h-3.5 w-3.5" /> Table
              </button>
              <button
                type="button"
                onClick={() => setView('cards')}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${
                  view === 'cards' ? 'bg-[#0A2540] text-white' : 'text-zinc-600'
                }`}
                aria-pressed={view === 'cards'}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Cards
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                trackDirectoryEvent({
                  name: 'directory_compare_clear',
                  category: 'fdic',
                  state: stateName,
                });
                onClear();
              }}
              className="text-sm font-semibold text-zinc-500 hover:text-[#0A2540]"
            >
              Clear all
            </button>
          </div>
        </div>

        {view === 'table' ? (
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b bg-zinc-50">
                  <th scope="col" className="p-3 text-left text-xs font-semibold uppercase text-zinc-500">
                    Attribute
                  </th>
                  {selected.map((bank) => (
                    <th key={bank.fdic_cert} scope="col" className="p-3 text-left font-semibold text-[#0A2540]">
                      <div className="flex items-start justify-between gap-2">
                        <span className="max-w-[140px] leading-tight">{bank.name}</span>
                        <button
                          type="button"
                          onClick={() => onRemove(bank.fdic_cert)}
                          className="shrink-0 rounded p-0.5 text-zinc-400 hover:text-[#0A2540]"
                          aria-label={`Remove ${bank.name}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-b border-zinc-100">
                    <th scope="row" className="p-3 text-xs font-medium text-zinc-400">
                      {row.label}
                    </th>
                    {selected.map((bank) => (
                      <td key={bank.fdic_cert + row.label} className="p-3 text-zinc-700">
                        {row.link ? (
                          <a
                            href={row.link(bank)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[#00A3A1] hover:underline"
                          >
                            {row.get(bank)}
                          </a>
                        ) : (
                          row.get(bank)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
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
                  {rows.map((row) => (
                    <div key={row.label} className="flex justify-between gap-2">
                      <dt className="text-zinc-400">{row.label}</dt>
                      <dd className="text-right">{row.get(bank)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
            {selected.length < 3 && (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-zinc-300 p-4 text-center text-xs text-zinc-500">
                Select up to 3 banks using the compare checkbox on any card
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}