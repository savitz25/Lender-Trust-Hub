import { ASK_TRUST_HUB } from '@/lib/network/ask-trust-hub';

type NetworkBelongingLineProps = {
  className?: string;
  align?: 'left' | 'center';
};

function cn(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(' ');
}

export function NetworkBelongingLine({
  className,
  align = 'center',
}: NetworkBelongingLineProps) {
  return (
    <p
      className={cn(
        'text-xs leading-relaxed text-zinc-500 sm:text-[13px]',
        align === 'center' && 'text-center',
        className
      )}
    >
      Part of{' '}
      <a
        href={ASK_TRUST_HUB.url}
        className="font-semibold text-zinc-700 underline-offset-2 hover:underline"
        rel="noopener noreferrer"
      >
        Ask Trust Hub
      </a>
      {' — '}
      independent research for moving, insurance, and home financing.
    </p>
  );
}
