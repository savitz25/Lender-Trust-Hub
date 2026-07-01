/**
 * Calculator analytics hooks — wire to GA4 / A/B testing.
 * SUPABASE_READY: persist calc sessions to `saved_scenarios` table.
 */

export type CalcEvent =
  | 'calc_launch'
  | 'calc_preset'
  | 'calc_export_csv'
  | 'calc_print'
  | 'calc_match_click'
  | 'calc_lead_submit';

export function trackCalcEvent(name: CalcEvent, payload?: Record<string, string | number>) {
  if (typeof window === 'undefined') return;
  // GA4: gtag('event', name, payload)
  window.dispatchEvent(new CustomEvent('lth-calc', { detail: { name, ...payload } }));
  if (process.env.NODE_ENV === 'development') {
    console.debug('[LTH Calc]', name, payload);
  }
}