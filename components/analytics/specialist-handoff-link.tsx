'use client';

import type { ReactNode } from 'react';
import { CrossHubLink } from '@/components/network/cross-hub-link';
import { captureTrustEvent } from '@/lib/analytics/trusthub';
import { specialistHubFromHref, TRUSTHUB_EVENTS } from '@/lib/analytics/trusthub-events';

export function SpecialistHandoffLink({
  href,
  surface,
  state,
  className,
  children,
}: {
  href: string;
  surface: string;
  state?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <CrossHubLink
      href={href}
      currentHub="lender"
      className={className}
      onClick={() => {
        const specialistHub = specialistHubFromHref(href);
        if (!specialistHub) return;
        captureTrustEvent(
          TRUSTHUB_EVENTS.SPECIALIST_HANDOFF_STARTED,
          {
            surface,
            specialist_hub: specialistHub,
            state,
            success: true,
          },
          { sendBeforeUnload: true },
        );
      }}
    >
      {children}
    </CrossHubLink>
  );
}
