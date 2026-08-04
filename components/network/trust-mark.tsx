import {
  ASK_NETWORK_STANDARD_LABEL,
  ASK_NETWORK_STANDARD_LABEL_LONG,
  ASK_NETWORK_STANDARD_TOOLTIP,
  ASK_NETWORK_STANDARD_URL,
} from '@/lib/network/standard-version';

export type TrustMarkProps = {
  className?: string;
  variant?: 'chip' | 'text' | 'inline';
};

function cn(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(' ');
}

/**
 * Canonical Ask Trust Hub Standard mark.
 * Not a lender endorsement or paid badge.
 */
export function TrustMark({ className, variant = 'chip' }: TrustMarkProps) {
  const href = ASK_NETWORK_STANDARD_URL;
  const label =
    variant === 'text' ? ASK_NETWORK_STANDARD_LABEL_LONG : ASK_NETWORK_STANDARD_LABEL;

  if (variant === 'text' || variant === 'inline') {
    return (
      <a
        href={href}
        className={cn(
          'text-xs font-medium text-zinc-500 underline-offset-2 hover:underline',
          variant === 'inline' && 'font-semibold',
          className
        )}
        rel="noopener noreferrer"
        title={ASK_NETWORK_STANDARD_TOOLTIP}
        aria-label={ASK_NETWORK_STANDARD_LABEL}
      >
        {label}
      </a>
    );
  }

  return (
    <a
      href={href}
      className={cn(
        'inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5',
        'text-[11px] font-semibold tracking-wide text-zinc-600',
        'transition-colors hover:border-blue-300 hover:text-zinc-900',
        className
      )}
      rel="noopener noreferrer"
      title={ASK_NETWORK_STANDARD_TOOLTIP}
      aria-label={ASK_NETWORK_STANDARD_LABEL}
    >
      {ASK_NETWORK_STANDARD_LABEL}
    </a>
  );
}

export const TrustStandardMark = TrustMark;
export const AskTrustHubStandardChip = TrustMark;
