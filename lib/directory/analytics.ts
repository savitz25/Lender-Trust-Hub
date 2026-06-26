/**
 * Analytics & conversion event hooks.
 *
 * Wire to GA4, Plausible, or Vercel Analytics by replacing the track() body.
 * All events use a consistent naming scheme for cross-vertical reporting.
 */

export type DirectoryEvent =
  | { name: 'directory_search'; category: string; state: string; query: string }
  | { name: 'directory_filter'; category: string; state: string; filter: string; value: string }
  | { name: 'directory_compare_add'; category: string; state: string; cert: string }
  | { name: 'directory_compare_clear'; category: string; state: string }
  | { name: 'directory_share'; category: string; state: string; method: 'native' | 'clipboard' }
  | { name: 'directory_bookmark'; category: string; state: string; action: 'add' | 'remove' }
  | { name: 'directory_lead_submit'; category: string; state: string; intent: string }
  | { name: 'directory_cta_click'; category: string; state: string; target: string }
  | { name: 'directory_state_switch'; category: string; from: string; to: string };

export function trackDirectoryEvent(event: DirectoryEvent): void {
  if (typeof window === 'undefined') return;

  // GA4 example (uncomment when gtag is loaded):
  // const w = window as Window & { gtag?: (...args: unknown[]) => void };
  // w.gtag?.('event', event.name, { ...event });

  // Vercel Analytics / custom endpoint placeholder:
  if (process.env.NODE_ENV === 'development') {
    console.debug('[LTH Analytics]', event);
  }
}