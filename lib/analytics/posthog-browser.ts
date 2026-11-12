'use client';

import type { PostHog } from 'posthog-js';
import { analyticsEnvironment, posthogHost, posthogKey, shouldEnablePosthog } from './environment';
import { createPosthogClientGate } from './posthog-gate';
import { isReplayEvent, maskReplayAttribute, sanitizeCaptureResult, sanitizeCapturedNetworkRequest } from './privacy';
import { TRUSTHUB_HUB } from './trusthub-events';

async function loadPosthog(): Promise<PostHog | null> {
  const key = posthogKey();
  if (!key) return null;
  const posthog = (await import('posthog-js')).default;
  const superProperties = {
    hub: TRUSTHUB_HUB,
    environment: analyticsEnvironment(),
  };
  posthog.init(key, {
    api_host: posthogHost(),
    person_profiles: 'identified_only',
    capture_pageview: false,
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
    // Privacy: replay DOM snapshots can carry saved private notes and search text
    // echoed into result pages outside any mask selector, so session replay is off
    // for this hub regardless of the shared project setting. Heatmaps and dead-click
    // capture are off for the same reason.
    disable_session_recording: true,
    enable_heatmaps: false,
    capture_heatmaps: false,
    capture_dead_clicks: false,
    mask_all_text: true,
    autocapture: {
      capture_copied_text: false,
      capture_value_css_selector_allowlist: [],
      element_allowlist: ['a', 'button', 'form'],
      dom_event_allowlist: ['click', 'submit'],
      element_attribute_ignorelist: ['value', 'data-searched-name'],
    },
    before_send: (event) => {
      try {
        // Replay is disabled; drop any replay payload outright as defense in depth.
        if (event && isReplayEvent(event.event)) return null;
        return sanitizeCaptureResult(event);
      } catch {
        return null;
      }
    },
    session_recording: {
      maskAllInputs: true,
      maskInputOptions: {
        password: true,
        email: true,
        text: true,
        search: true,
        textarea: true,
        select: true,
        tel: true,
        number: true,
        url: true,
        hidden: true,
      },
      // Only relevant if replay is ever re-enabled in code: mask every text node.
      maskTextSelector: '*',
      maskAttributeFn: (name, value) => maskReplayAttribute(name, value),
      maskCapturedNetworkRequestFn: (request) => sanitizeCapturedNetworkRequest(request),
    },
    loaded: (instance) => {
      instance.register(superProperties);
    },
  });
  try {
    posthog.register(superProperties);
  } catch {
    // loaded() registers the same properties once the client is ready.
  }
  return posthog;
}

const gate = createPosthogClientGate<PostHog>(loadPosthog);

export async function getPosthogBrowser(): Promise<PostHog | null> {
  try {
    if (typeof window === 'undefined') return null;
    if (!shouldEnablePosthog()) return null;
    return await gate.get();
  } catch {
    return null;
  }
}
