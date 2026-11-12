/**
 * Lender Trust Hub analytics privacy.
 * Raw search text never leaves the browser as an event property or URL query.
 */

export const SENSITIVE_QUERY_KEYS = [
  'q',
  'query',
  'question',
  'search',
  'text',
  'prompt',
  'keyword',
  'term',
  'input',
  'email',
  'name',
  'phone',
  'token',
  'code',
  'password',
  'access_token',
  'refresh_token',
  'session',
  'note',
  'notes',
  'body',
  'message',
  'otp',
  'auth_error',
  'error',
  'error_code',
  'error_description',
  'error_uri',
  'handoff',
] as const;

/** Substring match on the parameter name so variants (authError, id_token) are covered. */
const SENSITIVE_QUERY_KEY_PATTERN =
  /token|email|code|password|note|error|handoff|secret|otp|query|question|search|prompt|message|phone|ssn/i;

const FREE_TEXT_VALUE_MAX = 80;

export function isSensitiveQueryKey(key: string): boolean {
  let decoded = key;
  try {
    decoded = decodeURIComponent(key);
  } catch {
    decoded = key;
  }
  const lower = decoded.trim().toLowerCase();
  if ((SENSITIVE_QUERY_KEYS as readonly string[]).includes(lower)) return true;
  return SENSITIVE_QUERY_KEY_PATTERN.test(lower);
}

/** Values that are sentences, addresses, or other unbounded text rather than a short code. */
export function isFreeTextQueryValue(value: string): boolean {
  const decoded = value.replace(/\+/g, ' ');
  if (/\s/.test(decoded)) return true;
  if (decoded.includes('@')) return true;
  return decoded.length > FREE_TEXT_VALUE_MAX;
}

export const FORBIDDEN_EVENT_KEYS = [
  'q',
  'query',
  'question',
  'email',
  'name',
  'first_name',
  'last_name',
  'phone',
  'address',
  'ssn',
  'password',
  'token',
  'authorization',
  'cookie',
  'nmls',
  'note',
  'notes',
  'body',
  'message',
  'href',
  'url',
  'search',
  'auth_error',
  'error',
  'error_message',
  'error_description',
  'handoff',
] as const;

/** SDK ingest fields. Stripping `token` makes posthog-js drop the event. */
export const POSTHOG_RESERVED_KEYS = [
  'token',
  'distinct_id',
  'timestamp',
  'uuid',
  'event',
  'offset',
  'api_key',
] as const;

export function isPosthogReservedKey(key: string): boolean {
  const lower = key.toLowerCase();
  if (lower.startsWith('$')) return true;
  return (POSTHOG_RESERVED_KEYS as readonly string[]).includes(lower);
}

const PAGE_URL_PROPERTY_KEYS = [
  '$current_url',
  '$referrer',
  '$initial_current_url',
  '$session_entry_url',
  '$entry_current_url',
  '$initial_referrer',
  '$session_entry_referrer',
  '$prev_pageview_url',
] as const;

const AUTOCAPTURE_URL_KEYS = [
  '$external_click_url',
  '$el_href',
  'attr__href',
  'attr__action',
  'attr__formaction',
  'attr__src',
] as const;

const URL_BASE = 'https://www.lendertrusthub.com';

export function sanitizeAnalyticsUrl(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined;
  try {
    const url = new URL(raw, URL_BASE);
    for (const key of [...url.searchParams.keys()]) {
      const values = url.searchParams.getAll(key);
      if (isSensitiveQueryKey(key) || values.some((value) => isFreeTextQueryValue(value))) {
        url.searchParams.delete(key);
      }
    }
    url.hash = '';
    url.username = '';
    url.password = '';
    return `${url.origin}${url.pathname}${url.search}`;
  } catch {
    return undefined;
  }
}

