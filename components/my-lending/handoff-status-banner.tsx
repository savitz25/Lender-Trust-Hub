'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export function HandoffStatusBanner() {
  const params = useSearchParams();
  const [dismissed, setDismissed] = useState(false);
  const status = params.get('handoff');

  useEffect(() => {
    if (status === 'ok' && typeof window !== 'undefined') {
      // Lightweight notice without sonner dependency
      console.info('[handoff] signed in across Ask Trust Hub');
    }
  }, [status]);

  if (dismissed) return null;

  if (status === 'ok') {
    return (
      <div
        className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
        role="status"
      >
        Signed in across Ask Trust Hub.
        <button
          type="button"
          className="ml-3 text-xs font-semibold underline"
          onClick={() => setDismissed(true)}
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (status !== 'failed') return null;

  return (
    <div
      className="mb-4 flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between"
      role="status"
    >
      <p>
        We couldn&apos;t carry your sign-in over from another Trust Hub site. Please sign in once on
        this site — your research on this device stays either way.
      </p>
      <button
        type="button"
        className="shrink-0 text-xs font-semibold underline"
        onClick={() => setDismissed(true)}
      >
        Dismiss
      </button>
    </div>
  );
}
