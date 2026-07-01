'use client';

import { useCallback, useRef } from 'react';

/**
 * Calculator analytics — GA4 events with consent gating.
 *
 * Consent: set localStorage.setItem('analytics_consent', 'granted') after user opt-in.
 * GA4: requires NEXT_PUBLIC_GA4_ID + GtagProvider in app/layout.tsx.
 *
 * SUPABASE_READY: mirror events to saved_scenarios table for logged-in users.
 */

export type CalcEventName =
  | 'calc_launch'
  | 'calc_preset'
  | 'calc_export_csv'
  | 'calc_print'
  | 'calc_match_click'
  | 'calc_lead_submit'
  | 'calc_input_change'
  | 'calc_banner_view'
  | 'calc_banner_dismiss'
  | 'calc_banner_cta_click';

/** @deprecated Use CalcEventName */
export type CalcEvent = CalcEventName;

export interface CalcEventParams {
  calc_id?: string;
  calc_name?: string;
  loan_amount?: number;
  rate?: number;
  loan_type?: string;
  credit_tier?: string;
  payment?: number;
  ltv?: number;
  variant?: string;
  ab_variant?: string;
  source?: string;
  /** Additional GA4-safe scalar params */
  [key: string]: string | number | boolean | undefined;
}

type GtagWindow = Window & {
  gtag?: (...args: unknown[]) => void;
  dataLayer?: unknown[];
};

const CONSENT_KEY = 'analytics_consent';
const CONSENT_GRANTED_VALUES = new Set(['granted', 'true', '1']);

function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const consent = localStorage.getItem(CONSENT_KEY);
    return consent != null && CONSENT_GRANTED_VALUES.has(consent.toLowerCase());
  } catch {
    return false;
  }
}

function sanitizeParams(params?: CalcEventParams): Record<string, string | number | boolean> {
  if (!params) return {};
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      out[k] = v;
    }
  }
  return out;
}

function dispatchCalcEvent(name: CalcEventName, params: Record<string, string | number | boolean>) {
  try {
    window.dispatchEvent(
      new CustomEvent('lth-calc', { detail: { name, ...params } }),
    );
  } catch {
    /* non-fatal */
  }
}

/**
 * Track a calculator event. Respects analytics consent before calling gtag.
 * Always dispatches internal CustomEvent for debugging / future pipelines.
 */
export function trackCalcEvent(
  name: CalcEventName,
  params?: CalcEventParams,
): void {
  if (typeof window === 'undefined') return;

  const safeParams = sanitizeParams(params);

  try {
    const w = window as GtagWindow;
    const consent = hasAnalyticsConsent();

    if (consent && typeof w.gtag === 'function') {
      w.gtag('event', name, {
        event_category: 'calculators',
        ...safeParams,
      });
    }

    dispatchCalcEvent(name, safeParams);

    if (process.env.NODE_ENV === 'development') {
      console.debug('[LTH Calc Analytics]', name, safeParams, { consent, gtag: !!w.gtag });
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[LTH Calc Analytics] trackCalcEvent failed:', name, err);
    }
  }
}

/** Grant analytics consent (call from cookie banner / preferences UI) */
export function grantAnalyticsConsent(): void {
  try {
    localStorage.setItem(CONSENT_KEY, 'granted');
  } catch {
    /* storage blocked */
  }
}

/** Revoke analytics consent */
export function revokeAnalyticsConsent(): void {
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch {
    /* storage blocked */
  }
}

export function isAnalyticsConsentGranted(): boolean {
  return hasAnalyticsConsent();
}

/**
 * Hook for calculator components — binds calc_id context to every event.
 *
 * @example
 * const { track, trackMatch } = useCalculatorTracking('payment', 'Mortgage Payment');
 * track('calc_preset', { preset_name: 'fl_first_time' });
 * trackMatch({ loan_amount: 340000, rate: 6.75 });
 */
export function useCalculatorTracking(calcId: string, calcName?: string) {
  const contextRef = useRef({ calc_id: calcId, calc_name: calcName });

  const track = useCallback(
    (event: CalcEventName, params?: CalcEventParams) => {
      trackCalcEvent(event, {
        ...contextRef.current,
        ...params,
      });
    },
    [],
  );

  const trackLaunch = useCallback(() => {
    track('calc_launch');
  }, [track]);

  const trackMatch = useCallback(
    (matchParams?: Pick<CalcEventParams, 'loan_amount' | 'rate' | 'loan_type' | 'payment' | 'ltv'>) => {
      track('calc_match_click', matchParams);
    },
    [track],
  );

  const trackExport = useCallback(
    (format: 'csv' | 'print') => {
      track(format === 'csv' ? 'calc_export_csv' : 'calc_print');
    },
    [track],
  );

  const trackPreset = useCallback(
    (presetName: string) => {
      track('calc_preset', { preset_name: presetName });
    },
    [track],
  );

  return {
    track,
    trackLaunch,
    trackMatch,
    trackExport,
    trackPreset,
    calcId,
  };
}