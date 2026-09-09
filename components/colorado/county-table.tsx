'use client';

import { useMemo, useState } from 'react';
import { fmtInt, fmtPct } from '@/lib/colorado-intelligence/snapshot';

type County = {
  county_fips: string;
  county_name: string;
  applications: number;
  originations: number;
  denials: number;
  denial_rate_pct: number | null;
  purchase_pct_of_apps: number | null;
  refinance_pct_of_apps: number | null;
};

export function ColoradoCountyTable({ counties }: { counties: County[] }) {
  const [open, setOpen] = useState(false);
  const rows = useMemo(
    () => [...counties].sort((a, b) => a.county_name.localeCompare(b.county_name)),
    [counties],
  );
  const shown = open ? rows : rows.slice(0, 12);

  return (
    <div className="mt-4">
      <div className="min-w-0 overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <caption className="sr-only">
            2025 HMDA activity for Colorado counties in this extract. Denial rate is not a quality
            ranking. County names are not links. No Denver or county intelligence routes.
          </caption>
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th scope="col" className="py-2 pr-3">
                County
              </th>
              <th scope="col" className="py-2 pr-3 text-right">
                Applications
              </th>
              <th scope="col" className="py-2 pr-3 text-right">
                Originations
              </th>
              <th scope="col" className="py-2 pr-3 text-right">
                Denials
              </th>
              <th scope="col" className="py-2 pr-3 text-right">
                Denial rate
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => (
              <tr key={row.county_fips} className="border-b border-slate-100">
                <th scope="row" className="py-2 pr-3 font-medium text-slate-800">
                  {row.county_name}
                </th>
                <td className="py-2 pr-3 text-right tabular-nums">{fmtInt(row.applications)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{fmtInt(row.originations)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{fmtInt(row.denials)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{fmtPct(row.denial_rate_pct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 12 ? (
        <button
          type="button"
          className="mt-3 text-sm font-medium text-[#047857] underline underline-offset-2"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Show fewer counties' : `Show all ${rows.length} Colorado counties`}
        </button>
      ) : null}
    </div>
  );
}
