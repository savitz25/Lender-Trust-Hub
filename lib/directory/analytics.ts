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

type GtagWindow = Window & { gtag?: (...args: unknown[]) => void };

export function trackDirectoryEvent(event: DirectoryEvent): void {
  if (typeof window === 'undefined') return;

  const w = window as GtagWindow;
  if (w.gtag) {
    const { name, ...params } = event;
    w.gtag('event', name, params);
  }

  if (process.env.NODE_ENV === 'development') {
    console.debug('[LTH Analytics]', event);
  }
}