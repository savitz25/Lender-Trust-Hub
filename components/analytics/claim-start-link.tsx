'use client';

import type { ReactNode } from 'react';
import { captureTrustEvent } from '@/lib/analytics/trusthub';
import { TRUSTHUB_EVENTS } from '@/lib/analytics/trusthub-events';

export function ClaimStartLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      className={className}
      href={href}
      onClick={() => {
        captureTrustEvent(
          TRUSTHUB_EVENTS.CLAIM_STARTED,
          { surface: 'claim', success: true },
          { sendBeforeUnload: true },
        );
      }}
    >
      {children}
    </a>
  );
}
