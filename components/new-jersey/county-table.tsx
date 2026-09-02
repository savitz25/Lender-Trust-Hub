'use client';

import { useMemo, useState } from 'react';
import { fmtInt, fmtPct } from '@/lib/new-jersey-intelligence/snapshot';

type County = {
  county_fips: string;
  county_name: string;
  applications: number;
  originations: number;
  denials: number;
  denial_rate_pct: number | null;
  purchase_pct_of_apps: number | null;
  refinance_pct_of_apps: number | null;
  conventional_pct: number | null;
};

export function NewJerseyCountyTable({ counties }: { counties: County[] }) {
  const [open, setOpen] = useState(false);
  const rows = useMemo(
    () => [...counties].sort((a, b) => a.county_name.localeCompare(b.county_name)),
    [counties],
  );
  const shown = open ? rows : rows.slice(0, 8);

  return (
    <div className="mt-4">
      <div className="min-w-0 overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <caption className="sr-only">
            2025 HMDA activity for all 21 New Jersey counties. Denial rate is not a quality ranking.
          </caption>
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th scope="col" className="py-2 pr-3">County</th>
              <th scope="col" className="py-2 pr-3 text-right">Applications</th>
              <th scope="col" className="py-2 pr-3 text-right">Originations</th>
              <th scope="col" className="py-2 pr-3 text-right">Denials</th>
              <th scope="col" className="py-2 pr-3 text-right">Denial rate</th>
              <th scope="col" className="py-2 pr-3 text-right">Purchase % of apps</th>
              <th scope="col" className="py-2 text-right">Conv. % of apps</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((c) => (
              <tr key={c.county_fips} className="border-b border-slate-100">
                <th scope="row" className="py-2 pr-3 font-medium text-slate-800">
                  {c.county_name}
                </th>
                <td className="py-2 pr-3 text-right tabular-nums">{fmtInt(c.applications)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{fmtInt(c.originations)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{fmtInt(c.denials)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{fmtPct(c.denial_rate_pct)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{fmtPct(c.purchase_pct_of_apps)}</td>
                <td className="py-2 text-right tabular-nums">{fmtPct(c.conventional_pct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Denial rate is denials divided by applications in this extract. It is not a best/worst ranking.
      </p>
      {rows.length > 8 ? (
        <button
          type="button"
          className="mt-3 text-sm font-medium text-[#047857] underline underline-offset-2"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Show fewer counties' : `Show all ${rows.length} counties`}
        </button>
      ) : null}
    </div>
  );
}
