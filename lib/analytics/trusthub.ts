'use client';

import { analyticsEnvironment, shouldEnablePosthog } from './environment';
import { getPosthogBrowser } from './posthog-browser';
import { sanitizeAnalyticsPathname, sanitizeAnalyticsUrl, stripForbiddenProperties } from './privacy';
import { TRUSTHUB_HUB, type TrustHubEventName, type TrustHubEventProperties } from './trusthub-events';

export function commonTrustHubProperties(
  extra?: Partial<TrustHubEventProperties>,
): Record<string, string | number | boolean> {
  return stripForbiddenProperties({
    hub: TRUSTHUB_HUB,
    environment: analyticsEnvironment(),
    ...extra,
  });
}

export type TrustHubCaptureOptions = {
  /** Use before a full-page navigation. Does not sleep. */
  sendBeforeUnload?: boolean;
};

let lastPageviewPath = '';

export function captureTrustEvent(
  event: TrustHubEventName | string,
  properties?: Partial<TrustHubEventProperties>,
  options?: TrustHubCaptureOptions,
): void {
  try {
    if (!shouldEnablePosthog()) return;
    const payload = commonTrustHubProperties(properties);
    void getPosthogBrowser()
      .then((posthog) => {
        if (!posthog) return;
        if (options?.sendBeforeUnload) {
          posthog.capture(event, payload, { send_instantly: true, transport: 'sendBeacon' });
          return;
        }
        posthog.capture(event, payload);
      })
      .catch(() => undefined);
  } catch {
    // Observability must never break product flows.
  }
}

export function captureSanitizedPageview(pathname: string, href?: string): void {
  try {
    const path = sanitizeAnalyticsPathname(pathname);
    const bare = path.split('?')[0] || '/';
    if (lastPageviewPath === bare) return;
    lastPageviewPath = bare;
    captureTrustEvent('$pageview', {
      surface: 'app_router',
      $pathname: path,
      $current_url: sanitizeAnalyticsUrl(href || (typeof window !== 'undefined' ? window.location.href : pathname)),
    });
  } catch {
    // ignore
  }
}
