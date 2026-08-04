import { ASK_TRUST_HUB } from '@/lib/network/ask-trust-hub';

type TrustMarkProps = {
  className?: string;
  variant?: 'chip' | 'text';
};

function cn(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(' ');
}

/** Links to Ask methodology — network product signal. */
export function TrustMark({ className, variant = 'chip' }: TrustMarkProps) {
  if (variant === 'text') {
    return (
      <a
        href={ASK_TRUST_HUB.methodologyUrl}
        className={cn(
          'text-xs font-medium text-zinc-500 underline-offset-2 hover:underline',
          className
        )}
        rel="noopener noreferrer"
      >
        Researched to the Ask Trust Hub Standard
      </a>
    );
  }

  return (
    <a
      href={ASK_TRUST_HUB.methodologyUrl}
      className={cn(
        'inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5',
        'text-[11px] font-semibold tracking-wide text-zinc-600',
        'transition-colors hover:border-blue-300 hover:text-zinc-900',
        className
      )}
      rel="noopener noreferrer"
    >
      Ask Trust Hub Standard
    </a>
  );
}
