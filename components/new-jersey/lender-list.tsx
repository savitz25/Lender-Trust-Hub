'use client';

import { useMemo, useState } from 'react';

type Row = { name: string; phone: string | null; on_numbered_recent_activity_list: boolean };

export function NewJerseyHmfaLenderList({ names }: { names: Row[] }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const rows = needle
      ? names.filter((n) => n.name.toLowerCase().includes(needle))
      : names;
    return rows;
  }, [names, q]);
  const shown = open ? filtered : filtered.slice(0, 12);

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-slate-800" htmlFor="njhmfa-name-search">
        Search names on the April 2026 activity list
      </label>
      <input
        id="njhmfa-name-search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        placeholder="Type a lender name"
        autoComplete="off"
      />
      <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {shown.map((n) => (
          <li key={n.name} className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2 text-sm">
            <span className="text-slate-800">{n.name}</span>
            {n.phone ? <span className="tabular-nums text-slate-500">{n.phone}</span> : null}
          </li>
        ))}
        {shown.length === 0 ? <li className="px-3 py-2 text-sm text-slate-500">No matching names on this source list.</li> : null}
      </ul>
      {filtered.length > 12 ? (
        <button
          type="button"
          className="mt-3 text-sm font-medium text-[#047857] underline underline-offset-2"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Show fewer names' : `Show all ${filtered.length} matching names`}
        </button>
      ) : null}
    </div>
  );
}
