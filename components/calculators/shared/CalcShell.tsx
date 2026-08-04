'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalcDisclaimer } from './CalcDisclaimer';
import { CalcMatchCTA } from './CalcMatchCTA';
import { SaveCalculatorSnapshotButton } from '@/components/my-lending/save-calculator-snapshot-button';
import type { CalcMatchProfile } from '@/lib/calculators/match-profile';

export type CalcSnapshotPayload = {
  toolId: string;
  title: string;
  summary: string;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  href?: string;
};

interface CalcShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  matchProfile?: CalcMatchProfile;
  matchLabel?: string;
  /** Phase C — save educational result to My Lending active plan */
  snapshot?: CalcSnapshotPayload | null;
  actions?: React.ReactNode;
  onPreset?: () => void;
  presetLabel?: string;
}

/** Calculator chrome — light Trust Hub surfaces only (no dark cards). */
export function CalcShell({
  title,
  subtitle,
  children,
  matchProfile,
  matchLabel,
  snapshot,
  actions,
  onPreset,
  presetLabel,
}: CalcShellProps) {
  return (
    <Card className="overflow-hidden border-zinc-200 bg-white shadow-sm">
      <CardHeader className="border-b border-zinc-100 bg-zinc-50/80">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl text-[#0A2540] md:text-2xl">{title}</CardTitle>
            <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {onPreset && (
              <button
                type="button"
                onClick={onPreset}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:border-emerald-500"
              >
                {presetLabel ?? 'Example Preset'}
              </button>
            )}
            {actions}
          </div>
        </div>
        <CalcDisclaimer className="mt-3" />
      </CardHeader>
      <CardContent className="space-y-6 bg-white p-4 md:p-6">{children}</CardContent>
      {(matchProfile || snapshot) && (
        <div className="space-y-4 border-t border-zinc-100 bg-gradient-to-r from-emerald-50/80 to-white p-4 md:p-6">
          {snapshot ? (
            <SaveCalculatorSnapshotButton
              toolId={snapshot.toolId}
              title={snapshot.title}
              summary={snapshot.summary}
              inputs={snapshot.inputs}
              outputs={snapshot.outputs}
              href={snapshot.href}
            />
          ) : null}
          {matchProfile ? (
            <CalcMatchCTA profile={matchProfile} label={matchLabel} />
          ) : null}
        </div>
      )}
    </Card>
  );
}
