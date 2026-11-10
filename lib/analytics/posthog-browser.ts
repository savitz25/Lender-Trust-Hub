'use client';

import type { PostHog } from 'posthog-js';
import { analyticsEnvironment, posthogHost, posthogKey, shouldEnablePosthog } from './environment';
import { createPosthogClientGate } from './posthog-gate';
import { maskReplayAttribute, sanitizeCaptureResult, sanitizeCapturedNetworkRequest } from './privacy';
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
      maskTextSelector: 'input, textarea, select, [contenteditable], [data-ph-mask]',
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
