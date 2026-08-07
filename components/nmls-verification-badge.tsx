import { ShieldCheck, ShieldAlert } from 'lucide-react';
import {
  resolveNmlsVerification,
  type NmlsVerificationDisplay,
} from '@/lib/verification';

type Props = {
  nmlsId?: string | null;
  nmlsVerified?: boolean | null;
  className?: string;
  showOnFile?: boolean;
};

export function getNmlsVerificationDisplay(
  nmlsId?: string | null,
  nmlsVerified?: boolean | null
): NmlsVerificationDisplay {
  return resolveNmlsVerification({ nmlsId, nmlsVerified });
}

export function NmlsVerificationBadge({
  nmlsId,
  nmlsVerified,
  className = '',
  showOnFile = true,
}: Props) {
  const v = resolveNmlsVerification({ nmlsId, nmlsVerified });

  if (v.showNmlsVerifiedBadge) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ${className}`}
      >
        <ShieldCheck className="h-3 w-3" aria-hidden="true" />
        {v.badgeLabel}
      </span>
    );
  }

  if (showOnFile && v.badgeVariant === 'on_file' && v.badgeLabel) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 ${className}`}
      >
        <ShieldAlert className="h-3 w-3" aria-hidden="true" />
        {v.badgeLabel}
      </span>
    );
  }

  return null;
}
