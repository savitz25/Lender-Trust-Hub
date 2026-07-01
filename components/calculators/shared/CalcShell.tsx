'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalcDisclaimer } from './CalcDisclaimer';
import { CalcMatchCTA } from './CalcMatchCTA';
import type { CalcMatchProfile } from '@/lib/calculators/match-profile';

interface CalcShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  matchProfile?: CalcMatchProfile;
  matchLabel?: string;
  actions?: React.ReactNode;
  onPreset?: () => void;
  presetLabel?: string;
}

export function CalcShell({
  title, subtitle, children, matchProfile, matchLabel, actions, onPreset, presetLabel,
}: CalcShellProps) {
  return (
    <Card className="overflow-hidden border-zinc-200 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-800/50">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl text-[#0F172A] dark:text-white md:text-2xl">{title}</CardTitle>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {onPreset && (
              <button
                type="button"
                onClick={onPreset}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:border-emerald-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
              >
                {presetLabel ?? 'Example Preset'}
              </button>
            )}
            {actions}
          </div>
        </div>
        <CalcDisclaimer className="mt-3" />
      </CardHeader>
      <CardContent className="space-y-6 p-4 md:p-6">{children}</CardContent>
      {matchProfile && (
        <div className="border-t border-zinc-100 bg-gradient-to-r from-emerald-50/80 to-slate-50 p-4 dark:border-zinc-800 dark:from-emerald-950/30 dark:to-zinc-900 md:p-6">
          <CalcMatchCTA profile={matchProfile} label={matchLabel} />
        </div>
      )}
    </Card>
  );
}