/** `$pathname` is usually a path. If a query string was copied onto it, strip free text there too. */
export function sanitizeAnalyticsPathname(raw: string | undefined | null): string {
  if (!raw) return '/';
  const trimmed = raw.trim();
  if (!trimmed) return '/';
  const absolute =
    trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `${URL_BASE}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
  const sanitized = sanitizeAnalyticsUrl(absolute);
  if (!sanitized) return trimmed.split('#')[0]?.split('?')[0] || '/';
  try {
    const url = new URL(sanitized);
    return `${url.pathname}${url.search}` || '/';
  } catch {
    return trimmed.split('#')[0]?.split('?')[0] || '/';
  }
}

export function redactSensitiveParamsInText(text: string): string {
  return text.replace(/([?&]|&amp;)([^=&;"'\s]+)=([^&;"'\s]*)/g, (match, lead: string, key: string, value: string) => {
    let decodedKey = key;
    let decodedValue = value;
    try {
      decodedKey = decodeURIComponent(key);
    } catch {
      decodedKey = key;
    }
    try {
      decodedValue = decodeURIComponent(value);
    } catch {
      decodedValue = value;
    }
    if (isSensitiveQueryKey(decodedKey) || isFreeTextQueryValue(decodedValue)) {
      return `${lead}${key}=[redacted]`;
    }
    return match;
  });
}

export function sanitizeCapturedNetworkRequest<T extends { name?: string }>(request: T): T {
  if (typeof request.name === 'string') {
    request.name = sanitizeAnalyticsUrl(request.name) ?? request.name.split('#')[0]?.split('?')[0] ?? request.name;
  }
  return request;
}

/** Session replay attribute mask. Leaves class/id alone and strips search text from URLs. */
export function maskReplayAttribute(name: string, value: string): string {
  const lower = name.toLowerCase();
  if (lower === 'data-searched-name' || lower === 'value') return '';
  if (lower === 'href' || lower === 'src' || lower === 'action' || lower === 'formaction') {
    return sanitizeAnalyticsUrl(value) ?? value.split('#')[0]?.split('?')[0] ?? value;
  }
  return value;
}

function sanitizeUrlProperties(target: Record<string, unknown>): void {
  for (const key of PAGE_URL_PROPERTY_KEYS) {
    if (typeof target[key] === 'string') target[key] = sanitizeAnalyticsUrl(target[key] as string);
  }
  if (typeof target.$pathname === 'string') {
    target.$pathname = sanitizeAnalyticsPathname(target.$pathname as string);
  }
}

function deleteForbiddenKeys(properties: Record<string, unknown>): void {
  for (const key of Object.keys(properties)) {
    if (isPosthogReservedKey(key)) continue;
    const lower = key.toLowerCase();
    if ((FORBIDDEN_EVENT_KEYS as readonly string[]).includes(lower)) delete properties[key];
  }
}

function scrubEmailIdentity(properties: Record<string, unknown>): void {
  for (const key of ['distinct_id', 'email', '$email']) {
    const value = properties[key];
    if (typeof value === 'string' && value.includes('@')) delete properties[key];
  }
}

export function sanitizePageviewProperties(properties: Record<string, unknown>): Record<string, unknown> {
  sanitizeUrlProperties(properties);
  for (const bag of ['$set', '$set_once'] as const) {
    const nested = properties[bag];
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      sanitizeUrlProperties(nested as Record<string, unknown>);
      deleteForbiddenKeys(nested as Record<string, unknown>);
      scrubEmailIdentity(nested as Record<string, unknown>);
    }
  }
  sanitizeAutocaptureUrls(properties);
  const path = String(properties.$pathname || properties.$current_url || '');
  if (path.includes('/ask')) {
    properties.$title = 'Lender Trust Hub';
    properties.title = 'Lender Trust Hub';
  }
  deleteForbiddenKeys(properties);
  scrubEmailIdentity(properties);
  return properties;
}

export function sanitizeCaptureResult<T extends { properties?: Record<string, unknown> } | null>(event: T): T {
  if (!event?.properties) return event;
  try {
    sanitizePageviewProperties(event.properties);
    return event;
  } catch {
    for (const key of [...PAGE_URL_PROPERTY_KEYS, '$pathname']) {
      delete event.properties[key];
    }
    return event;
  }
}

function sanitizeAutocaptureUrls(properties: Record<string, unknown>): void {
  for (const key of AUTOCAPTURE_URL_KEYS) {
    if (typeof properties[key] === 'string') {
      properties[key] = sanitizeAnalyticsUrl(properties[key] as string) ?? '[redacted]';
    }
  }
  if (typeof properties.$elements_chain === 'string') {
    properties.$elements_chain = redactSensitiveParamsInText(properties.$elements_chain);
  }
  if (Array.isArray(properties.$elements)) {
    for (const element of properties.$elements) {
      if (!element || typeof element !== 'object') continue;
      const record = element as Record<string, unknown>;
      for (const key of AUTOCAPTURE_URL_KEYS) {
        if (typeof record[key] === 'string') {
          record[key] = sanitizeAnalyticsUrl(record[key] as string) ?? '[redacted]';
        }
      }
      if (typeof record.href === 'string') {
        record.href = sanitizeAnalyticsUrl(record.href) ?? '[redacted]';
      }
    }
  }
}

export function stripForbiddenProperties(
  props: Record<string, unknown> | undefined,
): Record<string, string | number | boolean> {
  const cleaned: Record<string, string | number | boolean> = {};
  if (!props) return cleaned;
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('$')) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        cleaned[key] = value;
      }
      continue;
    }
    const lower = key.toLowerCase();
    if ((FORBIDDEN_EVENT_KEYS as readonly string[]).includes(lower)) continue;
    if (/email|password|token|ssn|phone|nmls/.test(lower)) continue;
    if (value === null || value === undefined) continue;
    if (typeof value === 'string' && value.includes('@')) continue;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      cleaned[key] = value;
    }
  }
  return cleaned;
}
