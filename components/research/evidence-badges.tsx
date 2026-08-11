import Link from 'next/link';
import { BadgeCheck, Building2, FileText, MapPin, Scale } from 'lucide-react';
import type { Lender } from '@/lib/mockData';
import {
  getLenderEvidenceBadges,
  type EvidenceBadge,
} from '@/lib/research/research-signals';
import { cn } from '@/lib/utils';

const ICONS: Record<string, typeof BadgeCheck> = {
  nmls: BadgeCheck,
  local: MapPin,
  ratings: Scale,
  cfpb: FileText,
  hmda: Building2,
  contact: FileText,
};

/**
 * Evidence chips — replaces decorative 0–100 “Research Score” presentation.
 * Only shows signals that are actually present (or explicit missing for compact=false).
 */
export function EvidenceBadges({
  lender,
  className,
  compact = true,
  showAbsent = false,
  hmdaAvailable,
  cfpbRecordAvailable,
}: {
  lender: Lender;
  className?: string;
  compact?: boolean;
  /** When true, also show muted chips for missing evidence (profile detail). */
  showAbsent?: boolean;
  hmdaAvailable?: boolean;
  cfpbRecordAvailable?: boolean;
}) {
  const badges = getLenderEvidenceBadges(lender, {
    hmdaAvailable,
    cfpbRecordAvailable,
  });
  const visible = showAbsent ? badges : badges.filter((b) => b.present);

  if (visible.length === 0) {
    return (
      <p className={cn('text-xs text-zinc-500', className)}>
        Limited public signals on file — re-check on NMLS Consumer Access.
      </p>
    );
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <ul className="flex flex-wrap gap-1.5" aria-label="Research evidence">
        {visible.map((b) => (
          <EvidenceChip key={b.id} badge={b} compact={compact} />
        ))}
      </ul>
      {!compact ? (
        <p className="text-[11px] leading-snug text-zinc-500">
          Evidence chips are not rankings, approval odds, or a grade.{' '}
          <Link href="/methodology#scores" className="font-medium text-[#059669] hover:underline">
            Methodology
          </Link>
        </p>
      ) : null}
    </div>
  );
}

function EvidenceChip({ badge, compact }: { badge: EvidenceBadge; compact: boolean }) {
  const Icon = ICONS[badge.id] ?? BadgeCheck;
  return (
    <li
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        badge.present
          ? 'border-emerald-200 bg-emerald-50/80 text-emerald-950'
          : 'border-zinc-200 bg-zinc-50 text-zinc-500'
      )}
      title={badge.detail}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      <span>{badge.label}</span>
      {!compact && badge.detail ? (
        <span className="sr-only">{badge.detail}</span>
      ) : null}
    </li>
  );
}
