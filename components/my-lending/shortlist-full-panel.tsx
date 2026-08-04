'use client';

import type { SavedLender } from '@/lib/my-lending/types';
import { SHORTLIST_CAP } from '@/lib/my-lending/shortlist-rules';
import { Button } from '@/components/ui/button';

type Props = {
  shortlisted: SavedLender[];
  incomingName: string;
  onCancel: () => void;
  onDemoteOldest: () => void;
  onReplace: (slug: string) => void;
  onSaveAsResearching: () => void;
};

/**
 * When user tries to shortlist a 4th lender — never silently drop data.
 */
export function ShortlistFullPanel({
  shortlisted,
  incomingName,
  onCancel,
  onDemoteOldest,
  onReplace,
  onSaveAsResearching,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortlist-full-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl">
        <h2 id="shortlist-full-title" className="text-lg font-semibold text-[#0A2540]">
          Shortlist is full ({SHORTLIST_CAP})
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Move one to Researching, replace someone, or save <strong>{incomingName}</strong> as
          Researching instead.
        </p>
        <ul className="mt-4 space-y-2">
          {shortlisted.map((l) => (
            <li
              key={l.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-zinc-100 px-3 py-2 text-sm"
            >
              <span className="min-w-0 truncate font-medium">{l.lenderName}</span>
              <Button type="button" size="sm" variant="outline" onClick={() => onReplace(l.lenderSlug)}>
                Replace
              </Button>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-col gap-2">
          <Button type="button" variant="trust" onClick={onDemoteOldest}>
            Move oldest shortlisted to Researching &amp; add this
          </Button>
          <Button type="button" variant="outline" onClick={onSaveAsResearching}>
            Save as Researching only
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
