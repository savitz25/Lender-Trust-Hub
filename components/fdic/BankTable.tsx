'use client';

import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import type { FDICBank } from '@/lib/fdic/types';
import {
  fdicBankFindUrl,
  formatInsuredDate,
  getRegulatorKey,
  getRegulatorLabel,
  isHeadquarteredInState,
} from '@/lib/fdic/utils';

export function BankTable({
  banks,
  stateAbbr,
  stateName,
}: {
  banks: FDICBank[];
  stateAbbr: string;
  stateName: string;
}) {
  const [copiedCert, setCopiedCert] = useState<string | null>(null);

  async function copyCert(cert: string) {
    try {
      await navigator.clipboard.writeText(cert);
      setCopiedCert(cert);
      setTimeout(() => setCopiedCert(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <tr>
            <th scope="col" className="px-4 py-3">Bank Name</th>
            <th scope="col" className="px-4 py-3">FDIC Cert</th>
            <th scope="col" className="px-4 py-3">Insured Since</th>
            <th scope="col" className="px-4 py-3">Regulator</th>
            <th scope="col" className="px-4 py-3">Headquarters</th>
            <th scope="col" className="px-4 py-3">Links</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {banks.map((bank) => {
            const hq = isHeadquarteredInState(bank.headquarters_address, stateAbbr);
            return (
              <tr key={bank.fdic_cert} className="hover:bg-zinc-50/80">
                <td className="px-4 py-3 font-medium text-[#0A2540]">
                  {bank.name}
                  {hq && (
                    <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                      HQ
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <a
                      href={fdicBankFindUrl(bank.fdic_cert)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[#00A3A1] hover:underline"
                    >
                      {bank.fdic_cert}
                    </a>
                    <button
                      type="button"
                      onClick={() => copyCert(bank.fdic_cert)}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-100"
                      aria-label={`Copy certificate ${bank.fdic_cert}`}
                    >
                      {copiedCert === bank.fdic_cert ? (
                        <Check className="h-3.5 w-3.5 text-[#00A3A1]" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-600">{formatInsuredDate(bank.fdic_insured_since)}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700">
                    {getRegulatorLabel(getRegulatorKey(bank.primary_regulator))}
                  </span>
                </td>
                <td className="max-w-xs px-4 py-3 text-zinc-600">{bank.headquarters_address}</td>
                <td className="px-4 py-3">
                  {bank.website ? (
                    <a
                      href={bank.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#00A3A1] hover:underline"
                    >
                      Site <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}