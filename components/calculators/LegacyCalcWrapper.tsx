'use client';

import { CalcDisclaimer } from '@/components/calculators/shared/CalcDisclaimer';
import { CalcMatchCTA } from '@/components/calculators/shared/CalcMatchCTA';
import type { CalcMatchProfile } from '@/lib/calculators/match-profile';

/** Wraps legacy calculator components with unified disclaimer + match CTA */
export function LegacyCalcWrapper({
  children,
  matchProfile,
  matchLabel,
}: {
  children: React.ReactNode;
  matchProfile?: CalcMatchProfile;
  matchLabel?: string;
}) {
  return (
    <div className="space-y-0 overflow-hidden rounded-xl border border-zinc-200 shadow-sm dark:border-zinc-700">
      <div className="border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/50">
        <CalcDisclaimer />
      </div>
      <div>{children}</div>
      {matchProfile && (
        <div className="border-t border-zinc-100 bg-gradient-to-r from-emerald-50/80 to-slate-50 p-4 dark:border-zinc-800 dark:from-emerald-950/30 md:p-6">
          <CalcMatchCTA profile={matchProfile} label={matchLabel} />
        </div>
      )}
    </div>
  );
}