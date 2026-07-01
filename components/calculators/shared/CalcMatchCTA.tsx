'use client';

import { useState } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { MatchLenderButton } from '@/components/MatchLenderButton';
import { buildCalcMatchFilters, personalizeMessage, type CalcMatchProfile } from '@/lib/calculators/match-profile';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';

export function CalcMatchCTA({
  profile,
  label = 'Match Me to Local Lenders',
}: {
  profile: CalcMatchProfile;
  label?: string;
}) {
  const [matched, setMatched] = useState(false);
  const filters = buildCalcMatchFilters(profile);
  const message = personalizeMessage(profile);

  return (
    <div className="space-y-4">
      {message && (
        <p className="flex items-start gap-2 text-sm font-medium text-[#0F172A] dark:text-zinc-200">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          {message}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <MatchLenderButton
          filters={filters}
          label={label}
          className="flex-1"
          onNavigate={() => setMatched(true)}
        />
        {matched && (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600" role="status">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Profile sent to directory
          </span>
        )}
      </div>
      {/* Supabase-ready: saved scenarios + lead capture post-calculation */}
      <LeadCaptureForm stateName="your area" categoryId="mortgage" variant="sidebar-minimal" />
    </div>
  );
}