'use client';

import { useState } from 'react';
import { Copy, Check, ExternalLink, ShieldCheck, MapPin } from 'lucide-react';
import type { FDICBank } from '@/lib/fdic/types';
import {
  fdicBankFindUrl,
  formatInsuredDate,
  getRegulatorColors,
  getRegulatorKey,
  isHeadquarteredInState,
} from '@/lib/fdic/utils';

export function BankCard({
  bank,
  stateAbbr,
  stateName,
}: {
  bank: FDICBank;
  stateAbbr: string;
  stateName: string;
}) {
  const [copied, setCopied] = useState(false);
  const regKey = getRegulatorKey(bank.primary_regulator);
  const regColors = getRegulatorColors(regKey);
  const hqInState = isHeadquarteredInState(bank.headquarters_address, stateAbbr);

  async function copyCert() {
    try {
      await navigator.clipboard.writeText(bank.fdic_cert);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <article className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-[#00A3A1]/50 hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold leading-tight text-[#0A2540]">{bank.name}</h3>
        <span className="trust-badge shrink-0 text-[10px]">
          <ShieldCheck className="h-3 w-3" aria-hidden="true" />
          Verified
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${regColors.bg} ${regColors.text}`}>
          {bank.primary_regulator.includes('Comptroller')
            ? 'OCC'
            : bank.primary_regulator.includes('Federal Reserve')
              ? 'Federal Reserve'
              : 'FDIC'}
        </span>
        {hqInState && (
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
            HQ in {stateName}
          </span>
        )}
      </div>

      <dl className="mb-4 flex-1 space-y-2 text-sm text-zinc-600">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">FDIC Insured Since</dt>
          <dd className="font-medium text-[#0A2540]">{formatInsuredDate(bank.fdic_insured_since)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">FDIC Certificate</dt>
          <dd className="flex items-center gap-2">
            <a
              href={fdicBankFindUrl(bank.fdic_cert)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono font-medium text-[#00A3A1] hover:underline"
            >
              #{bank.fdic_cert}
            </a>
            <button
              type="button"
              onClick={copyCert}
              className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-[#0A2540]"
              aria-label={`Copy FDIC certificate ${bank.fdic_cert}`}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-[#00A3A1]" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </dd>
        </div>
        <div className="flex gap-1.5">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
          <dd>{bank.headquarters_address}</dd>
        </div>
      </dl>

      <a
        href={bank.website}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-[#0A2540] transition-colors hover:border-[#00A3A1] hover:bg-[#00A3A1]/5"
      >
        Visit Website <ExternalLink className="h-4 w-4" aria-hidden="true" />
      </a>
    </article>
  );
}